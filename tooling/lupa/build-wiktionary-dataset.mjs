#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { createGunzip } from "node:zlib";

const DEFAULT_INPUT = path.resolve("data/lupa/raw/eswiktionary.jsonl.gz");
const DEFAULT_OUTPUT_DIR = path.resolve("public/data/lupa");
const DEFAULT_SHARD_SIZE = 1800;
const MAX_WORD_LENGTH = 64;
const MAX_DEFINITION_LENGTH = 240;
const MAX_EXAMPLE_LENGTH = 180;
const MAX_ETYMOLOGY_LENGTH = 200;
const HEADWORD_PATTERN = /^[a-záéíóúüñ][a-záéíóúüñ0-9'"' -]{0,63}$/i;
const BLOCKED_POS = new Set([
  "suffix",
  "prefix",
  "infix",
  "interfix",
  "circumfix",
  "symbol",
  "character",
  "letter",
  "punctuation mark",
]);

const SOURCE_INFO = {
  name: "Wikcionario (eswiktionary)",
  url: "https://es.wiktionary.org",
  dumpProvider: "https://dumps.wikimedia.org/eswiktionary/latest/",
  extractionTool: "https://github.com/tatuylonen/wiktextract",
  license: "CC BY-SA + GFDL (Wikcionario/Wikimedia)",
  attribution: "Contenido derivado de Wikcionario (Wikimedia).",
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    input: DEFAULT_INPUT,
    outDir: DEFAULT_OUTPUT_DIR,
    shardSize: DEFAULT_SHARD_SIZE,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--input") {
      options.input = path.resolve(args[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--out-dir") {
      options.outDir = path.resolve(args[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (arg === "--shard-size") {
      const nextValue = Number(args[index + 1]);
      if (Number.isFinite(nextValue) && nextValue > 0) {
        options.shardSize = Math.floor(nextValue);
      }
      index += 1;
      continue;
    }
  }

  return options;
};

const normalizeText = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 0 ? compact : null;
};

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
};

const abbreviatePos = (value) => {
  const normalized = normalizeText(value)?.toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("noun") || normalized.startsWith("sust")) {
    return "sust.";
  }

  if (normalized.startsWith("verb")) {
    return "v.";
  }

  if (normalized.startsWith("adj")) {
    return "adj.";
  }

  if (normalized.startsWith("adv")) {
    return "adv.";
  }

  if (normalized.startsWith("prep")) {
    return "prep.";
  }

  if (normalized.startsWith("pron")) {
    return "pron.";
  }

  if (normalized.startsWith("interj")) {
    return "interj.";
  }

  if (normalized.startsWith("conj")) {
    return "conj.";
  }

  return undefined;
};

const extractDefinition = (record) => {
  const senses = Array.isArray(record.senses) ? record.senses : [];

  for (const sense of senses) {
    if (!sense || typeof sense !== "object") {
      continue;
    }

    const tags = Array.isArray(sense.tags) ? sense.tags : [];
    if (
      tags.includes("form-of") ||
      tags.includes("alt-of") ||
      tags.includes("misspelling")
    ) {
      continue;
    }

    const glosses = Array.isArray(sense.glosses) ? sense.glosses : [];
    const gloss = glosses.map(normalizeText).find(Boolean);
    if (!gloss) {
      continue;
    }

    const definition = truncate(gloss, MAX_DEFINITION_LENGTH);

    const examples = Array.isArray(sense.examples) ? sense.examples : [];
    const firstExample =
      examples
        .map((example) =>
          typeof example === "string"
            ? normalizeText(example)
            : normalizeText(example?.text),
        )
        .find(Boolean) ?? null;

    return {
      definition,
      example: firstExample
        ? truncate(firstExample, MAX_EXAMPLE_LENGTH)
        : undefined,
    };
  }

  return null;
};

const createShortDefinition = (definition) => {
  const sentence = definition.split(/[.;:]/)[0]?.trim() ?? definition;
  const normalized = sentence.length > 0 ? sentence : definition;
  return truncate(normalized, 92);
};

const openJsonlStream = (inputPath) => {
  const stream = createReadStream(inputPath);
  if (inputPath.endsWith(".gz")) {
    return stream.pipe(createGunzip());
  }

  return stream;
};

const buildDataset = async (options) => {
  const sourceStream = openJsonlStream(options.input);
  const lineReader = readline.createInterface({
    input: sourceStream,
    crlfDelay: Infinity,
  });

  const dedupe = new Set();
  const entries = [];
  let rawLines = 0;

  for await (const line of lineReader) {
    rawLines += 1;

    if (!line || line === "{}") {
      continue;
    }

    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    if (!record || typeof record !== "object") {
      continue;
    }

    if (record.lang_code !== "es") {
      continue;
    }

    const word = normalizeText(record.word)?.toLowerCase();
    if (
      !word ||
      word.length > MAX_WORD_LENGTH ||
      !HEADWORD_PATTERN.test(word)
    ) {
      continue;
    }

    const posRaw = normalizeText(record.pos)?.toLowerCase();
    if (posRaw && BLOCKED_POS.has(posRaw)) {
      continue;
    }

    const extracted = extractDefinition(record);
    if (!extracted) {
      continue;
    }

    const definition = normalizeText(extracted.definition);
    if (!definition) {
      continue;
    }

    const pos = abbreviatePos(record.pos);
    const shortDefinition = createShortDefinition(definition);
    const etymology = normalizeText(record.etymology_text);

    const signature = `${word}|${pos ?? ""}|${definition}`;
    if (dedupe.has(signature)) {
      continue;
    }

    dedupe.add(signature);
    entries.push({
      word,
      definition,
      ...(pos ? { pos } : {}),
      ...(shortDefinition ? { shortDefinition } : {}),
      ...(extracted.example ? { example: extracted.example } : {}),
      ...(etymology
        ? { etymology: truncate(etymology, MAX_ETYMOLOGY_LENGTH) }
        : {}),
    });
  }

  entries.sort((left, right) =>
    left.word.localeCompare(right.word, "es", { sensitivity: "base" }),
  );

  const shardDir = path.join(options.outDir, "shards");
  await mkdir(shardDir, { recursive: true });

  const shards = [];
  let shardIndex = 0;
  for (let start = 0; start < entries.length; start += options.shardSize) {
    const chunk = entries.slice(start, start + options.shardSize);
    const file = `eswiktionary-${String(shardIndex).padStart(4, "0")}.json`;
    await writeFile(path.join(shardDir, file), JSON.stringify(chunk));
    shards.push({
      file,
      entries: chunk.length,
    });
    shardIndex += 1;
  }

  const manifest = {
    source: SOURCE_INFO,
    generatedAt: new Date().toISOString(),
    rawLineCount: rawLines,
    totalEntries: entries.length,
    shardSize: options.shardSize,
    shards,
  };

  await writeFile(
    path.join(options.outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  const readme = [
    "# Lupa dictionary dataset",
    "",
    "Generated from eswiktionary using wiktextract-style JSONL.",
    "",
    `Generated at: ${manifest.generatedAt}`,
    `Total entries: ${manifest.totalEntries}`,
    `Shards: ${manifest.shards.length}`,
    "",
    "Source:",
    `- ${SOURCE_INFO.name}: ${SOURCE_INFO.url}`,
    `- Dumps: ${SOURCE_INFO.dumpProvider}`,
    `- Extractor: ${SOURCE_INFO.extractionTool}`,
    "",
    `License: ${SOURCE_INFO.license}`,
    `Attribution: ${SOURCE_INFO.attribution}`,
    "",
  ].join("\n");

  await writeFile(path.join(options.outDir, "README.md"), readme);
};

const main = async () => {
  const options = parseArgs();
  await buildDataset(options);
};

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Dataset generation failed."}\n`,
  );
  process.exitCode = 1;
});
