import { spokenReference } from "./text.js";
import { DEFAULT_PITCH, DEFAULT_RATE, findVoiceByName, pickVoice, scoreVoice } from "./voices.js";

const base = import.meta.env.BASE_URL;
const VOICE_KEY = "bible-verses.voice";
const RATE_KEY = "bible-verses.rate";
const PITCH_KEY = "bible-verses.pitch";
const PIPER_KEY = "bible-verses.piper";

const question = document.querySelector("#question");
const statusEl = document.querySelector("#status");
const hintEl = document.querySelector("#hint");
const resultsEl = document.querySelector("#results");
const readButton = document.querySelector("#read");
const stopButton = document.querySelector("#stop");
const voiceSelect = document.querySelector("#voice");
const rateInput = document.querySelector("#rate");
const pitchInput = document.querySelector("#pitch");
const piperBox = document.querySelector("#piper");
const voiceProgress = document.querySelector("#voice-progress");
const voiceNote = document.querySelector("#voice-note");

let shown = [];
let searchId = 0;
let ready = false;
let queued = "";
let listening = false;
let keepAlive = 0;
let piperWorker = null;
let piperReady = false;
let piperFailed = false;
let audioCtx = null;
let nextStart = 0;
let sources = [];
let speakToken = 0;
let pendingAudio = 0;
let synthDone = true;
let acceptPiper = false;

const worker = new Worker(new URL("./search.worker.js", import.meta.url), { type: "module" });

function setStatus(message) {
  statusEl.textContent = message || "";
}

function setReading(active) {
  readButton.hidden = shown.length === 0 || active;
  stopButton.hidden = !active;
}

function speechLine(text) {
  return text.replace(/[’‘]/g, "'").replace(/[–—]/g, ", ").replace(/\s+/g, " ").trim();
}

function chunks(text) {
  const parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const lines = [];
  let buffer = "";
  for (const part of parts) {
    if ((buffer + part).length > 220 && buffer) {
      lines.push(buffer.trim());
      buffer = part;
    } else {
      buffer += part;
    }
  }
  if (buffer.trim()) lines.push(buffer.trim());
  return lines;
}

function render(verses) {
  shown = verses;
  resultsEl.replaceChildren();
  for (const verse of verses) {
    const article = document.createElement("article");
    const reference = document.createElement("p");
    reference.className = "ref";
    reference.textContent = verse.reference;
    const body = document.createElement("p");
    body.className = "verse";
    body.textContent = verse.text;
    article.append(reference, body);
    if (verse.why) article.append(noteBlock("why", "Why this verse", verse.why));
    if (verse.apply) article.append(noteBlock("apply", "How to apply it", verse.apply));
    resultsEl.append(article);
  }
  setReading(false);
}

function noteBlock(kind, label, text) {
  const block = document.createElement("aside");
  block.className = `note-block ${kind}`;
  const heading = document.createElement("p");
  heading.className = "note-label";
  heading.textContent = label;
  const body = document.createElement("p");
  body.className = "note-body";
  body.textContent = text;
  block.append(heading, body);
  return block;
}

function spokenPieces(verse) {
  const pieces = [
    spokenReference(verse.book, verse.chapter, verse.verse),
    ...chunks(speechLine(verse.text)),
  ];
  if (verse.why) pieces.push("Why this verse:", speechLine(verse.why));
  if (verse.apply) pieces.push("How to apply it:", speechLine(verse.apply));
  return pieces;
}

function stopSpeaking() {
  speakToken += 1;
  acceptPiper = false;
  pendingAudio = 0;
  synthDone = true;
  if (window.speechSynthesis) speechSynthesis.cancel();
  window.clearInterval(keepAlive);
  for (const source of sources) {
    try { source.stop(); } catch { /* already finished */ }
  }
  sources = [];
  nextStart = 0;
  piperWorker?.postMessage({ type: "cancel" });
  setReading(false);
}

function chosenVoice() {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  return findVoiceByName(voices, voiceSelect.value) || pickVoice(voices);
}

function speakWithBrowser() {
  if (!window.speechSynthesis) {
    setStatus("This phone cannot read aloud.");
    return;
  }
  const voice = chosenVoice();
  const rate = Number(rateInput.value) || DEFAULT_RATE;
  const pitch = Number(pitchInput.value) || DEFAULT_PITCH;
  const utterances = [];
  for (const verse of shown) {
    for (const piece of spokenPieces(verse)) utterances.push(piece);
  }
  utterances.forEach((piece, index) => {
    const utterance = new SpeechSynthesisUtterance(piece);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (index === utterances.length - 1) {
      utterance.onend = () => setReading(false);
    }
    speechSynthesis.speak(utterance);
  });
  window.clearInterval(keepAlive);
  keepAlive = window.setInterval(() => {
    if (!speechSynthesis.speaking) return;
    speechSynthesis.pause();
    speechSynthesis.resume();
  }, 10000);
  setReading(true);
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx.resume();
}

function playWav(buffer, token) {
  return new Promise((resolve) => {
    audioCtx.decodeAudioData(buffer.slice(0)).then((decoded) => {
      if (token !== speakToken) {
        resolve();
        return;
      }
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      const start = Math.max(audioCtx.currentTime + 0.06, nextStart);
      source.start(start);
      nextStart = start + decoded.duration + 0.32;
      sources.push(source);
      source.onended = () => resolve();
    }).catch(() => resolve());
  }).then(() => {
    if (token !== speakToken) return;
    pendingAudio -= 1;
    if (pendingAudio <= 0 && synthDone) setReading(false);
  });
}

function startPiper() {
  if (piperWorker || piperFailed) return;
  piperWorker = new Worker(`${base}piper-worker.js`);
  piperWorker.onmessage = (event) => {
    const message = event.data;
    if (message.type === "progress") {
      voiceProgress.hidden = false;
      voiceProgress.firstElementChild.style.width = `${Math.round((message.progress || 0) * 100)}%`;
      voiceNote.textContent = message.message || "";
    }
    if (message.type === "ready") {
      piperReady = true;
      voiceProgress.hidden = true;
      voiceNote.textContent = "The on-device voice is ready.";
    }
    if (message.type === "chunk" && acceptPiper) {
      pendingAudio += 1;
      playWav(message.buffer, speakToken);
    }
    if (message.type === "done") {
      synthDone = true;
      if (pendingAudio <= 0) setReading(false);
    }
    if (message.type === "error") {
      const wasReading = acceptPiper;
      acceptPiper = false;
      piperFailed = true;
      piperBox.checked = false;
      localStorage.setItem(PIPER_KEY, "0");
      voiceNote.textContent = "The on-device voice could not be loaded. The phone voice will be used.";
      voiceProgress.hidden = true;
      if (wasReading && shown.length) speakWithBrowser();
    }
  };
  piperWorker.postMessage({ type: "load" });
}

function speakWithPiper() {
  acceptPiper = true;
  synthDone = false;
  pendingAudio = 0;
  nextStart = 0;
  setReading(true);
  setStatus("");
  piperWorker.postMessage({
    type: "speak",
    parts: shown.map((verse) => ({ lines: spokenPieces(verse) })),
  });
}

function readAloud() {
  if (!shown.length) return;
  stopSpeaking();
  const token = speakToken;
  if (piperBox.checked) {
    ensureAudio().then(() => {
      if (token !== speakToken) return;
      if (!piperWorker) startPiper();
      if (piperReady) speakWithPiper();
      else {
        setStatus("Preparing the voice…");
        const wait = () => {
          if (token !== speakToken) return;
          if (piperReady) {
            setStatus("");
            speakWithPiper();
          } else if (!piperFailed) {
            window.setTimeout(wait, 200);
          }
        };
        wait();
      }
    });
    return;
  }
  speakWithBrowser();
}

function ask(text) {
  const query = text.trim();
  if (!query) return;
  stopSpeaking();
  searchId += 1;
  const id = searchId;
  resultsEl.replaceChildren();
  readButton.hidden = true;
  if (!ready) {
    queued = query;
    setStatus("Opening the scriptures…");
    return;
  }
  setStatus("Searching…");
  worker.postMessage({ type: "search", id, query });
}

worker.onmessage = (event) => {
  const message = event.data;
  if (message.type === "status") setStatus(message.message || "");
  if (message.type === "ready") {
    ready = true;
    setStatus("");
    if (queued) {
      const query = queued;
      queued = "";
      ask(query);
    }
  }
  if (message.type === "results" && message.id === searchId) {
    setStatus("");
    render(message.results);
  }
  if (message.type === "error") {
    setStatus(message.message || "The scriptures could not be opened. Check your connection and try again.");
  }
};

worker.postMessage({ type: "init" });

document.querySelector("#ask").addEventListener("submit", (event) => {
  event.preventDefault();
  ask(question.value);
});

readButton.addEventListener("click", readAloud);
stopButton.addEventListener("click", stopSpeaking);

function fillVoices() {
  if (!window.speechSynthesis) return;
  const voices = speechSynthesis.getVoices();
  const saved = localStorage.getItem(VOICE_KEY) || "";
  const english = voices.filter((voice) => String(voice.lang || "").toLowerCase().startsWith("en"));
  const list = english.length ? english : voices;
  list.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  voiceSelect.replaceChildren();
  if (!list.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Default voice";
    voiceSelect.append(option);
    return;
  }
  for (const voice of list) {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = voice.name;
    voiceSelect.append(option);
  }
  const chosen = findVoiceByName(voices, saved) || pickVoice(voices);
  if (chosen) voiceSelect.value = chosen.name;
}

voiceSelect.addEventListener("change", () => {
  localStorage.setItem(VOICE_KEY, voiceSelect.value);
});

rateInput.value = localStorage.getItem(RATE_KEY) || String(DEFAULT_RATE);
pitchInput.value = localStorage.getItem(PITCH_KEY) || String(DEFAULT_PITCH);
rateInput.addEventListener("input", () => localStorage.setItem(RATE_KEY, rateInput.value));
pitchInput.addEventListener("input", () => localStorage.setItem(PITCH_KEY, pitchInput.value));

piperBox.checked = localStorage.getItem(PIPER_KEY) === "1";
piperBox.addEventListener("change", () => {
  localStorage.setItem(PIPER_KEY, piperBox.checked ? "1" : "0");
  voiceNote.textContent = "";
  if (piperBox.checked) {
    piperFailed = false;
    startPiper();
  }
});

if (window.speechSynthesis) {
  fillVoices();
  speechSynthesis.addEventListener("voiceschanged", fillVoices);
}

function setupMic() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const button = document.querySelector("#mic");
  if (!Recognition) {
    hintEl.textContent = "Type a question or a prayer.";
    return;
  }
  button.hidden = false;
  hintEl.textContent = "Tap the microphone, then speak.";
  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  button.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch {
      setStatus("The microphone is not available. You can type instead.");
    }
  });

  recognition.onstart = () => {
    listening = true;
    button.classList.add("listening");
    button.setAttribute("aria-pressed", "true");
    hintEl.textContent = "Listening… tap again when you finish.";
  };
  recognition.onresult = (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript;
    question.value = text;
  };
  recognition.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      setStatus("The microphone is blocked. You can type instead.");
    } else if (event.error !== "no-speech" && event.error !== "aborted") {
      setStatus("Voice input stopped. You can type instead.");
    }
  };
  recognition.onend = () => {
    listening = false;
    button.classList.remove("listening");
    button.setAttribute("aria-pressed", "false");
    hintEl.textContent = "Tap the microphone, then speak.";
    window.setTimeout(() => {
      if (question.value.trim()) ask(question.value);
    }, 180);
  };
}

setupMic();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
}
