import { readFileSync } from "node:fs";
import { LEXICON } from "../src/lexicon.js";
import { phrasesMissingNotes, explainVerse } from "../src/explain.js";
import { findCitedVerses, normalizeForSearch, referenceLabel } from "../src/text.js";
import { pickVoice } from "../src/voices.js";

function parseCsv(text) {
  const rows = [];
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  const len = text.length;
  function readRow() {
    const cells = [];
    let cell = "";
    let quoted = false;
    while (i < len) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i += 2; continue; }
          quoted = false; i += 1; continue;
        }
        cell += ch; i += 1; continue;
      }
      if (ch === '"') { quoted = true; i += 1; continue; }
      if (ch === ",") { cells.push(cell); cell = ""; i += 1; continue; }
      if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i += 1;
        i += 1;
        cells.push(cell);
        return cells;
      }
      cell += ch; i += 1;
    }
    if (cell.length || cells.length) { cells.push(cell); return cells; }
    return null;
  }
  const header = readRow();
  if (!header || header[0] !== "Book") throw new Error("Unexpected CSV header");
  while (i < len) {
    const row = readRow();
    if (!row || row.length < 4) continue;
    rows.push({ book: row[0], chapter: Number(row[1]), verse: Number(row[2]), text: row.slice(3).join(",") });
  }
  return rows;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const COUNTS = {
  Genesis: 1533, Exodus: 1213, Leviticus: 859, Numbers: 1288, Deuteronomy: 959,
  Joshua: 658, Judges: 618, Ruth: 85, "I Samuel": 810, "II Samuel": 695,
  "I Kings": 816, "II Kings": 719, "I Chronicles": 942, "II Chronicles": 822,
  Ezra: 280, Nehemiah: 406, Esther: 167, Job: 1070, Psalms: 2461, Proverbs: 915,
  Ecclesiastes: 222, "Song of Solomon": 117, Isaiah: 1292, Jeremiah: 1364,
  Lamentations: 154, Ezekiel: 1273, Daniel: 357, Hosea: 197, Joel: 73, Amos: 146,
  Obadiah: 21, Jonah: 48, Micah: 105, Nahum: 47, Habakkuk: 56, Zephaniah: 53,
  Haggai: 38, Zechariah: 211, Malachi: 55, Matthew: 1071, Mark: 678, Luke: 1151,
  John: 879, Acts: 1007, Romans: 433, "I Corinthians": 437, "II Corinthians": 257,
  Galatians: 149, Ephesians: 155, Philippians: 104, Colossians: 95,
  "I Thessalonians": 89, "II Thessalonians": 47, "I Timothy": 113, "II Timothy": 83,
  Titus: 46, Philemon: 25, Hebrews: 303, James: 108, "I Peter": 105, "II Peter": 61,
  "I John": 105, "II John": 13, "III John": 14, Jude: 25, "Revelation of John": 404,
};

const FAMOUS = {
  "Genesis 1:1": "In the beginning God created the heaven and the earth.",
  "Psalm 23:1": "The Lord is my shepherd; I shall not want.",
  "Isaiah 40:31": "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
  "Matthew 6:33": "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
  "John 3:16": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  "Philippians 4:6": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
  "Philippians 4:13": "I can do all things through Christ which strengtheneth me.",
  "Revelation 21:4": "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.",
};

const source = parseCsv(readFileSync("data/KJV.csv", "utf8"));
const bundled = JSON.parse(readFileSync("public/data/verses.json", "utf8")).verses;
const meta = JSON.parse(readFileSync("public/data/meta.json", "utf8"));
const embeddings = readFileSync("public/data/embeddings.bin");

if (source.length !== 31102) fail(`CSV has ${source.length} verses`);
if (bundled.length !== 31102) fail(`JSON has ${bundled.length} verses`);
if (Object.keys(COUNTS).length !== 66) fail("Book table is not 66 books");
if (embeddings.length !== 31102 * 384) fail(`Embeddings are ${embeddings.length} bytes`);
if (meta.count !== 31102 || meta.dim !== 384) fail("meta.json does not match the index");

const counts = new Map();
for (let i = 0; i < source.length; i += 1) {
  const row = source[i];
  const got = bundled[i];
  if (got.book !== row.book || got.chapter !== row.chapter || got.verse !== row.verse || got.text !== row.text) {
    fail(`Verse ${i} does not match the CSV exactly`);
    break;
  }
  counts.set(row.book, (counts.get(row.book) || 0) + 1);
}
for (const [book, count] of Object.entries(COUNTS)) {
  if (counts.get(book) !== count) fail(`${book} has ${counts.get(book)} verses, expected ${count}`);
}

const byLabel = new Map(bundled.map((verse) => [referenceLabel(verse.book, verse.chapter, verse.verse), verse.text.trim()]));
for (const [label, text] of Object.entries(FAMOUS)) {
  if (byLabel.get(label) !== text) fail(`${label} text does not match the familiar King James line`);
}

const normalized = bundled.map((verse) => normalizeForSearch(verse.text));
for (const concept of LEXICON) {
  for (const [phrase] of concept.phrases) {
    if (!normalized.some((text) => text.includes(phrase))) fail(`Phrase not in the KJV: ${phrase}`);
  }
}

const missingNotes = phrasesMissingNotes();
if (missingNotes.length) fail(`Missing notes for: ${missingNotes.join("; ")}`);

function sentenceCount(text) {
  return (text.match(/[.!?](?:\s|$)/g) || []).length;
}
const sampleNote = explainVerse("anxious about money", "But my God shall supply all your need according to his riches in glory by Christ Jesus.");
if (!sampleNote.why.startsWith("You said you are anxious about money.")) fail(`Unexpected lead: ${sampleNote.why}`);
if (sentenceCount(sampleNote.why) > 2 || sentenceCount(sampleNote.apply) > 2) fail("A note is longer than two sentences");
if (sampleNote.why.includes("supply all your need according to his riches") === false) fail("Money note missed the verse's claim");

const cited = findCitedVerses("Please read John 3:16", bundled);
if (!cited?.only || referenceLabel(bundled[cited.indexes[0]].book, bundled[cited.indexes[0]].chapter, bundled[cited.indexes[0]].verse) !== "John 3:16") {
  fail("John 3:16 was not found as a citation");
}
const range = findCitedVerses("Psalm 23:1-3", bundled);
if (!range || range.indexes.length !== 3) fail("Psalm 23:1-3 did not return three verses");

const apple = [
  { name: "Samantha", lang: "en-US", localService: true },
  { name: "Alex", lang: "en-US", localService: true },
  { name: "Daniel", lang: "en-GB", localService: true },
  { name: "Fred", lang: "en-US", localService: true },
];
if (pickVoice(apple).name !== "Alex") fail(`Expected Alex, got ${pickVoice(apple)?.name}`);
const android = [
  { name: "Google US English", lang: "en-US" },
  { name: "Google UK English Female", lang: "en-GB" },
  { name: "Google UK English Male", lang: "en-GB" },
];
if (pickVoice(android).name !== "Google UK English Male") fail("Expected Google UK English Male");
const ios = [
  { name: "Samantha", lang: "en-US" },
  { name: "Ralph", lang: "en-US" },
  { name: "Daniel", lang: "en-GB" },
  { name: "Fred", lang: "en-US" },
];
if (pickVoice(ios).name !== "Daniel") fail(`Expected Daniel, got ${pickVoice(ios)?.name}`);

if (process.exitCode) {
  console.error("Verse checks failed");
} else {
  console.log("Verse text matches the KJV source for all 31,102 verses.");
}
