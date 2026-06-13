/* Grammar Sensei analyzer smoke tests */
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
  "data/semantic-n5.js",
  "data/semantic-n4.js",
  "data/semantic-n3.js",
  "data/semantic-n2.js",
  "data/semantic-n1.js",
  "core/normalize.js",
  "core/romaji.js",
  "core/tokenizer.js",
  "core/conjugation.js",
  "core/ai-provider.js",
  "core/matcher.js"
];

const context = {
  console,
  globalThis: {}
};
context.globalThis = context;
vm.createContext(context);

for (const file of files) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
}

const Analyzer = context.GrammarSenseiCore.Analyzer;
const summary = Analyzer.getSummary();
assert(summary.total >= 200, `Expected at least 200 grammar patterns, got ${summary.total}`);
assert.strictEqual(summary.total, 449, "DB count should stay stable unless content is intentionally changed (N5:39 N4:80 N3:107 N2:137 N1:86)");

const cases = [
  ["彼は本を読んでいる。", "te-iru", "N5"],
  ["ケーキを全部食べてしまった。", "te-shimau", "N4"],
  ["宿題をしなければならない。", "nakereba-naranai", "N4"],
  ["日本に行ったことがあります。", "ta-koto-ga-aru", "N4"],
  ["日本語を話すことができます。", "koto-ga-dekiru", "N4"],
  ["ここに座ってもいいですか。", "temo-ii", "N5"],
  ["ここで写真を撮ってはいけない。", "tewa-ikenai", "N5"],
  ["毎日運動するようにしている。", "you-ni-suru", "N3"],
  ["漢字が読めるようになった。", "you-ni-naru", "N3"],
  ["早く寝たほうがいい。", "hou-ga-ii", "N4"],
  ["明日は雨かもしれない。", "kamo-shirenai", "N4"],
  ["彼はもう着いたはずです。", "hazu", "N3"],
  ["約束は守るべきです。", "beki", "N3"],
  ["雨にもかかわらず、試合は行われた。", "nimo-kakawarazu", "N2"],
  ["認めざるを得ない。", "zaru-wo-enai", "N1"],
  ["この本は読みやすいです。", "yasui", "N4"],
  ["この漢字は覚えにくいです。", "nikui", "N4"],
  ["友達に手伝ってもらいました。", "te-morau", "N4"],
  ["先生が説明してくれました。", "te-kureru", "N4"],
  ["雨のせいで試合が中止になった。", "sei-de", "N3"],
  ["先生のおかげで合格できました。", "okage-de", "N3"],
  ["若いうちにたくさん旅行したい。", "uchi-ni", "N3"],
  ["先生に聞けばいいです。", "ba-ii", "N4"],
  ["待つしかありません。", "shika-nai", "N4"],
  ["日本語なら、少し話せます。", "nara", "N4"]
  ,
  ["\u96e8\u304c\u964d\u3063\u305f\u3089\u3001\u884c\u304d\u307e\u305b\u3093\u3002", "tara", "N4"],
  ["\u5f7c\u306f\u5b66\u751f\u306b\u9055\u3044\u306a\u3044\u3002", "ni-chigainai", "N3"],
  ["\u5f7c\u304c\u6765\u308b\u306f\u305a\u304c\u306a\u3044\u3002", "hazu-ga-nai", "N3"],
  ["\u3053\u308c\u306f\u5922\u306e\u3088\u3046\u306a\u8a71\u3067\u3059\u3002", "you-na", "N4"],
  ["\u5e74\u3092\u53d6\u308b\u306b\u3064\u308c\u3066\u3001\u4f53\u529b\u304c\u843d\u3061\u307e\u3059\u3002", "ni-tsurete", "N3"],
  ["\u8aac\u660e\u306b\u5f93\u3063\u3066\u66f8\u3044\u3066\u304f\u3060\u3055\u3044\u3002", "ni-shitagatte", "N3"],
  ["\u79c1\u306b\u3068\u3063\u3066\u5bb6\u65cf\u304c\u5927\u5207\u3067\u3059\u3002", "ni-totte", "N3"],
  ["\u65e5\u672c\u6587\u5316\u306b\u95a2\u3057\u3066\u8abf\u3079\u3066\u3044\u307e\u3059\u3002", "ni-kanshite", "N3"],
  ["\u4e09\u65e5\u9593\u306b\u308f\u305f\u3063\u3066\u4f1a\u8b70\u304c\u884c\u308f\u308c\u307e\u3057\u305f\u3002", "ni-watatte", "N3"],
  ["\u7d4c\u9a13\u306b\u57fa\u3065\u3044\u3066\u5224\u65ad\u3057\u307e\u3059\u3002", "ni-motozuite", "N2"],
  ["\u5e74\u9f62\u306b\u5fdc\u3058\u3066\u6599\u91d1\u304c\u5909\u308f\u308a\u307e\u3059\u3002", "ni-oujite", "N2"],
  ["\u5148\u751f\u306b\u3088\u308b\u3068\u3001\u8a66\u9a13\u306f\u7c21\u5358\u3067\u3059\u3002", "ni-yoru-to", "N3"],
  ["\u4ed5\u4e8b\u3092\u901a\u3058\u3066\u6210\u9577\u3057\u307e\u3057\u305f\u3002", "wo-tsuujite", "N2"],
  ["\u5fc3\u3092\u8fbc\u3081\u3066\u624b\u7d19\u3092\u66f8\u304d\u307e\u3057\u305f\u3002", "wo-komete", "N2"],
  ["\u3053\u306e\u4e8b\u4ef6\u3092\u3081\u3050\u3063\u3066\u8b70\u8ad6\u304c\u7d9a\u3044\u3066\u3044\u307e\u3059\u3002", "wo-megutte", "N2"],
  ["\u52aa\u529b\u3057\u305f\u304b\u3089\u3068\u3044\u3063\u3066\u6210\u529f\u3059\u308b\u3068\u306f\u9650\u308a\u307e\u305b\u3093\u3002", "kara-to-itte", "N2"],
  ["\u5f7c\u306f\u89aa\u5207\u306a\u4e0a\u306b\u3001\u4ed5\u4e8b\u3082\u901f\u3044\u3067\u3059\u3002", "ue-ni", "N3"],
  ["\u4f11\u3080\u3053\u3068\u306a\u304f\u50cd\u304d\u307e\u3057\u305f\u3002", "koto-naku", "N2"],
  ["\u5f7c\u306f\u82f1\u8a9e\u3070\u304b\u308a\u304b\u3001\u4e2d\u56fd\u8a9e\u3082\u8a71\u305b\u307e\u3059\u3002", "bakari-ka", "N2"],
  ["\u65e5\u672c\u8a9e\u3060\u3051\u3067\u306a\u304f\u3001\u82f1\u8a9e\u3082\u8a71\u305b\u307e\u3059\u3002", "dake-de-naku", "N3"],
  ["\u7df4\u7fd2\u3055\u3048\u3059\u308c\u3070\u3001\u4e0a\u624b\u306b\u306a\u308a\u307e\u3059\u3002", "sae-ba", "N3"],
  ["\u305d\u308c\u306f\u8a00\u3044\u8a33\u306b\u3059\u304e\u307e\u305b\u3093\u3002", "ni-suginai", "N2"],
  ["\u4eca\u306f\u5f85\u3064\u307b\u304b\u3042\u308a\u307e\u305b\u3093\u3002", "hoka-nai", "N2"],
  ["\u4e8b\u6545\u304c\u8d77\u3053\u308a\u304b\u306d\u307e\u305b\u3093\u3002", "kanenai", "N2"],
  ["\u5927\u96e8\u3067\u5ddd\u304c\u3042\u3075\u308c\u308b\u6050\u308c\u304c\u3042\u308a\u307e\u3059\u3002", "osore-ga-aru", "N2"]
];

for (const [sentence, expectedId, expectedJlpt] of cases) {
  const result = Analyzer.analyzeText(sentence, {
    source: "test",
    confidenceThreshold: 70,
    semanticMode: true
  });

  assert(result.primary, `${sentence} should have a primary match`);
  assert.strictEqual(result.primary.id, expectedId, `${sentence} expected ${expectedId}, got ${result.primary.id}`);
  assert.strictEqual(result.primary.jlpt_level, expectedJlpt, `${sentence} expected ${expectedJlpt}`);
  assert(result.primary.confidence >= 70, `${sentence} confidence should be >= 70`);
}

const semantic = Analyzer.analyzeText("Tôi đã từng đi Nhật.", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
assert(semantic.primary, "Vietnamese semantic input should return a suggestion");
assert.strictEqual(semantic.primary.id, "ta-koto-ga-aru");
assert.strictEqual(semantic.detectedLanguage, "vi");

const semanticPhase8 = Analyzer.analyzeText("Kh\u00f4ng ch\u1ec9 ti\u1ebfng Nh\u1eadt m\u00e0 c\u00f2n ti\u1ebfng Anh c\u0169ng n\u00f3i \u0111\u01b0\u1ee3c.", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
assert(semanticPhase8.primary, "Phase 8 Vietnamese semantic input should return a suggestion");
assert.strictEqual(semanticPhase8.primary.id, "dake-de-naku");

const relatedCheck = Analyzer.analyzeText("\u65e5\u672c\u306b\u884c\u3063\u305f\u3053\u3068\u304c\u3042\u308a\u307e\u3059\u3002", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
assert(relatedCheck.primary.related?.includes("ta-koto-ga-nai"), "Related grammar should be exposed on enriched entries");

const fallback = Analyzer.analyzeText("猫", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
assert.strictEqual(fallback.primary, null);

const politeSentence = Analyzer.analyzeText("\u79c1\u306f\u5b66\u751f\u3067\u3059\u3002", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
assert.strictEqual(politeSentence.primary, null, "Long sentence ending in desu should not surface a low-confidence broad pattern");

const focusedDesu = Analyzer.analyzeText("\u3067\u3059", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
assert(focusedDesu.primary, "Focused selection of desu should be detected");
assert.strictEqual(focusedDesu.primary.id, "desu");

const connectorOnly = Analyzer.analyzeText("\u305d\u308c\u304b\u3089\u884c\u304d\u307e\u3059\u3002", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
assert.strictEqual(connectorOnly.primary, null, "Broad connector/polite endings should stay hidden below threshold");

const multiGrammar = Analyzer.analyzeText("\u65e9\u304f\u5bdd\u305f\u307b\u3046\u304c\u3044\u3044\u3068\u601d\u3044\u307e\u3059\u3002", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
const multiGrammarIds = multiGrammar.matches.map((match) => match.id);
assert(multiGrammarIds.includes("hou-ga-ii"), "Multi-grammar sentence should include hou-ga-ii");
assert(multiGrammarIds.includes("to-omou"), "Multi-grammar sentence should include to-omou");

const lowerConfidenceSecondary = Analyzer.analyzeText("\u30b1\u30fc\u30ad\u3092\u5168\u90e8\u98df\u3079\u3066\u3057\u307e\u3063\u305f\u306e\u3067\u3001\u3082\u3046\u4f55\u3082\u98df\u3079\u3089\u308c\u307e\u305b\u3093\u3002", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
const lowerConfidenceIds = lowerConfidenceSecondary.matches.map((match) => match.id);
assert(lowerConfidenceIds.includes("te-shimau"), "Strong primary grammar should still be included");
assert(lowerConfidenceIds.includes("node"), "Lower-confidence secondary grammar should be preserved when primary is strong");

const repeatedGrammar = Analyzer.analyzeText("\u3053\u3053\u306b\u5ea7\u3063\u3066\u3082\u3044\u3044\u3057\u3001\u3053\u3053\u3067\u98df\u3079\u3066\u3082\u3044\u3044\u3067\u3059\u3002", {
  source: "test",
  confidenceThreshold: 70,
  semanticMode: true
});
const repeatedTemoIi = repeatedGrammar.matches.filter((match) => match.id === "temo-ii");
assert.strictEqual(repeatedTemoIi.length, 2, "Repeated grammar should be detected at each occurrence");

console.log(`Analyzer tests passed (${cases.length + 13} checks).`);
