/* Grammar Sensei conjugation tests */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = __dirname;
const files = [
  "core/conjugation.js"
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

const Conjugation = context.GrammarSenseiCore.Conjugation;

assert.strictEqual(Conjugation.detectSurfaceForm("読んで"), "te-form");
assert.strictEqual(Conjugation.detectSurfaceForm("行った"), "ta-form");
assert.strictEqual(Conjugation.detectSurfaceForm("食べない"), "nai-form");
assert.strictEqual(Conjugation.detectSurfaceForm("食べます"), "polite");
assert.strictEqual(Conjugation.detectSurfaceForm("読める"), "plain-or-noun");

const sentence = "彼は日本に行ったことがあります。";
const hit = {
  index: sentence.indexOf("たこと"),
  length: "たことがあります".length,
  text: "たことがあります"
};
const expanded = Conjugation.expandGrammarPhrase(sentence, hit);
assert.strictEqual(expanded.matchedText, "行ったことがあります");
assert.strictEqual(expanded.leftContext, "行っ");
assert.strictEqual(expanded.form, "plain-or-noun");

console.log("NLP tests passed.");
