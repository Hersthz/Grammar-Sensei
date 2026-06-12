/* Grammar Sensei - AI provider interface and safe stubs */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

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

  class NoAIProvider {
    constructor() {
      this.name = "off";
    }

    async analyze() {
      return {
        available: false,
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
          warning: "Browser AI is not available in this Chrome profile.",
          prompt: buildStrictPrompt(input, context.grammarEntries || [], context)
        };
      }

      return {
        available: false,
        warning: "Browser AI provider is prepared but disabled in Phase 1.",
        prompt: buildStrictPrompt(input, context.grammarEntries || [], context)
      };
    }
  }

  class CloudAIProvider {
    constructor() {
      this.name = "cloud";
    }

    async analyze(input, context) {
      return {
        available: false,
        warning: "Cloud AI is not configured in Phase 1. No text was sent to a cloud provider.",
        prompt: buildStrictPrompt(input, context.grammarEntries || [], context)
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
    buildStrictPrompt,
    NoAIProvider,
    BrowserAIProvider,
    CloudAIProvider,
    createAIProvider
  };
})(globalThis);
