/* Grammar Sensei - local matcher, semantic fallback, cache, result model */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};
  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};
  const Normalize = Core.Normalize;
  const Romaji = Core.Romaji;
  const Tokenizer = Core.Tokenizer;
  const Conjugation = Core.Conjugation;

  const ANALYSIS_CACHE_LIMIT = 200;
  const DEFAULT_CONFIDENCE_THRESHOLD = 70;
  const MIN_DISPLAY_CONFIDENCE = 50;

  const cache = new Map();

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function entries() {
    return Data.GRAMMAR_DATABASE || [];
  }

  function semanticEntries() {
    return Data.SEMANTIC_GRAMMAR_MAP || [];
  }

  function entryById(id) {
    return entries().find((entry) => entry.id === id) || null;
  }

  function cacheKey(normalized, settings) {
    const threshold = settings.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
    const semantic = settings.semanticMode !== false ? "semantic" : "literal";
    const debug = settings.debugMatches ? "debug" : "normal";
    return Normalize.stableHash(`${Data.DB_VERSION || "db"}|${threshold}|${semantic}|${debug}|${normalized}`);
  }

  function readCache(normalized, settings, source) {
    const key = cacheKey(normalized, settings);
    if (!cache.has(key)) return null;
    const value = deepClone(cache.get(key));
    value.source = source || value.source;
    return value;
  }

  function writeCache(normalized, settings, result) {
    const key = cacheKey(normalized, settings);
    cache.set(key, deepClone(result));
    if (cache.size > ANALYSIS_CACHE_LIMIT) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
  }

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function compileRegex(pattern) {
    try {
      return new RegExp(pattern, "u");
    } catch (error) {
      console.warn("Grammar Sensei: invalid regex", pattern, error);
      return null;
    }
  }

  function findEntryHit(entry, text) {
    const hits = [];

    for (const variant of entry.variants || [entry.display || entry.pattern]) {
      const index = text.indexOf(variant);
      if (index >= 0) {
        hits.push({
          text: variant,
          index,
          length: variant.length,
          exactVariant: variant === entry.display || variant === entry.pattern,
          regex: false
        });
      }
    }

    if (entry.regex) {
      const regex = compileRegex(entry.regex);
      const match = regex ? text.match(regex) : null;
      if (match && typeof match.index === "number") {
        hits.push({
          text: match[0],
          index: match.index,
          length: match[0].length,
          exactVariant: match[0] === entry.display || match[0] === entry.pattern,
          regex: true
        });
      }
    }

    if (!hits.length) return null;

    return hits.sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      if (Number(b.exactVariant) !== Number(a.exactVariant)) return Number(b.exactVariant) - Number(a.exactVariant);
      if (Number(b.regex) !== Number(a.regex)) return Number(b.regex) - Number(a.regex);
      return a.index - b.index;
    })[0];
  }

  function hasNegativePattern(entry, text) {
    return (entry.negativeRegex || []).some((pattern) => {
      const regex = compileRegex(pattern);
      return regex ? regex.test(text) : text.includes(pattern);
    });
  }

  function scoreMatch(entry, hit, text) {
    const priorityScore = entry.priority || 50;
    const lengthScore = Math.min(hit.length * 2.4, 22);
    const exactVariantBonus = hit.exactVariant ? 8 : 0;
    const regexBonus = hit.regex ? 4 : 0;
    const before = text[hit.index - 1] || "";
    const after = text[hit.index + hit.length] || "";
    const contextBonus = /[をがはにでへと、。！？!?]/u.test(before) || /[、。！？!?ですます]/u.test(after) ? 5 : 0;
    const ambiguityPenalty = hit.length <= 2 ? 18 : hit.length <= 3 ? 8 : 0;
    const negativePatternPenalty = hasNegativePattern(entry, text) && !entry.tags?.includes("negative") ? 8 : 0;
    const focusedSelectionBonus = text.length <= hit.length + 2 ? 30 : 0;
    return priorityScore + lengthScore + exactVariantBonus + regexBonus + contextBonus + focusedSelectionBonus - ambiguityPenalty - negativePatternPenalty;
  }

  function confidenceFromScore(score) {
    return Math.max(0, Math.min(99, Math.round(score)));
  }

  function expandMatchedText(text, hit) {
    if (Conjugation?.expandGrammarPhrase) {
      return Conjugation.expandGrammarPhrase(text, hit).matchedText;
    }

    const boundary = /[はがをにでへともの、。！？!?\s]/u;
    let start = hit.index;
    let budget = 6;

    while (start > 0 && budget > 0) {
      const previous = text[start - 1];
      if (boundary.test(previous)) break;
      start -= 1;
      budget -= 1;
    }

    return text.slice(start, hit.index + hit.length);
  }

  function toResultMatch(entry, hit, text, score) {
    const example = entry.examples?.[0] || null;
    const confidence = confidenceFromScore(score);
    const context = Conjugation?.inferMatchContext
      ? Conjugation.inferMatchContext(text, hit)
      : { matchedText: expandMatchedText(text, hit), form: "unknown", leftContext: "", phraseStart: hit.index };
    const tokenWindow = Tokenizer?.getTokenWindow
      ? Tokenizer.getTokenWindow(text, hit.index, hit.index + hit.length)
      : { before: [], inside: [], after: [] };
    return {
      id: entry.id,
      grammar: entry.pattern,
      display: entry.display || entry.pattern,
      detected: hit.text,
      matchedText: context.matchedText,
      conjugation: {
        form: context.form,
        leftContext: context.leftContext || "",
        phraseStart: context.phraseStart ?? hit.index
      },
      tokens: {
        before: tokenWindow.before,
        inside: tokenWindow.inside,
        after: tokenWindow.after
      },
      meaning_vi: entry.meaning_vi,
      meaning_en: entry.meaning_en,
      meaning: entry.meaning_vi || entry.meaning_en,
      structure: entry.structure,
      structures: entry.structures || [entry.structure],
      example,
      exampleText: example ? `${example.ja} (${example.vi})` : "",
      examples: entry.examples || [],
      jlpt_level: entry.jlpt_level,
      nuance_vi: entry.nuance_vi,
      nuance_en: entry.nuance_en,
      nuance: entry.nuance_vi || entry.nuance_en,
      confusions: entry.confusions || [],
      tags: entry.tags || [],
      confidence,
      index: hit.index,
      score,
      regex: hit.regex
    };
  }

  function sortMatches(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedText.length !== a.matchedText.length) return b.matchedText.length - a.matchedText.length;
    if (a.index !== b.index) return a.index - b.index;
    return (b.priority || 0) - (a.priority || 0);
  }

  function buildFallback(input, normalized, detectedLanguage, source, reason, settings) {
    const semanticMode = settings.semanticMode !== false;
    const suggestions = [];

    if (!Normalize.containsJapanese(normalized) && semanticMode && ["vi", "en", "mixed"].includes(detectedLanguage)) {
      return analyzeSemanticInput(input, normalized, detectedLanguage, source, settings);
    }

    suggestions.push(
      detectedLanguage === "ja"
        ? "Hãy chọn cả cụm có đuôi ngữ pháp, ví dụ: 読んでいる hoặc 行ったことがある."
        : "Nếu đây là tiếng Việt/Anh, hãy bật Semantic mode hoặc nhập trong Manual Input."
    );

    return {
      input,
      normalized_input: normalized,
      detectedLanguage,
      source,
      primary: null,
      matches: [],
      suggestions,
      romaji: Normalize.containsJapanese(input) ? Romaji.toRomaji(input) : "",
      romajiQuality: Romaji.romajiQuality,
      translation_vi: "",
      warnings: [reason || "Không tìm thấy mẫu ngữ pháp đủ chắc chắn."],
      grammar: "Not detected",
      meaning: reason || "Không tìm thấy mẫu ngữ pháp trong dữ liệu local.",
      structure: "-",
      example: "-",
      jlpt_level: "-",
      confidence: 0,
      all_matches: []
    };
  }

  function buildResult(input, normalized, detectedLanguage, source, matches, settings) {
    const threshold = settings.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
    const visibleMatches = matches.filter((match) => match.confidence >= MIN_DISPLAY_CONFIDENCE);
    const thresholdMatches = visibleMatches.filter((match) => match.confidence >= threshold);
    const finalMatches = thresholdMatches;

    if (!finalMatches.length) {
      const fallback = buildFallback(input, normalized, detectedLanguage, source, "Không có match vượt ngưỡng confidence.", settings);
      if (settings.debugMatches) {
        fallback.debug_matches = visibleMatches;
        fallback.warnings.push("Debug matches are included because debugMatches is enabled.");
      }
      return fallback;
    }

    const primary = finalMatches[0];
    return {
      input,
      normalized_input: normalized,
      detectedLanguage,
      source,
      primary,
      matches: finalMatches,
      suggestions: finalMatches.length > 1
        ? ["Câu này có nhiều mẫu ngữ pháp. Hãy xem danh sách Also detected để phân biệt."]
        : [],
      romaji: Romaji.toRomaji(input),
      romajiQuality: Romaji.romajiQuality,
      translation_vi: "",
      warnings: [],
      grammar: primary.grammar,
      meaning: primary.meaning_vi,
      structure: primary.structure,
      example: primary.exampleText || primary.example?.ja || "-",
      jlpt_level: primary.jlpt_level,
      confidence: primary.confidence,
      tags: unique(finalMatches.flatMap((match) => match.tags)),
      all_matches: finalMatches.map((match) => match.display)
    };
  }

  function analyzeJapaneseInput(input, normalized, detectedLanguage, source, settings) {
    const cached = readCache(normalized, settings, source);
    if (cached) return cached;

    const matches = entries()
      .map((entry) => {
        const hit = findEntryHit(entry, normalized);
        if (!hit) return null;
        const score = scoreMatch(entry, hit, normalized);
        const match = toResultMatch(entry, hit, normalized, score);
        match.priority = entry.priority || 0;
        return match;
      })
      .filter(Boolean)
      .sort(sortMatches);

    const result = buildResult(input, normalized, detectedLanguage, source, matches, settings);
    writeCache(normalized, settings, result);
    return result;
  }

  function analyzeSemanticInput(input, normalized, detectedLanguage, source, settings) {
    const lower = normalized.toLocaleLowerCase("vi");
    const matches = semanticEntries()
      .map((mapping) => {
        const keywords = detectedLanguage === "en" ? mapping.enKeywords : mapping.viKeywords.concat(mapping.enKeywords);
        const keyword = keywords.find((item) => lower.includes(item.toLocaleLowerCase("vi")));
        if (!keyword) return null;
        const entry = entryById(mapping.grammarId);
        if (!entry) return null;
        const example = entry.examples?.[0] || null;
        return {
          id: entry.id,
          grammar: entry.pattern,
          display: entry.display || entry.pattern,
          detected: keyword,
          matchedText: keyword,
          meaning_vi: entry.meaning_vi,
          meaning_en: entry.meaning_en,
          meaning: entry.meaning_vi || entry.meaning_en,
          structure: entry.structure,
          structures: entry.structures || [entry.structure],
          example,
          exampleText: example ? `${example.ja} (${example.vi})` : "",
          examples: entry.examples || [],
          jlpt_level: entry.jlpt_level,
          nuance_vi: `Đây là mẫu tương đương khi diễn đạt ý "${mapping.intent}" sang tiếng Nhật; mẫu này không xuất hiện trực tiếp trong câu gốc.`,
          nuance_en: "This is an equivalent Japanese grammar pattern for the input intent, not a direct match in the source sentence.",
          confusions: entry.confusions || [],
          tags: unique([...(entry.tags || []), "semantic"]),
          confidence: mapping.confidence,
          index: lower.indexOf(keyword.toLocaleLowerCase("vi")),
          score: mapping.confidence,
          semanticIntent: mapping.intent
        };
      })
      .filter(Boolean)
      .sort(sortMatches);

    if (!matches.length) {
      return {
        input,
        normalized_input: normalized,
        detectedLanguage,
        source,
        primary: null,
        matches: [],
        suggestions: ["Không tìm thấy intent local phù hợp. AI mode vẫn đang tắt mặc định để bảo vệ riêng tư."],
        romaji: "",
        romajiQuality: Romaji.romajiQuality,
        translation_vi: detectedLanguage === "vi" ? input : "",
        warnings: ["Semantic mode không tìm thấy gợi ý đủ chắc."],
        grammar: "Not detected",
        meaning: "Không tìm thấy mẫu tương đương trong semantic map local.",
        structure: "-",
        example: "-",
        jlpt_level: "-",
        confidence: 0,
        all_matches: []
      };
    }

    const primary = matches[0];
    return {
      input,
      normalized_input: normalized,
      detectedLanguage,
      source,
      primary,
      matches,
      suggestions: ["Đây là gợi ý mẫu tương đương khi chuyển ý sang tiếng Nhật, không phải match trực tiếp."],
      romaji: "",
      romajiQuality: Romaji.romajiQuality,
      translation_vi: detectedLanguage === "vi" ? input : "",
      warnings: [],
      grammar: primary.grammar,
      meaning: primary.meaning_vi,
      structure: primary.structure,
      example: primary.exampleText || primary.example?.ja || "-",
      jlpt_level: primary.jlpt_level,
      confidence: primary.confidence,
      tags: unique(matches.flatMap((match) => match.tags)),
      all_matches: matches.map((match) => match.display)
    };
  }

  function analyzeText(text, options = {}) {
    const input = String(text || "").trim();
    const source = options.source || "manual";
    const settings = {
      confidenceThreshold: options.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD,
      semanticMode: options.semanticMode !== false,
      debugMatches: Boolean(options.debugMatches)
    };
    const normalized = Normalize.normalizeText(input);
    const matchText = Normalize.normalizeForMatch(input);
    const detectedLanguage = Normalize.detectLanguage(input);

    if (!normalized) {
      return buildFallback("", "", "unknown", source, "Không có nội dung để phân tích.", settings);
    }

    if (Normalize.containsJapanese(input)) {
      return analyzeJapaneseInput(input, matchText, detectedLanguage === "mixed" ? "mixed" : "ja", source, settings);
    }

    return buildFallback(input, normalized, detectedLanguage, source, "", settings);
  }

  function analyzeBatch(sentences, options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 50), 100));
    return (sentences || [])
      .slice(0, limit)
      .map((sentence) => analyzeText(sentence, { ...options, source: options.source || "scan" }));
  }

  function getSummary() {
    const byLevel = entries().reduce((acc, entry) => {
      acc[entry.jlpt_level] = (acc[entry.jlpt_level] || 0) + 1;
      return acc;
    }, {});

    return {
      version: Data.DB_VERSION,
      total: entries().length,
      byLevel,
      tags: unique(entries().flatMap((entry) => entry.tags || [])).sort(),
      patterns: entries().map((entry) => ({
        id: entry.id,
        pattern: entry.pattern,
        display: entry.display,
        jlpt_level: entry.jlpt_level,
        meaning_vi: entry.meaning_vi,
        meaning_en: entry.meaning_en,
        tags: entry.tags || []
      }))
    };
  }

  function clearCache() {
    cache.clear();
  }

  Core.Analyzer = {
    ANALYSIS_CACHE_LIMIT,
    DEFAULT_CONFIDENCE_THRESHOLD,
    analyzeText,
    analyzeBatch,
    getSummary,
    clearCache,
    entryById,
    entries
  };
})(globalThis);
