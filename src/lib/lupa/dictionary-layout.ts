import type { DictionaryEntry } from "@/lib/lupa/dictionary-loader";
import { LUPA_TYPOGRAPHY_SCALE } from "@/lib/lupa/constants";

export type DictionaryPaperEntry = {
  headword: string;
  posLabel: string;
  definition: string;
  example?: string;
  tone: number;
};

export type DictionaryLayout = {
  entries: DictionaryPaperEntry[];
  paddingPx: number;
  columnGapPx: number;
  minColumns: number;
  maxColumns: number;
  preferredColumnWidthPx: number;
  headwordFontSizePx: number;
  bodyFontSizePx: number;
  lineHeightPx: number;
  entryGapPx: number;
};

type BaseEntry = {
  headword: string;
  posLabel: string;
  shortDefinition: string;
  fullDefinition: string;
  example?: string;
  tone: number;
};

const TARGET_ENTRY_COUNT = 860;
const FALLBACK_ENTRY: BaseEntry = {
  headword: "lupa",
  posLabel: "sust.",
  shortDefinition: "Instrumento óptico para ampliar detalles sobre papel.",
  fullDefinition: "Instrumento óptico para ampliar detalles sobre papel impreso.",
  tone: 0.35,
};

const hashToUnit = (input: string) => {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
};

const abbreviatePos = (value?: string) => {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return "voz.";
  }

  if (normalized.startsWith("sust")) {
    return "sust.";
  }

  if (normalized.startsWith("adj")) {
    return "adj.";
  }

  if (normalized.startsWith("adv")) {
    return "adv.";
  }

  if (normalized.startsWith("verb")) {
    return "v.";
  }

  if (normalized.startsWith("prep")) {
    return "prep.";
  }

  if (normalized.startsWith("conj")) {
    return "conj.";
  }

  if (normalized.startsWith("pron")) {
    return "pron.";
  }

  if (normalized.startsWith("interj")) {
    return "interj.";
  }

  if (normalized.startsWith("loc")) {
    return "loc.";
  }

  return "voz.";
};

const toBaseEntry = (entry: DictionaryEntry): BaseEntry => ({
  headword: entry.word.trim().toLowerCase(),
  posLabel: abbreviatePos(entry.pos),
  shortDefinition: (entry.shortDefinition ?? entry.definition).trim(),
  fullDefinition: entry.definition.trim(),
  ...(entry.example ? { example: entry.example.trim() } : {}),
  tone: hashToUnit(`${entry.word}|${entry.definition}`),
});

export const createDictionaryLayout = (entries: DictionaryEntry[]): DictionaryLayout => {
  const sortedEntries =
    entries.length > 0
      ? [...entries].sort((left, right) =>
          left.word.localeCompare(right.word, "es", { sensitivity: "base" }),
        )
      : [];
  const normalizedEntries =
    sortedEntries.length > 0 ? sortedEntries.map(toBaseEntry) : [FALLBACK_ENTRY];

  const repeatedEntries: DictionaryPaperEntry[] = [];
  for (let index = 0; index < TARGET_ENTRY_COUNT; index += 1) {
    const source = normalizedEntries[index % normalizedEntries.length];
    const cycle = Math.floor(index / normalizedEntries.length);
    const useExtended = cycle % 5 === 0;
    const includeExample = Boolean(source.example) && (cycle + Math.floor(source.tone * 10)) % 4 === 0;

    repeatedEntries.push({
      headword: source.headword,
      posLabel: source.posLabel,
      definition: useExtended ? source.fullDefinition : source.shortDefinition,
      ...(includeExample && source.example ? { example: source.example } : {}),
      tone: source.tone,
    });
  }

  const typographyScale = Math.max(0.55, LUPA_TYPOGRAPHY_SCALE);

  return {
    entries: repeatedEntries,
    paddingPx: Math.round(26 * typographyScale),
    columnGapPx: Math.round(20 * typographyScale),
    minColumns: 4,
    maxColumns: 7,
    preferredColumnWidthPx: Math.round(180 * typographyScale),
    headwordFontSizePx: 9.2 * typographyScale,
    bodyFontSizePx: 8.1 * typographyScale,
    lineHeightPx: 9.6 * typographyScale,
    entryGapPx: Math.max(2, Math.round(3 * typographyScale)),
  };
};
