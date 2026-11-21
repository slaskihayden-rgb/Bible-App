# Bible Verses

A private, phone-friendly way to bring a question or a prayer to the King James Version. You speak or type. The page shows three to five verses, quoted exactly, and a short note under each one: why that verse meets the question, and how to apply it. It can read the verse and those notes aloud.

It is a static site. Search, speech, and the optional spoken voice all run on the phone. There is no server and no API key.

## The text

The verses are the 1769 King James Version, 66 books and 31,102 verses, taken unchanged from the public-domain CSV published by [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (branch `2025`, file `formats/csv/KJV.csv`). That file is stored in this repository as `data/KJV.csv`. In this digital edition the divine name is printed “Lord”, not in small capitals.

The King James Version is in the public domain in the United States. In the United Kingdom the Crown still claims a perpetual right in the Authorized Version.

A check in `scripts/verify-verses.mjs` compares every bundled verse with that CSV, character for character.

## Search

Meaning search uses the open model [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) (Apache-2.0) through [Transformers.js](https://github.com/xenova/transformers.js) 2.17. Verse embeddings are computed ahead of time, stored as normalized int8 values in `public/data/embeddings.bin`, and compared on the device with the same model. A private word list boosts distinctive King James lines for ordinary questions. That list is never shown.

The model and the scriptures are cached by a service worker, so a later visit is quicker and still works offline after the first successful load.

## Voice

The microphone uses the browser’s speech recognition, including iPhone Safari and Chrome. If recognition is missing, the page stays on typing.

Read aloud uses the phone’s own speech. It prefers a deep English male voice, at a slower speed and a lower pitch. You can choose another voice under Voice.

An optional deeper voice can be turned on there. It is the open Piper voice `en_GB-northern_english_male` (a synthetic voice from the [Piper](https://github.com/rhasspy/piper) project, not an impression of a real person). The voice file, about 60 MB, downloads from Hugging Face only after you turn it on, then stays on the phone.

## Pages

The site is built for GitHub Pages at `/Bible-App/`.

https://slaskihayden-rgb.github.io/Bible-App/

Publishing uses the workflow in `.github/workflows/pages.yml`, which runs on the `main` branch. In the repository settings, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

## Local use

```bash
npm ci
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:4173/Bible-App/`.

`npm run build:index` rebuilds the embeddings. That needs the model files already in `public/models` and is not part of the Pages build.
