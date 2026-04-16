import { LUPA_DICTIONARY_REFRESH_SHARD_COUNT } from "@/lib/lupa/constants";

export type DictionaryEntry = {
  word: string;
  pos?: string;
  definition: string;
  shortDefinition?: string;
  example?: string;
  etymology?: string;
};

type DictionaryPayloadEntry = {
  word?: unknown;
  pos?: unknown;
  definition?: unknown;
  shortDefinition?: unknown;
  example?: unknown;
  etymology?: unknown;
};

type DictionaryShardInfo = {
  file: string;
  entries: number;
};

type DictionaryManifest = {
  shards: DictionaryShardInfo[];
};

const MANIFEST_URL = "/data/lupa/manifest.json";
const LEGACY_DATASET_URL = "/data/spanish-dictionary.json";

let manifestCache: DictionaryManifest | null | undefined;

const normalizeRequiredString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeEntry = (value: unknown): DictionaryEntry | null => {
  // Defensive guard: ignore non-object payload values immediately.
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as DictionaryPayloadEntry;
  const word = normalizeRequiredString(entry.word);
  const definition = normalizeRequiredString(entry.definition);

  // Required fields must be valid non-empty strings.
  // If they are malformed, we skip this entry gracefully.
  if (!word || !definition) {
    return null;
  }

  const pos = normalizeOptionalString(entry.pos);
  const shortDefinition = normalizeOptionalString(entry.shortDefinition);
  const example = normalizeOptionalString(entry.example);
  const etymology = normalizeOptionalString(entry.etymology);

  return {
    word,
    definition,
    ...(pos ? { pos } : {}),
    ...(shortDefinition ? { shortDefinition } : {}),
    ...(example ? { example } : {}),
    ...(etymology ? { etymology } : {}),
  };
};

const normalizeShardInfo = (value: unknown): DictionaryShardInfo | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const shard = value as { file?: unknown; entries?: unknown };
  if (typeof shard.file !== "string" || shard.file.length === 0) {
    return null;
  }

  const entries =
    typeof shard.entries === "number" && Number.isFinite(shard.entries) && shard.entries > 0
      ? Math.floor(shard.entries)
      : 0;

  return {
    file: shard.file,
    entries,
  };
};

const normalizeManifest = (value: unknown): DictionaryManifest | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as { shards?: unknown };
  if (!Array.isArray(payload.shards)) {
    return null;
  }

  const shards = payload.shards.map(normalizeShardInfo).filter((item): item is DictionaryShardInfo => Boolean(item));

  if (shards.length === 0) {
    return null;
  }

  return { shards };
};

const selectRandomContiguousIndexes = (total: number, targetCount: number) => {
  const count = Math.min(total, Math.max(1, targetCount));

  if (count >= total) {
    return [...Array(total).keys()];
  }

  const startMax = total - count;
  const start = Math.floor(Math.random() * (startMax + 1));
  const indexes: number[] = [];

  for (let index = 0; index < count; index += 1) {
    indexes.push(start + index);
  }

  return indexes;
};

const fetchManifest = async () => {
  if (manifestCache !== undefined) {
    return manifestCache;
  }

  try {
    const response = await fetch(MANIFEST_URL, { cache: "force-cache" });
    if (!response.ok) {
      manifestCache = null;
      return manifestCache;
    }

    const payload: unknown = await response.json();
    manifestCache = normalizeManifest(payload);
    return manifestCache;
  } catch {
    manifestCache = null;
    return manifestCache;
  }
};

const fetchEntriesFromUrl = async (url: string) => {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`No se pudo leer ${url}.`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error(`El archivo ${url} debe ser un arreglo JSON.`);
  }

  const entries: DictionaryEntry[] = [];
  // We intentionally skip invalid rows to keep the visual experiment resilient:
  // a few malformed items should not break the full scene.
  for (const item of payload) {
    const normalized = normalizeEntry(item);
    if (normalized) {
      entries.push(normalized);
    }
  }

  return entries;
};

const loadFromShards = async (manifest: DictionaryManifest) => {
  const indexes = selectRandomContiguousIndexes(
    manifest.shards.length,
    LUPA_DICTIONARY_REFRESH_SHARD_COUNT,
  );
  const urls = indexes.map((index) => `/data/lupa/shards/${manifest.shards[index].file}`);
  const results = await Promise.all(urls.map((url) => fetchEntriesFromUrl(url)));

  const entries: DictionaryEntry[] = [];
  for (const chunk of results) {
    entries.push(...chunk);
  }

  return entries;
};

export const loadSpanishDictionary = async (): Promise<DictionaryEntry[]> => {
  const manifest = await fetchManifest();

  if (manifest) {
    try {
      const shardEntries = await loadFromShards(manifest);
      if (shardEntries.length > 0) {
        return shardEntries;
      }
    } catch {
      // Fall through to legacy dataset to keep the scene available.
    }
  }

  const legacyEntries = await fetchEntriesFromUrl(LEGACY_DATASET_URL);
  if (legacyEntries.length === 0) {
    throw new Error("El diccionario no tiene entradas válidas.");
  }

  return legacyEntries;
};
