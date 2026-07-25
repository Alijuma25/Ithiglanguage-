# Ithig-Speak Translator

Listens to your mic and decodes **Ithig-Speak** into English, live, right in the browser.

## What is Ithig-Speak?

An infix language game: take each syllable of a word, split it roughly at the
vowel sound, and jam the fake syllable `ithig` into the middle.

> "This language is weird" → "Thithigis lithigang ithiguage ithigis withigeird"

Multi-syllable words often come out as several separate space-separated
pieces, and real speakers are sloppy about exactly where they split — that's
expected, not a bug.

## Running it

No build step, no external API keys. It uses the browser's built-in
`SpeechRecognition` API for mic capture + transcription (Chrome/Edge on
desktop have the best support), and a local dictionary for decoding — nothing
is sent to a translation server.

```bash
npm start
# open http://localhost:8080
```

(A tiny static file server is included so `fetch()` and mic permissions work
correctly — opening `index.html` directly via `file://` will not work in most
browsers.)

Click **Start Listening**, allow mic access, and start talking Ithig-Speak.
The raw transcript shows up on the left, the decoded English on the right,
live. You can also just paste/type Ithig-Speak text into the left box —
the mic is optional.

There's also a bonus **English → Ithig-Speak** encoder panel if you want to
practice or generate test phrases.

## How decoding works

1. Strip every occurrence of `ithig` out of each recognized word/token.
2. Multi-syllable words that got split into multiple tokens (like
   `lithigang ithiguage`) get greedily re-merged: the decoder tries
   concatenating consecutive fragments and checks the result against a
   ~10,000-word common-English dictionary (`data/words.json`), picking the
   longest valid match.
3. If nothing matches the dictionary (names, slang, uncommon words), it falls
   back to using the fragment as-is rather than failing.

This is heuristic by design, matching how the rule itself is meant to be
used — it favors "close enough" over "textbook perfect."

## Files

- `index.html` / `style.css` / `app.js` — UI and mic wiring (Web Speech API).
- `ithig.js` — the encode/decode logic, framework-free, usable from Node or
  the browser.
- `data/words.json` — dictionary used to re-merge split syllables when
  decoding.
- `server.js` — zero-dependency static file server (`npm start`).
- `tests/ithig.test.js` — sanity + round-trip tests (`npm test`).

## Browser support

Live mic transcription requires the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
(`SpeechRecognition`), which is best supported in Chrome and Edge on desktop.
If it's unavailable, the page tells you and you can still decode by typing or
pasting text.
