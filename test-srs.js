/* Grammar Sensei SRS smoke tests */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const context = { console, globalThis: null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "core/srs.js"), "utf8"), context, { filename: "core/srs.js" });

const SRS = context.GrammarSenseiCore.SRS;
const now = Date.parse("2026-06-12T00:00:00.000Z");

const item = SRS.createNotebookItem({
  id: "card-1",
  analysis: {
    input: "日本に行ったことがあります。",
    primary: {
      id: "ta-koto-ga-aru",
      display: "たことがある",
      matchedText: "行ったことがあります",
      meaning_vi: "đã từng làm gì",
      meaning_en: "have experienced doing something",
      structure: "Vた + ことがある",
      jlpt_level: "N4"
    }
  }
}, now);

assert.strictEqual(item.reviewState, "new");
assert.strictEqual(item.reviewCount, 0);
assert.strictEqual(item.nextReviewAt, "2026-06-12T00:00:00.000Z");

const again = SRS.reviewNotebookItem(item, "again", now);
assert.strictEqual(again.reviewState, "learning");
assert.strictEqual(again.reviewCount, 1);
assert.strictEqual(again.lapseCount, 1);
assert.strictEqual(again.nextReviewAt, "2026-06-12T00:10:00.000Z");

const good = SRS.reviewNotebookItem(item, "good", now);
assert.strictEqual(good.reviewState, "review");
assert.strictEqual(good.reviewCount, 1);
assert.strictEqual(good.intervalDays, 1);
assert.strictEqual(good.nextReviewAt, "2026-06-13T00:00:00.000Z");

const easy = SRS.reviewNotebookItem(good, "easy", now);
assert(easy.intervalDays >= 4);
assert(easy.easeFactor > good.easeFactor);

const stats = SRS.getNotebookStats([item, good, easy], now);
assert.strictEqual(stats.total, 3);
assert.strictEqual(stats.due, 1);
assert.strictEqual(stats.new, 1);
assert.strictEqual(stats.reviewed, 2);

console.log("SRS tests passed.");
