import { readFileSync } from "node:fs";
import path from "node:path";
import { pipeline, env } from "@xenova/transformers";
import { buildSearchIndex, rankVerses } from "../src/rank.js";
import { embeddingInput } from "../src/text.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
env.localModelPath = path.join(root, "public", "models");
env.allowRemoteModels = false;
env.allowLocalModels = true;

const CASES = [
  {
    query: "I'm anxious about money",
    accept: [
      "Philippians 4:6", "Philippians 4:7", "Philippians 4:19",
      "Matthew 6:19", "Matthew 6:24", "Matthew 6:25", "Matthew 6:26",
      "Matthew 6:31", "Matthew 6:32", "Matthew 6:33", "Matthew 6:34",
      "Luke 12:15", "Luke 12:22", "Luke 12:29", "Luke 12:30", "Luke 12:31", "Luke 16:13",
      "1 Peter 5:7", "Hebrews 13:5", "Psalm 55:22",
      "1 Timothy 6:6", "1 Timothy 6:7", "1 Timothy 6:8", "1 Timothy 6:10",
      "Isaiah 26:3", "Proverbs 30:8", "Psalm 37:25",
    ],
  },
  {
    query: "how do I forgive someone who hurt me",
    accept: [
      "Matthew 6:14", "Matthew 6:15", "Matthew 18:21", "Matthew 18:22",
      "Matthew 5:44", "Mark 11:25", "Luke 6:37", "Luke 17:3", "Luke 17:4",
      "Luke 23:34", "Ephesians 4:32", "Colossians 3:13", "Romans 12:19",
      "Romans 12:20", "Romans 12:21", "Proverbs 19:11",
    ],
  },
  {
    query: "give me strength for a hard day",
    accept: [
      "Isaiah 40:29", "Isaiah 40:31", "Isaiah 41:10", "Philippians 4:13",
      "Psalm 46:1", "Deuteronomy 31:6", "Deuteronomy 31:8", "Deuteronomy 33:25",
      "Joshua 1:9", "Joshua 1:6", "2 Corinthians 12:9", "Nehemiah 8:10",
      "Psalm 28:7", "Psalm 27:1", "Psalm 73:26", "Exodus 15:2",
      "Matthew 11:28", "Ephesians 6:10", "Isaiah 40:30",
    ],
  },
  {
    query: "grief after losing a parent",
    accept: [
      "Psalm 34:18", "Psalm 147:3", "Matthew 5:4", "Revelation 21:4",
      "Revelation 7:17", "2 Corinthians 1:3", "2 Corinthians 1:4",
      "Psalm 23:4", "John 14:1", "John 14:18", "John 11:25",
      "1 Thessalonians 4:13", "1 Thessalonians 4:14", "Psalm 30:5",
      "Psalm 27:10", "Isaiah 66:13", "Psalm 116:15", "Romans 8:38",
      "John 14:27", "Psalm 46:1", "Revelation 14:13",
    ],
    showNotes: true,
  },
  {
    query: "anxious about money",
    showNotes: true,
    accept: [
      "Philippians 4:6", "Philippians 4:7", "Philippians 4:19",
      "Matthew 6:19", "Matthew 6:24", "Matthew 6:25", "Matthew 6:26",
      "Matthew 6:31", "Matthew 6:32", "Matthew 6:33", "Matthew 6:34",
      "Luke 12:15", "Luke 12:22", "Luke 12:29", "Luke 12:30", "Luke 12:31", "Luke 16:13",
      "1 Peter 5:7", "Hebrews 13:5", "Psalm 55:22",
      "1 Timothy 6:6", "1 Timothy 6:7", "1 Timothy 6:8", "1 Timothy 6:10",
      "Isaiah 26:3", "Proverbs 30:8", "Psalm 37:25",
    ],
  },
  {
    query: "forgive someone who hurt me",
    showNotes: true,
    accept: [
      "Matthew 6:14", "Matthew 6:15", "Matthew 18:21", "Matthew 18:22",
      "Matthew 5:44", "Mark 11:25", "Luke 6:37", "Luke 17:3", "Luke 17:4",
      "Luke 23:34", "Ephesians 4:32", "Colossians 3:13", "Romans 12:19",
      "Romans 12:20", "Romans 12:21", "Proverbs 19:11",
    ],
  },
  {
    query: "strength for a hard day",
    showNotes: true,
    accept: [
      "Isaiah 40:29", "Isaiah 40:31", "Isaiah 41:10", "Philippians 4:13",
      "Psalm 46:1", "Deuteronomy 31:6", "Deuteronomy 31:8", "Deuteronomy 33:25",
      "Joshua 1:9", "Joshua 1:6", "2 Corinthians 12:9", "Nehemiah 8:10",
      "Psalm 28:7", "Psalm 27:1", "Psalm 73:26", "Exodus 15:2",
      "Matthew 11:28", "Ephesians 6:10", "Isaiah 40:30",
    ],
  },
];

const verses = JSON.parse(readFileSync(path.join(root, "public/data/verses.json"), "utf8")).verses;
const matrix = new Int8Array(readFileSync(path.join(root, "public/data/embeddings.bin")));
const source = new Map();
for (const verse of verses) source.set(`${verse.book}|${verse.chapter}|${verse.verse}`, verse.text);

const index = buildSearchIndex(verses);
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });

let failed = 0;
for (const test of CASES) {
  const started = Date.now();
  const embedded = await extractor(embeddingInput(test.query), { pooling: "mean", normalize: true });
  const results = rankVerses({
    query: test.query,
    queryVec: embedded.data,
    verses,
    matrix,
    index,
  });
  const labels = results.map((verse) => verse.reference);
  const hits = labels.filter((label) => test.accept.includes(label));
  console.log(`\n${test.query}  (${Date.now() - started} ms)`);
  for (const verse of results) {
    const key = `${verse.book}|${verse.chapter}|${verse.verse}`;
    const exact = source.get(key) === verse.text;
    console.log(`  ${verse.reference}${exact ? "" : "  TEXT MISMATCH"}`);
    console.log(`    ${verse.text.trim()}`);
    if (!exact) failed += 1;
    const whySentences = (verse.why || "").match(/[.!?](?:\s|$)/g) || [];
    const applySentences = (verse.apply || "").match(/[.!?](?:\s|$)/g) || [];
    if (!verse.why || !verse.apply || verse.why === verse.text || verse.apply === verse.text) {
      console.error("  missing or copied note");
      failed += 1;
    } else if (whySentences.length < 1 || whySentences.length > 2 || applySentences.length < 1 || applySentences.length > 2) {
      console.error(`  note length why=${whySentences.length} apply=${applySentences.length}`);
      failed += 1;
    }
    if (test.showNotes) {
      console.log(`    Why this verse: ${verse.why}`);
      console.log(`    How to apply it: ${verse.apply}`);
    }
  }
  if (results.length < 3 || results.length > 5) {
    console.error(`  expected 3 to 5 verses, got ${results.length}`);
    failed += 1;
  }
  if (hits.length < 3) {
    console.error(`  only ${hits.length} of the verses are relevant`);
    failed += 1;
  } else {
    console.log(`  relevant ${hits.length}/${results.length}`);
  }
}

if (failed) {
  console.error(`\n${failed} search check(s) failed`);
  process.exit(1);
}
console.log("\nSearch checks passed.");
