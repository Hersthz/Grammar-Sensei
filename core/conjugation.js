/* Grammar Sensei - lightweight conjugation/context helpers */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const PHRASE_BOUNDARY_RE = /[はがをにでへともやかねよ、。！？!?\s「」『』（）()[\]{}]/u;

  function detectSurfaceForm(surface) {
    const value = String(surface || "").normalize("NFKC");
    if (!value) return "unknown";
    if (/(て|で)$/.test(value)) return "te-form";
    if (/(た|だ)$/.test(value)) return "ta-form";
    if (/なかった$/.test(value)) return "nai-past";
    if (/ない$/.test(value)) return "nai-form";
    if (/ませんでした$/.test(value)) return "polite-negative-past";
    if (/ません$/.test(value)) return "polite-negative";
    if (/ました$/.test(value)) return "polite-past";
    if (/ます$/.test(value)) return "polite";
    if (/(れる|られる)$/.test(value)) return "potential-or-passive";
    if (/(よう|おう)$/.test(value)) return "volitional";
    if (/たい$/.test(value)) return "desire";
    if (/すぎる$/.test(value)) return "excessive";
    if (/そう$/.test(value)) return "appearance";
    return "plain-or-noun";
  }

  function leftPhraseStart(text, index, maxChars = 14) {
    let start = index;
    let budget = maxChars;
    while (start > 0 && budget > 0) {
      const previous = text[start - 1];
      if (PHRASE_BOUNDARY_RE.test(previous)) break;
      start -= 1;
      budget -= 1;
    }
    return start;
  }

  function expandGrammarPhrase(text, hit) {
    const start = leftPhraseStart(text, hit.index);
    const matchedText = text.slice(start, hit.index + hit.length);
    const leftContext = text.slice(start, hit.index);
    return {
      phraseStart: start,
      matchedText,
      leftContext,
      form: detectSurfaceForm(leftContext || hit.text)
    };
  }

  function inferMatchContext(text, hit) {
    const expanded = expandGrammarPhrase(text, hit);
    return {
      ...expanded,
      rightContext: text.slice(hit.index + hit.length, hit.index + hit.length + 8)
    };
  }

  Core.Conjugation = {
    detectSurfaceForm,
    expandGrammarPhrase,
    inferMatchContext
  };
})(globalThis);
