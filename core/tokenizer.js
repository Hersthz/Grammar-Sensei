/* Grammar Sensei - lightweight local Japanese tokenizer */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const KANJI_RE = /[\u3400-\u9fff]/u;
  const HIRAGANA_RE = /[\u3040-\u309f]/u;
  const KATAKANA_RE = /[\u30a0-\u30ff]/u;
  const LATIN_RE = /[A-Za-z]/;
  const DIGIT_RE = /[0-9]/;
  const PUNCT_RE = /[。、！？!?「」『』（）()[\]{}.,;:]/u;
  const PARTICLES = new Set(["は", "が", "を", "に", "で", "へ", "と", "も", "の", "や", "か", "ね", "よ"]);
  const AUXILIARY_ENDINGS = [
    "なければならない", "なければなりません", "なくてもいい", "てはいけない", "てもいい",
    "ことができる", "ことができます", "たことがある", "たことがあります", "かもしれない",
    "ざるを得ない", "わけにはいかない", "にもかかわらず", "とは限らない",
    "ようになる", "ようにする", "ことにする", "ことになる", "てしまう", "ておく",
    "てみる", "ている", "てから", "ながら", "ばかり", "ところ", "つもり",
    "はず", "べき", "そうだ", "ようだ", "みたい", "らしい"
  ].sort((a, b) => b.length - a.length);

  function charType(char) {
    if (KANJI_RE.test(char)) return "kanji";
    if (HIRAGANA_RE.test(char)) return "hiragana";
    if (KATAKANA_RE.test(char)) return "katakana";
    if (LATIN_RE.test(char)) return "latin";
    if (DIGIT_RE.test(char)) return "digit";
    if (PUNCT_RE.test(char)) return "punctuation";
    if (/\s/.test(char)) return "space";
    return "symbol";
  }

  function refineKanaChunk(surface, start) {
    const tokens = [];
    let offset = 0;

    while (offset < surface.length) {
      const remaining = surface.slice(offset);
      const ending = AUXILIARY_ENDINGS.find((item) => remaining.startsWith(item));
      if (ending) {
        tokens.push(makeToken(ending, start + offset, "grammar-ending"));
        offset += ending.length;
        continue;
      }

      const char = remaining[0];
      if (PARTICLES.has(char)) {
        tokens.push(makeToken(char, start + offset, "particle"));
        offset += 1;
        continue;
      }

      let end = offset + 1;
      while (
        end < surface.length &&
        !PARTICLES.has(surface[end]) &&
        !AUXILIARY_ENDINGS.some((item) => surface.slice(end).startsWith(item))
      ) {
        end += 1;
      }

      tokens.push(makeToken(surface.slice(offset, end), start + offset, "kana"));
      offset = end;
    }

    return tokens;
  }

  function makeToken(surface, start, type) {
    return {
      surface,
      start,
      end: start + surface.length,
      type,
      features: {
        particle: type === "particle",
        grammarEnding: type === "grammar-ending"
      }
    };
  }

  function tokenize(text) {
    const input = String(text || "").normalize("NFKC");
    const tokens = [];
    let index = 0;

    while (index < input.length) {
      const char = input[index];
      const type = charType(char);

      if (type === "space") {
        index += 1;
        continue;
      }

      if (type === "punctuation") {
        tokens.push(makeToken(char, index, "punctuation"));
        index += 1;
        continue;
      }

      let end = index + 1;
      while (end < input.length && charType(input[end]) === type && type !== "punctuation" && type !== "space") {
        end += 1;
      }

      const surface = input.slice(index, end);
      if (type === "hiragana") {
        tokens.push(...refineKanaChunk(surface, index));
      } else {
        tokens.push(makeToken(surface, index, type));
      }
      index = end;
    }

    return tokens;
  }

  function getTokenWindow(text, start, end, radius = 3) {
    const tokens = tokenize(text);
    const matchIndex = tokens.findIndex((token) => token.start <= start && token.end >= end);
    const pivot = matchIndex >= 0
      ? matchIndex
      : tokens.findIndex((token) => token.start >= start);

    if (pivot < 0) return { tokens, before: [], inside: [], after: [] };

    return {
      tokens,
      before: tokens.slice(Math.max(0, pivot - radius), pivot),
      inside: tokens.filter((token) => token.start >= start && token.end <= end),
      after: tokens.slice(pivot + 1, pivot + 1 + radius)
    };
  }

  Core.Tokenizer = {
    available: true,
    quality: "lightweight-rule-tokenizer",
    tokenize,
    getTokenWindow
  };
})(globalThis);
