// Core Ithig-Speak encode/decode logic. No dependencies, works in browser or Node.
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Ithig = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var INFIX = "ithig";
  var VOWELS = "aeiouy";
  var MAX_MERGE_SPAN = 4;

  function isVowel(ch) {
    return VOWELS.indexOf(ch) !== -1;
  }

  // Rough syllabifier: greedily grab consonants + following vowel run as one
  // syllable, then tack any leftover trailing consonants onto the last one.
  // Not linguistically perfect on purpose -- Ithig-Speak isn't either.
  function syllabify(word) {
    var lower = word.toLowerCase();
    var re = /[^aeiouy]*[aeiouy]+/g;
    var chunks = [];
    var match;
    var consumed = 0;

    while ((match = re.exec(lower)) !== null) {
      chunks.push(match[0]);
      consumed = re.lastIndex;
    }

    if (chunks.length === 0) {
      return [lower];
    }

    if (consumed < lower.length) {
      chunks[chunks.length - 1] += lower.slice(consumed);
    }

    return chunks;
  }

  // Split a syllable into (onset, rest) roughly at the vowel sound and
  // insert the infix between the two halves.
  function infixSyllable(syllable) {
    var idx = 0;
    while (idx < syllable.length && !isVowel(syllable[idx])) {
      idx++;
    }
    var onset = syllable.slice(0, idx);
    var rest = syllable.slice(idx);
    return onset + INFIX + rest;
  }

  function applyCase(sample, target) {
    if (sample.length && sample[0] === sample[0].toUpperCase() && /[a-z]/i.test(sample[0])) {
      return target.charAt(0).toUpperCase() + target.slice(1);
    }
    return target;
  }

  // English word/phrase -> Ithig-Speak. Multi-syllable words come out as
  // separate space-separated pieces, matching how people actually say it.
  function encode(text) {
    return text.replace(/[A-Za-z]+/g, function (word) {
      var syllables = syllabify(word);
      var encoded = syllables.map(infixSyllable);
      var out = encoded.join(" ");
      return applyCase(word, out);
    });
  }

  function stripInfix(token) {
    var re = new RegExp(INFIX, "gi");
    return token.replace(re, "");
  }

  // Split a raw token into (leading punctuation, letters, trailing punctuation).
  function splitToken(token) {
    var match = token.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
    if (!match) {
      return null;
    }
    return { lead: match[1], core: match[2], trail: match[3] };
  }

  // Ithig-Speak -> English. Strips the infix out of every word, then greedily
  // re-merges consecutive fragments using a dictionary of common words to
  // undo the "each syllable becomes its own word" splitting. Falls back to
  // leaving a fragment as-is when nothing in the dictionary matches (handles
  // names, slang, and words missing from the dictionary).
  function decode(text, dictionary) {
    var dict = dictionary || new Set();
    var rawTokens = text.split(/(\s+)/);

    var entries = [];
    for (var i = 0; i < rawTokens.length; i++) {
      var tok = rawTokens[i];
      if (tok === "" ) continue;
      if (/^\s+$/.test(tok)) continue; // whitespace, drop and re-join with single spaces later

      var parts = splitToken(tok);
      if (!parts) {
        entries.push({ passthrough: true, text: tok });
        continue;
      }

      var fragment = stripInfix(parts.core);
      if (fragment === "") {
        continue; // token was purely "ithig" itself, drop it
      }

      entries.push({
        passthrough: false,
        lead: parts.lead,
        fragment: fragment,
        trail: parts.trail,
        original: parts.core
      });
    }

    var out = [];
    var i = 0;
    while (i < entries.length) {
      var entry = entries[i];
      if (entry.passthrough) {
        out.push(entry.text);
        i++;
        continue;
      }

      var maxSpan = 1;
      for (var span = 1; span < MAX_MERGE_SPAN && i + span < entries.length; span++) {
        var prev = entries[i + span - 1];
        if (prev.passthrough || prev.trail) break; // punctuation ends a word
        var next = entries[i + span];
        if (next.passthrough || next.lead) break;
        maxSpan = span + 1;
      }

      var chosenSpan = 1;
      var chosenWord = entry.fragment;
      for (var span2 = maxSpan; span2 >= 2; span2--) {
        var candidate = "";
        for (var k = 0; k < span2; k++) {
          candidate += entries[i + k].fragment;
        }
        if (dict.has(candidate.toLowerCase())) {
          chosenSpan = span2;
          chosenWord = candidate;
          break;
        }
      }

      var first = entries[i];
      var last = entries[i + chosenSpan - 1];
      var rendered = applyCase(entry.original, chosenWord);
      out.push(first.lead + rendered + last.trail);
      i += chosenSpan;
    }

    return out.join(" ").replace(/\s+([,.!?;:])/g, "$1");
  }

  return { encode: encode, decode: decode, syllabify: syllabify };
});
