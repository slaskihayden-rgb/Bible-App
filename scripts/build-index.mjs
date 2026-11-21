/**
 * Precompute normalized MiniLM embeddings for every KJV verse and quantize
 * them to int8. Run once, then commit public/data. The site build does not
 * need to repeat this.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { pipeline, env } from "@xenova/transformers";
import { embeddingInput } from "../src/text.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const csvPath = path.join(root, "data", "KJV.csv");
const outDir = path.join(root, "public", "data");
const modelDir = path.join(root, "public", "models");

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const len = text.length;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  function readRow() {
    const cells = [];
    let cell = "";
    let quoted = false;
    while (i < len) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            cell += '"';
            i += 2;
            continue;
          }
          quoted = false;
          i += 1;
          continue;
        }
        cell += ch;
        i += 1;
        continue;
      }
      if (ch === '"') {
        quoted = true;
        i += 1;
        continue;
      }
      if (ch === ",") {
        cells.push(cell);
        cell = "";
        i += 1;
        continue;
      }
      if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i += 1;
        i += 1;
        cells.push(cell);
        return cells;
      }
      cell += ch;
      i += 1;
    }
    if (cell.length || cells.length) {
      cells.push(cell);
      return cells;
    }
    return null;
  }
  const header = readRow();
  if (!header || header[0] !== "Book") throw new Error("Unexpected KJV CSV header");
  while (i < len) {
    const row = readRow();
    if (!row || row.length < 4) continue;
    rows.push({
      book: row[0],
      chapter: Number(row[1]),
      verse: Number(row[2]),
      text: row.slice(3).join(","),
    });
  }
  return rows;
}

function quantize(values) {
  const out = new Int8Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    let q = Math.round(values[i] * 127);
    if (q > 127) q = 127;
    if (q < -127) q = -127;
    out[i] = q;
  }
  return out;
}

env.localModelPath = modelDir;
env.allowRemoteModels = false;
env.allowLocalModels = true;

const verses = parseCsv(readFileSync(csvPath, "utf8"));
if (verses.length !== 31102) {
  throw new Error(`Expected 31102 verses, found ${verses.length}`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "verses.json"), JSON.stringify({ verses }));

const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
  quantized: true,
});

const dim = 384;
const matrix = new Int8Array(verses.length * dim);
const batchSize = 32;
const started = Date.now();
for (let start = 0; start < verses.length; start += batchSize) {
  const batch = verses.slice(start, start + batchSize).map((verse) => embeddingInput(verse.text) || ".");
  const output = await extractor(batch, { pooling: "mean", normalize: true });
  const data = output.data;
  if (output.dims[1] !== dim) throw new Error(`Unexpected embedding dim ${output.dims[1]}`);
  const quantized = quantize(data);
  matrix.set(quantized, start * dim);
  if (start === 0) {
    let norm = 0;
    for (let j = 0; j < dim; j += 1) norm += data[j] * data[j];
    if (Math.abs(Math.sqrt(norm) - 1) > 0.02) {
      throw new Error(`Embedding was not normalized (norm ${Math.sqrt(norm)})`);
    }
  }
  if (start % 640 === 0 || start + batchSize >= verses.length) {
    const done = Math.min(verses.length, start + batchSize);
    const rate = done / ((Date.now() - started) / 1000);
    console.log(`${done}/${verses.length}  ${rate.toFixed(1)} verses/s`);
  }
}

writeFileSync(path.join(outDir, "embeddings.bin"), matrix);
writeFileSync(path.join(outDir, "meta.json"), JSON.stringify({
  model: "Xenova/all-MiniLM-L6-v2",
  upstream: "sentence-transformers/all-MiniLM-L6-v2",
  quantizedModel: true,
  pooling: "mean",
  normalize: true,
  dim,
  count: verses.length,
  quantization: "int8",
  scale: 127,
  source: "scrollmapper/bible_databases branch 2025, formats/csv/KJV.csv",
  text: "King James Version (1769), public domain in the United States",
}, null, 2));
console.log(`Wrote ${matrix.length} bytes to public/data/embeddings.bin`);
