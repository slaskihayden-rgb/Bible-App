/** Shared text helpers. Display strings stay exact; search text is normalized. */

export const BOOK_DISPLAY = {
  "I Samuel": "1 Samuel",
  "II Samuel": "2 Samuel",
  "I Kings": "1 Kings",
  "II Kings": "2 Kings",
  "I Chronicles": "1 Chronicles",
  "II Chronicles": "2 Chronicles",
  Psalms: "Psalm",
  "I Corinthians": "1 Corinthians",
  "II Corinthians": "2 Corinthians",
  "I Thessalonians": "1 Thessalonians",
  "II Thessalonians": "2 Thessalonians",
  "I Timothy": "1 Timothy",
  "II Timothy": "2 Timothy",
  "I Peter": "1 Peter",
  "II Peter": "2 Peter",
  "I John": "1 John",
  "II John": "2 John",
  "III John": "3 John",
  "Revelation of John": "Revelation",
};

const SPOKEN_BOOK = {
  "1 Samuel": "First Samuel",
  "2 Samuel": "Second Samuel",
  "1 Kings": "First Kings",
  "2 Kings": "Second Kings",
  "1 Chronicles": "First Chronicles",
  "2 Chronicles": "Second Chronicles",
  "1 Corinthians": "First Corinthians",
  "2 Corinthians": "Second Corinthians",
  "1 Thessalonians": "First Thessalonians",
  "2 Thessalonians": "Second Thessalonians",
  "1 Timothy": "First Timothy",
  "2 Timothy": "Second Timothy",
  "1 Peter": "First Peter",
  "2 Peter": "Second Peter",
  "1 John": "First John",
  "2 John": "Second John",
  "3 John": "Third John",
};

/** Extra ways a person might say a book name before a chapter and verse. */
const EXTRA_ALIASES = {
  psalm: "Psalms",
  psalms: "Psalms",
  ps: "Psalms",
  psa: "Psalms",
  rev: "Revelation of John",
  revelation: "Revelation of John",
  revelations: "Revelation of John",
  "song of songs": "Song of Solomon",
  canticles: "Song of Solomon",
  song: "Song of Solomon",
  jn: "John",
  matt: "Matthew",
  mt: "Matthew",
  mk: "Mark",
  lk: "Luke",
  gen: "Genesis",
  ex: "Exodus",
  exod: "Exodus",
  lev: "Leviticus",
  num: "Numbers",
  deut: "Deuteronomy",
  dt: "Deuteronomy",
  josh: "Joshua",
  judg: "Judges",
  isa: "Isaiah",
  jer: "Jeremiah",
  ezek: "Ezekiel",
  dan: "Daniel",
  hos: "Hosea",
  obad: "Obadiah",
  mic: "Micah",
  nah: "Nahum",
  hab: "Habakkuk",
  zeph: "Zephaniah",
  hag: "Haggai",
  zech: "Zechariah",
  mal: "Malachi",
  rom: "Romans",
  phil: "Philippians",
  col: "Colossians",
  tit: "Titus",
  phlm: "Philemon",
  philem: "Philemon",
  heb: "Hebrews",
  jas: "James",
  eph: "Ephesians",
  gal: "Galatians",
  "1 cor": "I Corinthians",
  "2 cor": "II Corinthians",
  "1 thess": "I Thessalonians",
  "2 thess": "II Thessalonians",
  "1 tim": "I Timothy",
  "2 tim": "II Timothy",
  "1 pet": "I Peter",
  "2 pet": "II Peter",
  "1 sam": "I Samuel",
  "2 sam": "II Samuel",
  "1 kgs": "I Kings",
  "2 kgs": "II Kings",
  "1 chr": "I Chronicles",
  "2 chr": "II Chronicles",
  "1 john": "I John",
  "2 john": "II John",
  "3 john": "III John",
  "1 ki": "I Kings",
  "2 ki": "II Kings",
};

const ALIASES = new Map();

function addAlias(alias, sourceName) {
  const key = alias.toLowerCase().replace(/\s+/g, " ").trim();
  if (key) ALIASES.set(key, sourceName);
}

for (const source of [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges",
  "Ruth", "I Samuel", "II Samuel", "I Kings", "II Kings", "I Chronicles", "II Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes",
  "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John",
  "Acts", "Romans", "I Corinthians", "II Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "I Thessalonians", "II Thessalonians", "I Timothy",
  "II Timothy", "Titus", "Philemon", "Hebrews", "James", "I Peter", "II Peter",
  "I John", "II John", "III John", "Jude", "Revelation of John",
]) {
  addAlias(source, source);
  addAlias(displayBook(source), source);
}
for (const [alias, source] of Object.entries(EXTRA_ALIASES)) addAlias(alias, source);

export function displayBook(sourceName) {
  return BOOK_DISPLAY[sourceName] || sourceName;
}

export function referenceLabel(book, chapter, verse) {
  return `${displayBook(book)} ${chapter}:${verse}`;
}

export function spokenReference(book, chapter, verse) {
  const shown = displayBook(book);
  const name = SPOKEN_BOOK[shown] || shown;
  return `${name}, chapter ${chapter}, verse ${verse}.`;
}

/** Text fed to the embedding model. Display text is never passed through this. */
export function embeddingInput(text) {
  return String(text)
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lowercase, straight quotes, punctuation removed. Used only for retrieval. */
export function normalizeForSearch(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, " ")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(
  `a an the and or of to in on for my me i im i'm am is it that this with be do how what who whom why when where can could would should please just really so about your you we our us from at as if but not into over after before than then them their his her he she they was were are been being have has had will shall unto ye thou thee thy thine ye o oh nor yet also very too its it's don't cant can't cannot`.split(/\s+/),
);

export function tokenize(text) {
  const n = normalizeForSearch(text).replace(/'/g, "");
  const out = [];
  for (const tok of n.split(" ")) {
    if (tok && !STOP.has(tok)) out.push(tok);
  }
  return out;
}

function romanBook(fragment) {
  return fragment
    .replace(/\biii\b/g, "3")
    .replace(/\bii\b/g, "2")
    .replace(/\bi\b/g, "1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * If the question is really a citation ("John 3:16" or "Psalm 23:1-3"),
 * return the matching verse indexes. Otherwise return null.
 */
export function findCitedVerses(query, verses) {
  const cleaned = query.toLowerCase().replace(/\./g, " ");
  const match = cleaned.match(/(\d{1,3})\s*:\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?/);
  if (!match) return null;
  const chapter = Number(match[1]);
  const start = Number(match[2]);
  const end = match[3] ? Number(match[3]) : start;
  if (!chapter || end < start || end - start > 4) return null;
  const before = cleaned.slice(0, match.index).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = before ? before.split(" ") : [];
  let book = null;
  let used = 0;
  for (let count = Math.min(4, words.length); count >= 1; count -= 1) {
    const fragment = romanBook(words.slice(-count).join(" "));
    if (ALIASES.has(fragment)) {
      book = ALIASES.get(fragment);
      used = count;
      break;
    }
  }
  if (!book) return null;
  const wanted = [];
  for (let verse = start; verse <= end; verse += 1) wanted.push(`${book}|${chapter}|${verse}`);
  const byKey = new Map();
  for (let i = 0; i < verses.length; i += 1) {
    const verse = verses[i];
    byKey.set(`${verse.book}|${verse.chapter}|${verse.verse}`, i);
  }
  const indexes = [];
  for (const key of wanted) {
    if (!byKey.has(key)) return null;
    indexes.push(byKey.get(key));
  }
  const rest = `${words.slice(0, -used).join("")}${cleaned.slice(match.index + match[0].length).replace(/[^a-z0-9]+/g, "")}`;
  return { indexes, only: rest.length < 12 };
}
