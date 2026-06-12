/* Grammar Sensei analyzer smoke tests */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = __dirname;
const files = [
  "data/grammar-database.js",
  "data/grammar-phase4-pack.js",
  "data/semantic-map.js",
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

console.log(`Analyzer tests passed (${cases.length + 5} checks).`);
