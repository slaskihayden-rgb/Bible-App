import { LEXICON, EXPANSION_STOP } from "./lexicon.js";
import { findCitedVerses, normalizeForSearch, referenceLabel, tokenize } from "./text.js";

export const RESULT_COUNT = 5;

/** Tuned on real questions. Phrase matches are distinctive King James lines. */
export const WEIGHTS = {
  semantic: 1,
  bm25: 0.42,
  phrase: 0.92,
};

const BM25_K1 = 1.2;
const BM25_B = 0.75;

function triggers(concept, normalized, padded) {
  for (const trigger of concept.triggers) {
    if (trigger.includes(" ")) {
      if (normalized.includes(trigger)) return true;
    } else if (padded.includes(` ${trigger} `)) {
      return true;
    }
  }
  return false;
}

export function activeConcepts(query) {
  const normalized = normalizeForSearch(query);
  const padded = ` ${normalized} `;
  if (
    normalized.includes("fear of the lord")
    || normalized.includes("fear of god")
  ) {
    return [];
  }
  return LEXICON.filter((concept) => triggers(concept, normalized, padded));
}

export function buildSearchIndex(verses) {
  const normalized = verses.map((verse) => normalizeForSearch(verse.text));
  const docs = normalized.map((text) => tokenize(text));
  const df = new Map();
  const postings = new Map();
  const dl = new Uint16Array(docs.length);
  let total = 0;
  for (let i = 0; i < docs.length; i += 1) {
    const counts = new Map();
    for (const token of docs[i]) counts.set(token, (counts.get(token) || 0) + 1);
    dl[i] = docs[i].length;
    total += docs[i].length;
    for (const [token, tf] of counts) {
      df.set(token, (df.get(token) || 0) + 1);
      let list = postings.get(token);
      if (!list) {
        list = [];
        postings.set(token, list);
      }
      list.push(i, tf);
    }
  }
  const phraseHits = LEXICON.map((concept) => concept.phrases.map((phrase) => {
    const hits = [];
    const text = phrase[0];
    for (let i = 0; i < normalized.length; i += 1) {
      if (normalized[i].includes(text)) hits.push(i);
    }
    return hits;
  }));
  return {
    normalized,
    dl,
    avgdl: total / docs.length,
    n: docs.length,
    df,
    postings,
    phraseHits,
  };
}

function bm25Scores(index, weights) {
  const scores = new Float32Array(index.n);
  const { n, avgdl, df, postings, dl } = index;
  for (const [token, weight] of weights) {
    const dfToken = df.get(token) || 0;
    if (!dfToken) continue;
    const list = postings.get(token);
    if (!list) continue;
    const idf = Math.log(1 + (n - dfToken + 0.5) / (dfToken + 0.5));
    for (let p = 0; p < list.length; p += 2) {
      const id = list[p];
      const tf = list[p + 1];
      const denom = tf + BM25_K1 * (1 - BM25_B + BM25_B * (dl[id] / avgdl));
      scores[id] += weight * idf * ((tf * (BM25_K1 + 1)) / denom);
    }
  }
  return scores;
}

function queryWeights(query, concepts) {
  const weights = new Map();
  for (const token of tokenize(query)) {
    weights.set(token, (weights.get(token) || 0) + 1);
  }
  for (const concept of concepts) {
    for (const [phrase, phraseWeight] of concept.phrases) {
      if (phraseWeight < 2) continue;
      for (const token of tokenize(phrase)) {
        if (EXPANSION_STOP.has(token) || token.length < 4) continue;
        const add = 0.55 * Math.min(phraseWeight, 3) / 3;
        weights.set(token, Math.max(weights.get(token) || 0, add));
      }
    }
  }
  return weights;
}

function phraseScores(concepts, index) {
  const scores = new Float32Array(index.n);
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const hitConcepts = Array.from({ length: index.n }, () => new Set());
  LEXICON.forEach((concept, conceptIndex) => {
    if (!conceptIds.has(concept.id)) return;
    concept.phrases.forEach((phrase, phraseIndex) => {
      const weight = phrase[1];
      for (const id of index.phraseHits[conceptIndex][phraseIndex]) {
        scores[id] += weight;
        hitConcepts[id].add(concept.id);
      }
    });
  });
  if (concepts.length >= 2) {
    for (let i = 0; i < scores.length; i += 1) {
      if (hitConcepts[i].size >= 2) scores[i] += 1.4;
    }
  }
  return scores;
}

function semanticScores(queryVec, matrix, dim) {
  const n = matrix.length / dim;
  const scores = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    const offset = i * dim;
    for (let j = 0; j < dim; j += 1) sum += queryVec[j] * matrix[offset + j];
    scores[i] = sum / 127;
  }
  return scores;
}

function maxOf(values) {
  let max = 0;
  for (let i = 0; i < values.length; i += 1) if (values[i] > max) max = values[i];
  return max;
}

function pickDiverse(scores, verses, count) {
  const order = [];
  for (let i = 0; i < scores.length; i += 1) order.push(i);
  order.sort((a, b) => scores[b] - scores[a]);
  const pool = order.slice(0, 80);
  const chosen = [];
  const used = new Set();
  const chapterCount = new Map();
  while (chosen.length < count) {
    let bestIndex = -1;
    let best = -Infinity;
    for (const index of pool) {
      if (used.has(index)) continue;
      const verse = verses[index];
      const key = `${verse.book}:${verse.chapter}`;
      const penalty = 0.9 ** (chapterCount.get(key) || 0);
      const adjusted = scores[index] * penalty;
      if (adjusted > best) {
        best = adjusted;
        bestIndex = index;
      }
    }
    if (bestIndex < 0) break;
    used.add(bestIndex);
    chosen.push(bestIndex);
    const verse = verses[bestIndex];
    const key = `${verse.book}:${verse.chapter}`;
    chapterCount.set(key, (chapterCount.get(key) || 0) + 1);
  }
  return chosen;
}

export function toResult(verse) {
  return {
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    text: verse.text,
    reference: referenceLabel(verse.book, verse.chapter, verse.verse),
  };
}

/**
 * Rank verses for a question. `queryVec` is the normalized model embedding.
 * Returned text is the stored verse, unchanged.
 */
export function rankVerses({ query, queryVec, verses, matrix, index, count = RESULT_COUNT }) {
  const cited = findCitedVerses(query, verses);
  if (cited?.only) return cited.indexes.map((index) => toResult(verses[index]));

  const concepts = activeConcepts(query);
  const dim = queryVec.length;
  const semantic = semanticScores(queryVec, matrix, dim);
  const bm25 = bm25Scores(index, queryWeights(query, concepts));
  const phrase = phraseScores(concepts, index);
  const bm25Max = maxOf(bm25);
  const scores = new Float32Array(verses.length);
  for (let i = 0; i < scores.length; i += 1) {
    const keyword = bm25Max > 0 ? bm25[i] / bm25Max : 0;
    const line = Math.min(1, phrase[i] / 3);
    scores[i] = semantic[i] * WEIGHTS.semantic + keyword * WEIGHTS.bm25 + line * WEIGHTS.phrase;
  }

  const picked = [];
  if (cited) {
    for (const index of cited.indexes) picked.push(index);
  }
  for (const index of pickDiverse(scores, verses, count + picked.length)) {
    if (!picked.includes(index)) picked.push(index);
    if (picked.length >= count) break;
  }
  return picked.slice(0, count).map((index) => toResult(verses[index]));
}
