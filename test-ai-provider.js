/* Grammar Sensei cloud AI provider tests */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = __dirname;
const files = [
  "data/grammar-database.js",
  "data/grammar-phase4-pack.js",
  "data/grammar-phase8-pack.js",
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

  console.log("AI provider tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
