/* Grammar Sensei - AI provider interface, cloud contract, and safe defaults */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const CLOUD_SCHEMA_VERSION = "grammar-sensei-cloud-ai-v1";
  const DEFAULT_AI_TIMEOUT_MS = 12000;
  const MAX_SENTENCE_LENGTH = 1200;

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

    async analyze(input, context) {
      const promptApi = global.ai?.languageModel || global.LanguageModel;
      if (!promptApi) {
        return {
          available: false,
          mode: "browser",
          warning: "Browser AI is not available in this Chrome profile.",
          prompt: buildStrictPrompt(input, context.grammarEntries || [], context)
        };
      }

      return {
        available: false,
        mode: "browser",
        warning: "Browser AI provider is prepared but not enabled for production yet.",
        prompt: buildStrictPrompt(input, context.grammarEntries || [], context)
      };
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

  function createAIProvider(mode) {
    if (mode === "browser") return new BrowserAIProvider();
    if (mode === "cloud") return new CloudAIProvider();
    return new NoAIProvider();
  }

  Core.AIProvider = {
    AI_RESPONSE_SCHEMA,
    CLOUD_SCHEMA_VERSION,
    DEFAULT_AI_TIMEOUT_MS,
    buildStrictPrompt,
    buildBackendPayload,
    normalizeCloudEndpoint,
    normalizeAIResponse,
    NoAIProvider,
    BrowserAIProvider,
    CloudAIProvider,
    createAIProvider
  };
})(globalThis);
