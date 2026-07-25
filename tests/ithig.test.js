const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Ithig = require("../ithig.js");

const words = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "words.json"), "utf8")
);
const dict = new Set(words);

function check(label, actual, expected) {
  assert.strictEqual(actual, expected, `${label}: expected "${expected}", got "${actual}"`);
  console.log(`ok - ${label}`);
}

// Decoder should undo the example from the spec exactly. This is the
// direction that actually matters for a mic -> English translator: real
// human syllable splits are "sloppy" per the spec, so the encoder's guess
// at syllable boundaries won't always match a person's, but decode must
// still cope with however a person actually said it.
check(
  "decode example",
  Ithig.decode("Thithigis lithigang ithiguage ithigis withigeird", dict),
  "This language is weird"
);

// Round trip on a few random sentences.
const samples = [
  "hello world",
  "the quick brown fox jumps over the lazy dog",
  "can you understand me",
  "translate this sentence please",
];

for (const sentence of samples) {
  const encoded = Ithig.encode(sentence);
  const decoded = Ithig.decode(encoded, dict);
  check(`round trip: "${sentence}"`, decoded.toLowerCase(), sentence.toLowerCase());
}

// Punctuation should survive.
check(
  "punctuation",
  Ithig.decode("ithigis ithigit withigeird, righithigt?", dict),
  "is it weird, right?"
);

// Unknown words fall back gracefully instead of throwing.
const unknown = Ithig.decode("Zithigorbithigax ithigis cithigool", dict);
assert.ok(unknown.length > 0, "decode should not throw/empty out on unknown words");
console.log(`ok - unknown word fallback -> "${unknown}"`);

console.log("\nAll tests passed.");
