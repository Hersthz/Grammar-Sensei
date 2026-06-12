/* Grammar Sensei analyzer smoke tests */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = __dirname;
const files = [
  "data/grammar-database.js",
  "data/semantic-map.js",
  "core/normalize.js",
  "core/romaji.js",
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
  ["認めざるを得ない。", "zaru-wo-enai", "N1"]
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

console.log(`Analyzer tests passed (${cases.length + 2} checks).`);
