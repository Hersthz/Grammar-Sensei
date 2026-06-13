/* Grammar Sensei cloud AI provider tests */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = __dirname;
const files = [
  "data/grammar-n5.js",
  "data/grammar-n4.js",
  "data/grammar-n3.js",
  "data/grammar-n2.js",
  "data/grammar-n1.js",
  "core/ai-provider.js"
];

let capturedFetch = null;
let fetchCount = 0;

const context = {
  console,
  URL,
  Date,
  Math,
  AbortController,
  setTimeout,
  clearTimeout,
  fetch: async (url, options) => {
    fetchCount += 1;
    capturedFetch = {
      url,
      options,
      body: JSON.parse(options.body)
    };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        detectedLanguage: "ja",
        originalSentence: "日本に行ったことがあります。",
        japaneseEquivalent: "",
        matches: [
          {
            grammarId: "ta-koto-ga-aru",
            pattern: "〜たことがある",
            matchedText: "行ったことがあります",
            jlptLevel: "N4",
            meaningVi: "đã từng làm gì",
            meaningEn: "have experienced doing something",
            structure: "Vた + ことがある",
            explanationVi: "Dùng để nói về trải nghiệm trong quá khứ.",
            confidence: 0.92,
            whyMatched: "Có thể た + ことがあります.",
            possibleConfusions: ["ことができる"]
          }
        ],
        warning: ""
      })
    };
  },
  globalThis: {}
};
context.globalThis = context;
vm.createContext(context);

for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const AIProvider = context.GrammarSenseiCore.AIProvider;
const grammarEntries = context.GrammarSenseiData.GRAMMAR_DATABASE;

(async () => {
  const noConsent = await new AIProvider.CloudAIProvider().analyze("日本に行ったことがあります。", {
    aiConsentAccepted: false,
    cloudEndpoint: "https://api.example.com/v1/grammar/analyze",
    grammarEntries
  });
  assert.strictEqual(noConsent.available, false);
  assert.strictEqual(noConsent.requiresConsent, true);
  assert.strictEqual(fetchCount, 0);

  const invalidEndpoint = await new AIProvider.CloudAIProvider().analyze("日本に行ったことがあります。", {
    aiConsentAccepted: true,
    cloudEndpoint: "http://example.com/v1/grammar/analyze",
    grammarEntries
  });
  assert.strictEqual(invalidEndpoint.available, false);
  assert.strictEqual(invalidEndpoint.requiresConfiguration, true);
  assert.strictEqual(fetchCount, 0);

  const endpoint = AIProvider.normalizeCloudEndpoint("https://api.example.com");
  assert.strictEqual(endpoint.ok, true);
  assert.strictEqual(endpoint.url, "https://api.example.com/v1/grammar/analyze");

  const localResult = {
    input: "日本に行ったことがあります。",
    normalized_input: "日本に行ったことがあります。",
    detectedLanguage: "ja",
    source: "selection",
    primary: {
      id: "ta-koto-ga-aru",
      display: "たことがある",
      matchedText: "行ったことがあります",
      meaning_vi: "đã từng làm gì",
      jlpt_level: "N4",
      confidence: 92
    },
    matches: [],
    suggestions: [],
    romaji: "",
    warnings: []
  };

  const result = await new AIProvider.CloudAIProvider().analyze(localResult.input, {
    aiConsentAccepted: true,
    cloudEndpoint: "https://api.example.com/v1/grammar/analyze",
    aiTimeoutMs: 5000,
    grammarEntries,
    grammarDbVersion: context.GrammarSenseiData.DB_VERSION,
    localResult,
    strictMode: true,
    detectedLanguage: "ja",
    source: "sidepanel",
    uiLanguage: "vi",
    extensionVersion: "1.0.0"
  });

  assert.strictEqual(result.available, true);
  assert.strictEqual(result.matches[0].grammarId, "ta-koto-ga-aru");
  assert.strictEqual(capturedFetch.body.sentence, localResult.input);
  assert.strictEqual(capturedFetch.body.privacy.excludesPageUrl, true);
  assert.strictEqual(capturedFetch.body.privacy.excludesPageTitle, true);
  assert.strictEqual(capturedFetch.body.privacy.excludesFullPageText, true);
  assert(!("pageUrl" in capturedFetch.body));
  assert(!("pageTitle" in capturedFetch.body));
  assert(capturedFetch.body.allowedGrammarIds.includes("ta-koto-ga-aru"));
  assert(capturedFetch.body.grammarCandidates.length > 0);

  // --- Browser (on-device Prompt API) provider ---

  // 1. No API available → graceful unavailable.
  delete context.LanguageModel;
  const noApi = await new AIProvider.BrowserAIProvider().analyze("テストです。", { grammarEntries });
  assert.strictEqual(noApi.available, false);
  assert.strictEqual(noApi.mode, "browser");

  // 2. Model needs download → downloading flag, no blocking.
  context.LanguageModel = {
    availability: async () => "downloadable",
    create: async () => ({ prompt: async () => "{}", destroy() {} })
  };
  const downloading = await new AIProvider.BrowserAIProvider().analyze("テストです。", { grammarEntries });
  assert.strictEqual(downloading.available, false);
  assert.strictEqual(downloading.downloading, true);

  // 3. Model available → returns normalized matches from structured JSON.
  let capturedConstraint = null;
  context.LanguageModel = {
    availability: async () => "available",
    create: async (opts) => {
      assert(Array.isArray(opts.initialPrompts) && opts.initialPrompts[0].role === "system");
      return {
        prompt: async (text, options) => {
          capturedConstraint = options?.responseConstraint || null;
          return JSON.stringify({
            detectedLanguage: "ja",
            japaneseEquivalent: "",
            matches: [
              {
                pattern: "〜たことがある",
                grammarId: "ta-koto-ga-aru",
                matchedText: "行ったことがあります",
                jlptLevel: "N4",
                meaningVi: "đã từng làm gì",
                structure: "Vた + ことがある",
                explanationVi: "Diễn tả trải nghiệm trong quá khứ.",
                confidence: 0.9,
                whyMatched: "た + ことがあります",
                possibleConfusions: ["ことができる"]
              }
            ],
            warning: ""
          });
        },
        destroy() {}
      };
    }
  };
  const onDevice = await new AIProvider.BrowserAIProvider().analyze("日本に行ったことがあります。", {
    grammarEntries,
    detectedLanguage: "ja",
    aiTimeoutMs: 5000
  });
  assert.strictEqual(onDevice.available, true);
  assert.strictEqual(onDevice.mode, "browser");
  assert.strictEqual(onDevice.onDevice, true);
  assert.strictEqual(onDevice.matches[0].grammarId, "ta-koto-ga-aru");
  assert.strictEqual(onDevice.matches[0].jlptLevel, "N4");
  assert(capturedConstraint && capturedConstraint.type === "object");

  // 4. Model returns fenced / messy JSON → safeParseJson recovers it.
  context.LanguageModel = {
    availability: async () => "available",
    create: async () => ({
      prompt: async () => "```json\n{\"detectedLanguage\":\"vi\",\"matches\":[{\"pattern\":\"〜たい\",\"explanationVi\":\"muốn làm gì\",\"confidence\":0.7}]}\n```",
      destroy() {}
    })
  };
  const fenced = await new AIProvider.BrowserAIProvider().analyze("tôi muốn ăn", { grammarEntries });
  assert.strictEqual(fenced.available, true);
  assert.strictEqual(fenced.matches[0].pattern, "〜たい");

  // --- aiResultToAnalysis: AI result → local analysis shape for the UI ---

  const entryById = (id) => grammarEntries.find((entry) => entry.id === id) || null;

  // 5. Unavailable / empty AI results convert to null (no fake card).
  assert.strictEqual(AIProvider.aiResultToAnalysis({ available: false }, { entryById }), null);
  assert.strictEqual(AIProvider.aiResultToAnalysis({ available: true, matches: [] }, { entryById }), null);

  // 6. Available AI result with a known grammarId converts to a renderable analysis,
  //    flags aiGenerated, scales confidence 0-1 → 0-99, and grafts DB examples.
  const aiAnalysis = AIProvider.aiResultToAnalysis(onDevice, {
    input: "日本に行ったことがあります。",
    source: "selection",
    entryById
  });
  assert(aiAnalysis && aiAnalysis.aiGenerated === true);
  assert.strictEqual(aiAnalysis.primary.id, "ta-koto-ga-aru");
  assert.strictEqual(aiAnalysis.primary.confidence, 90);
  assert(aiAnalysis.primary.tags.includes("ai"));
  assert(Array.isArray(aiAnalysis.matches) && aiAnalysis.matches.length === 1);
  assert.strictEqual(aiAnalysis.jlpt_level, "N4");
  // DB entry resolved → curated examples grafted on for a complete card.
  assert(aiAnalysis.primary.examples.length > 0);

  // 7. AI match with an unknown grammarId still converts (no DB entry needed).
  const novel = AIProvider.aiResultToAnalysis({
    available: true,
    mode: "browser",
    detectedLanguage: "ja",
    japaneseEquivalent: "",
    matches: [{ pattern: "〜とはいえ", grammarId: "", matchedText: "とはいえ", jlptLevel: "N1", explanationVi: "tuy nói là ... nhưng", confidence: 0.6 }],
    warning: ""
  }, { input: "とはいえ難しい。", source: "selection", entryById });
  assert(novel && novel.aiGenerated === true);
  assert.strictEqual(novel.primary.display, "〜とはいえ");
  assert.strictEqual(novel.primary.confidence, 60);
  assert(novel.primary.id.startsWith("ai:"));

  console.log("AI provider tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
