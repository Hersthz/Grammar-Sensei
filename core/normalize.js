/* Grammar Sensei - normalization, language detection, sentence utilities */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u9fff]/u;
  const KANA_RE = /[\u3040-\u30ff]/u;
  const LATIN_RE = /[A-Za-z]/;
  const VIETNAMESE_RE = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/iu;

  function containsJapanese(text) {
    return JAPANESE_RE.test(String(text || ""));
  }

  function containsKana(text) {
    return KANA_RE.test(String(text || ""));
  }

  function normalizeText(text, options = {}) {
    const preserveSpaces = options.preserveSpaces !== false;
    let value = String(text || "").normalize("NFKC").trim();
    value = value.replace(/[\u200B-\u200D\uFEFF]/g, "");
    value = preserveSpaces
      ? value.replace(/[ \t\r\n]+/g, " ")
      : value.replace(/[ \t\r\n]+/g, "");
    return value.trim();
  }

  function normalizeForMatch(text) {
    return normalizeText(text, { preserveSpaces: false });
  }

  function detectLanguage(text) {
    const value = normalizeText(text);
    if (!value) return "unknown";

    const hasJa = containsJapanese(value);
    const hasVi = VIETNAMESE_RE.test(value);
    const hasLatin = LATIN_RE.test(value);

    if (hasJa && (hasVi || hasLatin)) return "mixed";
    if (hasJa) return "ja";
    if (hasVi) return "vi";
    if (hasLatin) return "en";
    return "unknown";
  }

  function splitJapaneseSentences(text) {
    const value = normalizeText(text);
    if (!value) return [];

    return value
      .split(/(?<=[。！？!?])\s+|(?<=[。！？!?])/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 2 && containsJapanese(sentence));
  }

  function splitVisibleText(text, limit = 50) {
    const seen = new Set();
    const sentences = [];
    for (const sentence of splitJapaneseSentences(text)) {
      const key = normalizeForMatch(sentence);
      if (key.length < 3 || seen.has(key)) continue;
      seen.add(key);
      sentences.push(sentence);
      if (sentences.length >= limit) break;
    }
    return sentences;
  }

  function stableHash(text) {
    const value = String(text || "");
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  Core.Normalize = {
    containsJapanese,
    containsKana,
    normalizeText,
    normalizeForMatch,
    detectLanguage,
    splitJapaneseSentences,
    splitVisibleText,
    stableHash
  };
})(globalThis);
