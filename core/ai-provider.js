/* Grammar Sensei - AI provider interface, cloud contract, and safe defaults */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const CLOUD_SCHEMA_VERSION = "grammar-sensei-cloud-ai-v1";
  const DEFAULT_AI_TIMEOUT_MS = 12000;
  const MAX_SENTENCE_LENGTH = 1200;

  // JSON Schema used as a responseConstraint for the on-device Prompt API so
  // Gemini Nano returns structured grammar analysis instead of free text.
  const BROWSER_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
      detectedLanguage: { type: "string", enum: ["ja", "vi", "en", "mixed", "unknown"] },
      japaneseEquivalent: { type: "string" },
      matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            pattern: { type: "string" },
            grammarId: { type: "string" },
            matchedText: { type: "string" },
            jlptLevel: { type: "string" },
            meaningVi: { type: "string" },
            meaningEn: { type: "string" },
            structure: { type: "string" },
            explanationVi: { type: "string" },
            confidence: { type: "number" },
            whyMatched: { type: "string" },
            possibleConfusions: { type: "array", items: { type: "string" } }
          },
          required: ["pattern", "explanationVi", "confidence"]
        }
      },
      warning: { type: "string" }
    },
    required: ["detectedLanguage", "matches"]
  };

  const BROWSER_SYSTEM_INSTRUCTION = [
    "You are Grammar Sensei, a Japanese grammar tutor for Vietnamese learners.",
    "You can read Japanese, Vietnamese, and English input.",
    "Task: detect the grammar patterns in the input and explain them in Vietnamese.",
    "If the input is Japanese, identify the actual grammar patterns present in the sentence.",
    "If the input is Vietnamese or English, infer the meaning and return the equivalent Japanese grammar pattern(s) a learner would use, and fill japaneseEquivalent with a natural Japanese sentence.",
    "Prefer grammarId values from the provided candidate list when one fits; otherwise leave grammarId empty but still fill pattern.",
    "Always answer with confidence between 0 and 1. Use low confidence when unsure rather than refusing.",
    "Return JSON only, matching the requested schema."
  ].join("\n");

  const AI_RESPONSE_SCHEMA = {
    detectedLanguage: "ja|vi|en|mixed|unknown",
    originalSentence: "string",
    japaneseEquivalent: "string",
    matches: [
      {
        grammarId: "string",
        pattern: "string",
        matchedText: "string",
        jlptLevel: "string",
        meaningVi: "string",
        meaningEn: "string",
        structure: "string",
        explanationVi: "string",
        confidence: "number 0..1",
        whyMatched: "string",
        possibleConfusions: ["string"]
      }
    ],
    warning: "string"
  };

  function safeString(value, max = 500) {
    return String(value ?? "").trim().slice(0, max);
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  }

  function compactEntry(entry) {
    return {
      id: entry.id,
      pattern: entry.pattern,
      display: entry.display || entry.pattern,
      jlpt_level: entry.jlpt_level,
      meaning_vi: entry.meaning_vi,
      meaning_en: entry.meaning_en,
      structure: entry.structure,
      tags: entry.tags || [],
      confusions: entry.confusions || [],
      related: entry.related || []
    };
  }

  function compactMatch(match) {
    if (!match) return null;
    return {
      id: match.id,
      grammar: match.grammar,
      display: match.display,
      detected: match.detected,
      matchedText: match.matchedText,
      meaning_vi: match.meaning_vi,
      meaning_en: match.meaning_en,
      structure: match.structure,
      jlpt_level: match.jlpt_level,
      nuance_vi: match.nuance_vi,
      confusions: match.confusions || [],
      related: match.related || [],
      tags: match.tags || [],
      confidence: match.confidence,
      index: match.index
    };
  }

  function compactLocalResult(localResult) {
    if (!localResult || typeof localResult !== "object") return null;
    return {
      normalized_input: localResult.normalized_input || "",
      detectedLanguage: localResult.detectedLanguage || "unknown",
      source: localResult.source || "manual",
      primary: compactMatch(localResult.primary),
      matches: (localResult.matches || []).slice(0, 10).map(compactMatch).filter(Boolean),
      suggestions: (localResult.suggestions || []).slice(0, 5),
      romaji: localResult.romaji || "",
      romajiQuality: localResult.romajiQuality || "",
      warnings: (localResult.warnings || []).slice(0, 5)
    };
  }

  function candidateEntries(grammarEntries, localResult, limit = 40) {
    const entries = grammarEntries || [];
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    const candidateIds = new Set();

    for (const match of localResult?.matches || []) {
      if (match?.id) candidateIds.add(match.id);
    }
    if (localResult?.primary?.id) candidateIds.add(localResult.primary.id);

    const candidates = [...candidateIds]
      .map((id) => byId.get(id))
      .filter(Boolean);

    if (candidates.length < 12) {
      for (const entry of entries) {
        if (candidates.length >= limit) break;
        if (!candidateIds.has(entry.id)) {
          candidates.push(entry);
          candidateIds.add(entry.id);
        }
      }
    }

    return candidates.slice(0, limit).map(compactEntry);
  }

  function buildStrictPrompt(input, grammarEntries, options = {}) {
    const strictMode = options.strictMode !== false;
    const grammarList = grammarEntries
      .slice(0, 80)
      .map((entry) => `${entry.id}: ${entry.pattern} (${entry.jlpt_level}) - ${entry.meaning_vi}`)
      .join("\n");

    return [
      "You are Grammar Sensei, a Japanese grammar assistant for Vietnamese learners.",
      "Return only valid JSON. Do not return markdown.",
      strictMode ? "Use only grammarId values from the provided database. Do not invent grammar outside the database." : "Prefer grammar from the provided database.",
      "If the input is Vietnamese or English, explain this as an equivalent Japanese grammar pattern, not as a pattern directly present in the input.",
      "If unsure, use low confidence.",
      "",
      "Database:",
      grammarList,
      "",
      "JSON schema:",
      JSON.stringify(AI_RESPONSE_SCHEMA),
      "",
      "Input:",
      String(input || "")
    ].join("\n");
  }

  function buildBrowserUserPrompt(input, context = {}) {
    const candidates = candidateEntries(context.grammarEntries, context.localResult, 30);
    const candidateList = candidates
      .map((entry) => `${entry.id}: ${entry.pattern} (${entry.jlpt_level}) - ${entry.meaning_vi}`)
      .join("\n");
    const local = compactLocalResult(context.localResult);
    const localHint = local?.primary
      ? `Local detector best guess: ${local.primary.display || local.primary.grammar} (${local.primary.jlpt_level}).`
      : "Local detector found no confident match.";

    return [
      `Detected language (heuristic): ${context.detectedLanguage || local?.detectedLanguage || "unknown"}.`,
      localHint,
      "",
      "Candidate grammar database (id: pattern (level) - meaning):",
      candidateList || "(none)",
      "",
      "Analyze this input and return JSON only:",
      safeString(input, MAX_SENTENCE_LENGTH)
    ].join("\n");
  }

  function safeParseJson(raw) {
    if (raw && typeof raw === "object") return raw;
    let text = String(raw || "").trim();
    if (!text) return null;
    // Strip markdown code fences if the model wrapped the JSON.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) text = fenced[1].trim();
    try {
      return JSON.parse(text);
    } catch (_error) {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch (_innerError) {
          return null;
        }
      }
      return null;
    }
  }

  function getLanguageModelApi() {
    // Modern Chrome exposes the global `LanguageModel`; older builds used
    // `self.ai.languageModel`. Support both shapes.
    return global.LanguageModel || global.ai?.languageModel || null;
  }

  function normalizeCloudEndpoint(value) {
    const raw = safeString(value, 500).replace(/\/+$/, "");
    if (!raw) return { ok: false, error: "Cloud endpoint is not configured." };

    let url;
    try {
      url = new URL(raw);
    } catch (_error) {
      return { ok: false, error: "Cloud endpoint must be a valid URL." };
    }

    const isHttps = url.protocol === "https:";
    const isLocalDev = url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (!isHttps && !isLocalDev) {
      return { ok: false, error: "Cloud endpoint must use HTTPS. HTTP is allowed only for localhost development." };
    }

    if (url.pathname === "" || url.pathname === "/") {
      url.pathname = "/v1/grammar/analyze";
    }

    return { ok: true, url: url.toString() };
  }

  function buildBackendPayload(input, context = {}) {
    const sentence = safeString(input, MAX_SENTENCE_LENGTH);
    const localResult = compactLocalResult(context.localResult);
    const grammarEntries = context.grammarEntries || [];
    const strictMode = context.strictMode !== false;

    return {
      schemaVersion: CLOUD_SCHEMA_VERSION,
      requestId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      app: "grammar-sensei",
      extensionVersion: context.extensionVersion || "1.0.0",
      uiLanguage: context.uiLanguage || "vi",
      strictMode,
      source: context.source || localResult?.source || "manual",
      detectedLanguage: context.detectedLanguage || localResult?.detectedLanguage || "unknown",
      sentence,
      localResult,
      grammarDbVersion: context.grammarDbVersion || "",
      allowedGrammarIds: strictMode ? grammarEntries.map((entry) => entry.id).filter(Boolean) : [],
      grammarCandidates: candidateEntries(grammarEntries, localResult, 40),
      responseSchema: AI_RESPONSE_SCHEMA,
      privacy: {
        sendsOnlyCurrentSentence: true,
        excludesPageUrl: true,
        excludesPageTitle: true,
        excludesFullPageText: true
      }
    };
  }

  function normalizeAIResponse(payload, input) {
    const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
    if (!data || typeof data !== "object") {
      throw new Error("AI response must be a JSON object.");
    }

    const matches = Array.isArray(data.matches) ? data.matches.slice(0, 8).map((match) => ({
      grammarId: safeString(match.grammarId || match.id, 120),
      pattern: safeString(match.pattern, 160),
      matchedText: safeString(match.matchedText || match.detected, 260),
      jlptLevel: safeString(match.jlptLevel || match.jlpt_level, 12),
      meaningVi: safeString(match.meaningVi || match.meaning_vi, 500),
      meaningEn: safeString(match.meaningEn || match.meaning_en, 500),
      structure: safeString(match.structure, 400),
      explanationVi: safeString(match.explanationVi || match.nuance_vi || match.explanation, 1000),
      confidence: clampNumber(match.confidence, 0, 1, 0),
      whyMatched: safeString(match.whyMatched, 700),
      possibleConfusions: Array.isArray(match.possibleConfusions)
        ? match.possibleConfusions.slice(0, 8).map((item) => safeString(item, 120)).filter(Boolean)
        : []
    })).filter((match) => match.grammarId || match.pattern || match.explanationVi) : [];

    return {
      detectedLanguage: safeString(data.detectedLanguage, 24) || "unknown",
      originalSentence: safeString(data.originalSentence || input, MAX_SENTENCE_LENGTH),
      japaneseEquivalent: safeString(data.japaneseEquivalent, 800),
      matches,
      warning: safeString(data.warning, 800),
      provider: "cloud",
      receivedAt: new Date().toISOString()
    };
  }

  async function fetchJsonWithTimeout(url, payload, timeoutMs) {
    const controller = new AbortController();
    const timer = global.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await global.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Grammar-Sensei-Schema": CLOUD_SCHEMA_VERSION
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const text = await response.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : {};
      } catch (_error) {
        throw new Error("Cloud backend returned non-JSON response.");
      }

      if (!response.ok) {
        const message = json?.error?.message || json?.error || `Cloud backend returned HTTP ${response.status}.`;
        throw new Error(String(message));
      }

      return json;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Cloud AI request timed out.");
      }
      throw error;
    } finally {
      global.clearTimeout(timer);
    }
  }

  class NoAIProvider {
    constructor() {
      this.name = "off";
    }

    async analyze() {
      return {
        available: false,
        mode: "off",
        warning: "AI mode is off. Grammar Sensei stayed local-only.",
        matches: []
      };
    }
  }

  class BrowserAIProvider {
    constructor() {
      this.name = "browser";
    }

    async analyze(input, context = {}) {
      const sentence = safeString(input, MAX_SENTENCE_LENGTH);
      if (!sentence) {
        return { available: false, mode: "browser", warning: "Không có nội dung để phân tích.", matches: [] };
      }

      const api = getLanguageModelApi();
      if (!api || typeof api.create !== "function") {
        return {
          available: false,
          mode: "browser",
          warning: "On-device AI (Prompt API) chưa khả dụng trong Chrome này. Cần Chrome 138+ và bật AI trên thiết bị.",
          matches: []
        };
      }

      let availability = "available";
      try {
        if (typeof api.availability === "function") {
          availability = await api.availability();
        } else if (typeof api.capabilities === "function") {
          // Legacy ai.languageModel.capabilities() → { available: "readily"|"after-download"|"no" }
          const caps = await api.capabilities();
          availability = caps?.available === "readily" ? "available"
            : caps?.available === "after-download" ? "downloadable"
            : "unavailable";
        }
      } catch (_error) {
        availability = "unavailable";
      }

      if (availability === "unavailable") {
        return {
          available: false,
          mode: "browser",
          warning: "Thiết bị này không hỗ trợ on-device AI (Gemini Nano).",
          matches: []
        };
      }

      if (availability === "downloadable" || availability === "downloading") {
        // Kick off the model download without blocking the user's request.
        try {
          Promise.resolve(api.create({
            monitor(monitor) {
              monitor.addEventListener?.("downloadprogress", () => {});
            }
          })).then((session) => session?.destroy?.()).catch(() => {});
        } catch (_error) {}
        return {
          available: false,
          mode: "browser",
          downloading: true,
          warning: "Mô hình AI trên thiết bị (Gemini Nano) đang tải xuống. Hãy bấm Ask AI lại sau ít phút.",
          matches: []
        };
      }

      let session = null;
      const timeoutMs = clampNumber(context.aiTimeoutMs, 3000, 30000, DEFAULT_AI_TIMEOUT_MS);
      const controller = typeof global.AbortController === "function" ? new global.AbortController() : null;
      const timer = controller ? global.setTimeout(() => controller.abort(), timeoutMs) : null;

      try {
        session = await api.create({
          ...(controller ? { signal: controller.signal } : {}),
          initialPrompts: [{ role: "system", content: BROWSER_SYSTEM_INSTRUCTION }]
        });

        const userPrompt = buildBrowserUserPrompt(sentence, context);
        const promptOptions = { responseConstraint: BROWSER_RESPONSE_SCHEMA };
        if (controller) promptOptions.signal = controller.signal;

        let raw;
        try {
          raw = await session.prompt(userPrompt, promptOptions);
        } catch (_constraintError) {
          // Some builds reject unknown options; retry without the constraint.
          raw = await session.prompt(userPrompt, controller ? { signal: controller.signal } : undefined);
        }

        const parsed = safeParseJson(raw);
        if (!parsed) {
          return {
            available: false,
            mode: "browser",
            warning: "On-device AI trả về dữ liệu không đọc được. Hãy thử lại.",
            matches: []
          };
        }

        const data = normalizeAIResponse(parsed, sentence);
        return {
          available: true,
          mode: "browser",
          onDevice: true,
          ...data,
          provider: "browser"
        };
      } catch (error) {
        const aborted = error?.name === "AbortError";
        return {
          available: false,
          mode: "browser",
          warning: aborted ? "On-device AI quá thời gian chờ." : `Lỗi on-device AI: ${error?.message || error}`,
          matches: []
        };
      } finally {
        if (timer) global.clearTimeout(timer);
        try { session?.destroy?.(); } catch (_error) {}
      }
    }
  }

  class CloudAIProvider {
    constructor() {
      this.name = "cloud";
    }

    async analyze(input, context = {}) {
      if (!context.aiConsentAccepted) {
        return {
          available: false,
          mode: "cloud",
          requiresConsent: true,
          warning: "Cloud AI is disabled until the user accepts the AI privacy notice.",
          matches: []
        };
      }

      const endpoint = normalizeCloudEndpoint(context.cloudEndpoint);
      if (!endpoint.ok) {
        return {
          available: false,
          mode: "cloud",
          requiresConfiguration: true,
          warning: endpoint.error,
          matches: []
        };
      }

      const payload = buildBackendPayload(input, context);
      const timeoutMs = clampNumber(context.aiTimeoutMs, 3000, 30000, DEFAULT_AI_TIMEOUT_MS);
      const response = await fetchJsonWithTimeout(endpoint.url, payload, timeoutMs);
      const data = normalizeAIResponse(response, input);

      return {
        available: true,
        mode: "cloud",
        endpoint: new URL(endpoint.url).origin,
        requestId: payload.requestId,
        payloadSchemaVersion: CLOUD_SCHEMA_VERSION,
        ...data
      };
    }
  }

  // Convert an AI provider result (browser or cloud) into the same shape the
  // local Analyzer produces, so the popup / side panel / scan UI can render an
  // AI-found grammar exactly like a local match (just flagged aiGenerated).
  // When a returned grammarId resolves to a database entry, we graft the curated
  // examples / confusions / related onto the AI explanation for the best of both.
  function aiResultToAnalysis(aiResult, options = {}) {
    if (!aiResult || aiResult.available === false) return null;
    const aiMatches = Array.isArray(aiResult.matches) ? aiResult.matches : [];
    const resolveEntry = typeof options.entryById === "function" ? options.entryById : () => null;
    const input = options.input != null ? String(options.input) : (aiResult.originalSentence || "");
    const source = options.source || "ai";
    const local = options.localResult || null;

    const matches = aiMatches.map((match) => {
      const entry = match.grammarId ? resolveEntry(match.grammarId) : null;
      const example = entry?.examples?.[0] || null;
      const confidence = clampNumber(Math.round(Number(match.confidence || 0) * 100), 0, 99, 0);
      return {
        id: match.grammarId || `ai:${(match.pattern || "match").slice(0, 60)}`,
        grammar: match.pattern || entry?.pattern || match.grammarId || "AI match",
        display: match.pattern || entry?.display || entry?.pattern || match.grammarId || "AI match",
        detected: match.matchedText || "",
        matchedText: match.matchedText || "",
        meaning_vi: match.meaningVi || entry?.meaning_vi || "",
        meaning_en: match.meaningEn || entry?.meaning_en || "",
        meaning: match.meaningVi || entry?.meaning_vi || match.meaningEn || "",
        structure: match.structure || entry?.structure || "",
        structures: entry?.structures || (match.structure ? [match.structure] : []),
        example,
        exampleText: example ? `${example.ja} (${example.vi})` : "",
        examples: entry?.examples || [],
        jlpt_level: match.jlptLevel || entry?.jlpt_level || "-",
        nuance_vi: match.explanationVi || "",
        nuance_en: "",
        whyMatched: match.whyMatched || "",
        confusions: (match.possibleConfusions && match.possibleConfusions.length ? match.possibleConfusions : entry?.confusions) || [],
        related: entry?.related || [],
        tags: ["ai", ...(entry?.tags || [])],
        confidence,
        index: 0,
        score: confidence,
        aiGenerated: true
      };
    }).filter((match) => match.display || match.nuance_vi);

    if (!matches.length) return null;
    const primary = matches[0];

    return {
      input,
      normalized_input: local?.normalized_input || input,
      detectedLanguage: aiResult.detectedLanguage || local?.detectedLanguage || "unknown",
      source,
      primary,
      matches,
      suggestions: ["Kết quả này do AI trên thiết bị (Gemini Nano) suy luận khi mẫu không có sẵn trong từ điển local."],
      romaji: local?.romaji || "",
      romajiQuality: local?.romajiQuality || "",
      translation_vi: "",
      warnings: aiResult.warning ? [aiResult.warning] : [],
      grammar: primary.grammar,
      meaning: primary.meaning_vi,
      structure: primary.structure,
      example: primary.exampleText || primary.example?.ja || "-",
      jlpt_level: primary.jlpt_level,
      confidence: primary.confidence,
      tags: [...new Set(matches.flatMap((match) => match.tags))],
      all_matches: matches.map((match) => match.display),
      aiGenerated: true,
      aiMode: aiResult.mode || "browser",
      japaneseEquivalent: aiResult.japaneseEquivalent || ""
    };
  }

  function createAIProvider(mode) {
    if (mode === "browser") return new BrowserAIProvider();
    if (mode === "cloud") return new CloudAIProvider();
    return new NoAIProvider();
  }

  // High-frequency / background sources never auto-trigger AI so the model is
  // not spammed (hover fires constantly, scan is per-batch).
  const AI_FALLBACK_BLOCKED_SOURCES = ["hover", "auto-selection", "scan", "shift-scan", "scan-batch"];

  // Pure decision: should the no-match AI fallback run? `force` is an explicit
  // user "Ask AI" gesture that bypasses the auto toggle and the source block,
  // but AI mode "off" or an existing confident local match always wins.
  function shouldAutoFallback({ aiMode, autoAiFallback, hasPrimary, source, force = false }) {
    if (aiMode === "off") return false;
    if (hasPrimary) return false;
    if (!force && !autoAiFallback) return false;
    if (!force && AI_FALLBACK_BLOCKED_SOURCES.includes(source)) return false;
    return true;
  }

  Core.AIProvider = {
    AI_RESPONSE_SCHEMA,
    BROWSER_RESPONSE_SCHEMA,
    CLOUD_SCHEMA_VERSION,
    DEFAULT_AI_TIMEOUT_MS,
    buildStrictPrompt,
    buildBrowserUserPrompt,
    buildBackendPayload,
    normalizeCloudEndpoint,
    normalizeAIResponse,
    aiResultToAnalysis,
    safeParseJson,
    NoAIProvider,
    BrowserAIProvider,
    CloudAIProvider,
    createAIProvider,
    AI_FALLBACK_BLOCKED_SOURCES,
    shouldAutoFallback
  };
})(globalThis);
