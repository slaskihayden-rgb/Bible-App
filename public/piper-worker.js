/* global createPiperPhonemize, ort */
/**
 * Optional on-device voice. Loaded only after the reader turns it on.
 * The voice is the open Piper model en_GB-northern_english_male, a synthetic
 * voice, not an impression of a particular person.
 */
importScripts(new URL("./ort/ort.wasm.min.js", self.location.href).href);

const root = new URL("./", self.location.href);
ort.env.wasm.wasmPaths = new URL("./ort/", self.location.href).href;
ort.env.wasm.numThreads = 1;

const VOICE_ONNX = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium.onnx";
const VOICE_JSON = `${VOICE_ONNX}.json`;
const CACHE = "bible-verses-piper-v1";

let session = null;
let voiceConfig = null;
let phonemize = null;
let cancelled = false;

function post(message) {
  self.postMessage(message);
}

async function cachedBytes(url, onProgress) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(url);
  if (cached) return cached.arrayBuffer();
  const response = await fetch(url);
  if (!response.ok) throw new Error("The voice could not be downloaded.");
  const length = Number(response.headers.get("content-length") || 0);
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (onProgress && length) onProgress(received, length);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    await cache.put(url, new Response(bytes.slice(), {
      headers: { "content-type": "application/octet-stream" },
    }));
  } catch {
    /* The voice still works for this visit if the phone cannot store it. */
  }
  return bytes.buffer;
}

function loadPhonemizer() {
  if (phonemize) return Promise.resolve(phonemize);
  importScripts(new URL("./piper/piper_phonemize.js", self.location.href).href);
  let lines = [];
  return createPiperPhonemize({
    print(line) {
      const text = String(line || "").trim();
      if (text.startsWith("{")) {
        try { lines.push(JSON.parse(text)); } catch { /* status lines are ignored */ }
      }
    },
    locateFile(file) {
      return new URL(`./piper/${file}`, root).href;
    },
  }).then((mod) => {
    phonemize = (texts) => {
      lines = [];
      const code = mod.callMain([
        "--espeak_data",
        "/espeak-ng-data",
        "--language",
        voiceConfig.espeak.voice,
        "--input",
        JSON.stringify(texts.map((text) => ({ text }))),
      ]);
      if (code) throw new Error("The voice could not read that line.");
      return lines.slice();
    };
    return phonemize;
  });
}

function pcmToWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

function sentences(text) {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks = [];
  let buffer = "";
  for (const part of parts) {
    if ((buffer + part).length > 240 && buffer) {
      chunks.push(buffer.trim());
      buffer = part;
    } else {
      buffer += part;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

async function synthesize(text) {
  const spoken = phonemize([text])[0];
  const ids = spoken?.phoneme_ids;
  if (!ids?.length) throw new Error("The voice could not read that line.");
  const feeds = {
    input: new ort.Tensor("int64", BigInt64Array.from(ids, (id) => BigInt(id)), [1, ids.length]),
    input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ort.Tensor("float32", Float32Array.from([
      voiceConfig.inference.noise_scale,
      1.16,
      voiceConfig.inference.noise_w,
    ]), [3]),
  };
  const output = await session.run(feeds);
  return output.output.data;
}

async function load() {
  post({ type: "progress", message: "Downloading the voice…", progress: 0.02 });
  const [configBytes, modelBytes] = await Promise.all([
    cachedBytes(VOICE_JSON),
    cachedBytes(VOICE_ONNX, (got, total) => {
      post({
        type: "progress",
        message: "Downloading the voice…",
        progress: got / total,
      });
    }),
  ]);
  voiceConfig = JSON.parse(new TextDecoder().decode(configBytes));
  post({ type: "progress", message: "Preparing the voice…", progress: 1 });
  await loadPhonemizer();
  session = await ort.InferenceSession.create(modelBytes, { executionProviders: ["wasm"] });
  post({ type: "ready" });
}

self.onmessage = async (event) => {
  try {
    if (event.data.type === "load") {
      if (!session) await load();
      else post({ type: "ready" });
      return;
    }
    if (event.data.type === "cancel") {
      cancelled = true;
      return;
    }
    if (event.data.type === "speak") {
      cancelled = false;
      if (!session) await load();
      const sampleRate = voiceConfig.audio.sample_rate;
      let index = 0;
      for (const part of event.data.parts) {
        const pieces = Array.isArray(part.lines) && part.lines.length
          ? part.lines
          : [part.reference, ...sentences(part.text)];
        for (const piece of pieces) {
          if (cancelled) return;
          const pcm = await synthesize(piece);
          if (cancelled) return;
          const wav = pcmToWav(pcm, sampleRate);
          post({ type: "chunk", index, buffer: wav }, [wav]);
          index += 1;
        }
      }
      post({ type: "done" });
    }
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : "The voice failed." });
  }
};
