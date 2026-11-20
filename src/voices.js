/** Pick a deep English male system voice when the phone has one. */

export const DEFAULT_RATE = 0.85;
export const DEFAULT_PITCH = 0.75;

const PREFERRED = [
  "google uk english male",
  "alex",
  "daniel",
  "aaron",
  "arthur",
  "gordon",
  "ralph",
  "microsoft david",
  "david",
  "microsoft mark",
  "mark",
  "rishi",
  "reed",
  "tom",
  "james",
  "nathan",
  "ryan",
  "george",
  "guy",
  "albert",
];

const NOVELTY = [
  "fred",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "good news",
  "bad news",
  "jester",
  "organ",
  "superstar",
  "trinoids",
  "whisper",
  "zarvox",
  "wobble",
  "deranged",
  "grandma",
  "grandpa",
  "bells",
  "pipe",
];

const FEMALE = [
  "samantha",
  "victoria",
  "karen",
  "moira",
  "fiona",
  "tessa",
  "veena",
  "susan",
  "hazel",
  "kate",
  "serena",
  "allison",
  "ava",
  "nicky",
  "zira",
  "salli",
  "kimberly",
  "joanna",
  "ivy",
  "kendra",
  "emma",
  "amy",
  "libby",
  "sonia",
  "female",
  "woman",
  "siri",
  "google us english",
  "google uk english female",
];

function preferredRank(name) {
  if (name.includes("alex") && !name.includes("alexa")) {
    return PREFERRED.indexOf("alex");
  }
  for (let i = 0; i < PREFERRED.length; i += 1) {
    if (PREFERRED[i] === "alex") continue;
    if (name.includes(PREFERRED[i])) return i;
  }
  return -1;
}

export function scoreVoice(voice) {
  const name = String(voice?.name || "").toLowerCase();
  const lang = String(voice?.lang || "").toLowerCase();
  if (!lang.startsWith("en")) return -1;
  if (NOVELTY.some((word) => name.includes(word))) return -1;
  if (FEMALE.some((word) => name.includes(word))) return -1;
  let score = 20;
  if (voice.localService) score += 3;
  if (lang.startsWith("en-us") || lang.startsWith("en-gb")) score += 2;
  const pref = preferredRank(name);
  if (pref >= 0) score += (PREFERRED.length - pref) * 10;
  else if (name.includes("male")) score += 30;
  return score;
}

export function pickVoice(voices) {
  const list = Array.from(voices || []);
  let best = null;
  let bestScore = 0;
  for (const voice of list) {
    const score = scoreVoice(voice);
    if (score > bestScore) {
      bestScore = score;
      best = voice;
    }
  }
  if (best) return best;
  return list.find((voice) => String(voice.lang || "").toLowerCase().startsWith("en")) || list[0] || null;
}

export function findVoiceByName(voices, name) {
  if (!name) return null;
  return Array.from(voices || []).find((voice) => voice.name === name) || null;
}
