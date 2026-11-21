import { pipeline, env } from "@xenova/transformers";
import { buildSearchIndex, rankVerses } from "./rank.js";
import { embeddingInput } from "./text.js";

const base = import.meta.env.BASE_URL;

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = `${base}models/`;
env.backends.onnx.wasm.wasmPaths = `${base}wasm/`;
env.backends.onnx.wasm.numThreads = 1;

let ready = null;

function post(message) {
  self.postMessage(message);
}

async function fetchBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Missing ${url}`);
  return response.arrayBuffer();
}

async function init() {
  post({ type: "status", message: "Opening the scriptures…", progress: 0.08 });
  const [versePayload, embeddingBuffer, meta] = await Promise.all([
    fetch(`${base}data/verses.json`).then((response) => {
      if (!response.ok) throw new Error("The Bible text did not load.");
      return response.json();
    }),
    fetchBuffer(`${base}data/embeddings.bin`),
    fetch(`${base}data/meta.json`).then((response) => response.json()),
  ]);
  const verses = versePayload.verses;
  const matrix = new Int8Array(embeddingBuffer);
  if (matrix.length !== verses.length * meta.dim) {
    throw new Error("The search index does not match the Bible text.");
  }
  post({ type: "status", message: "Preparing search…", progress: 0.4 });
  const index = buildSearchIndex(verses);
  post({ type: "status", message: "Loading the reading model…", progress: 0.55 });
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    quantized: true,
    progress_callback(info) {
      if (info.status === "progress" && info.total) {
        post({
          type: "status",
          message: "Loading the reading model…",
          progress: 0.55 + 0.4 * (info.loaded / info.total),
        });
      }
    },
  });
  return { verses, matrix, index, extractor };
}

self.onmessage = async (event) => {
  try {
    if (event.data.type === "init") {
      ready = await init();
      post({ type: "ready" });
      return;
    }
    if (event.data.type === "search") {
      if (!ready) ready = await init();
      const { verses, matrix, index, extractor } = ready;
      const output = await extractor(embeddingInput(event.data.query), {
        pooling: "mean",
        normalize: true,
      });
      const results = rankVerses({
        query: event.data.query,
        queryVec: output.data,
        verses,
        matrix,
        index,
      });
      post({ type: "results", id: event.data.id, results });
    }
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : "Search failed." });
  }
};
