# Lupa Dictionary Dataset

`/lupa` is wired to load random shards from:

- `/public/data/lupa/manifest.json`
- `/public/data/lupa/shards/*.json`

If the manifest does not exist, it falls back to `/public/data/spanish-dictionary.json`.

## Source choice

For a complete, real dictionary we use **Wikcionario (eswiktionary)** data via Wikimedia dumps + wiktextract-compatible JSONL.

## Build pipeline

1. Download the raw extracted JSONL (or `.gz`) to `data/lupa/raw/`.

Example:

```bash
mkdir -p data/lupa/raw
# Get the current .gz link from:
# https://kaikki.org/eswiktionary/rawdata.html
curl -L "<RAW_JSONL_GZ_URL>" -o data/lupa/raw/eswiktionary.jsonl.gz
```

2. Build normalized shards:

```bash
npm run lupa:build-dataset
```

Optional arguments:

```bash
node tooling/lupa/build-wiktionary-dataset.mjs --input data/lupa/raw/eswiktionary.jsonl.gz --out-dir public/data/lupa --shard-size 1800
```

## Runtime behavior

- On each refresh, the loader picks a random subset of shards.
- The paper layout then composes dense columns from that subset.

## License and attribution

This dataset is derived from Wikcionario/Wikimedia content.
Respect the licensing terms (CC BY-SA + GFDL) and keep attribution visible in product credits.
