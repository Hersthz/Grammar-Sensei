/* Grammar Sensei Pro entitlement policy tests */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, "core/pro.js"), "utf8"), context, { filename: "core/pro.js" });

const Pro = context.GrammarSenseiCore.Pro;

assert.strictEqual(Pro.PRICE_USD, 10, "Price should be $10 one-time");
assert.strictEqual(Pro.isProStatus({ paid: true }), true);
assert.strictEqual(Pro.isProStatus({ paid: false }), false);
assert.strictEqual(Pro.isProStatus(null), false);
assert.strictEqual(Pro.isProStatus(undefined), false);

// Free users are capped at FREE_SCAN_LIMIT; Pro keeps the requested amount.
assert.strictEqual(Pro.effectiveScanLimit(50, false), Pro.FREE_SCAN_LIMIT, "Free scan should cap at FREE_SCAN_LIMIT");
assert.strictEqual(Pro.effectiveScanLimit(50, true), 50, "Pro scan should keep the requested limit");
assert.strictEqual(Pro.effectiveScanLimit(5, false), 5, "Free scan below cap is unchanged");
assert.strictEqual(Pro.effectiveScanLimit(999, true), Pro.MAX_SCAN_LIMIT, "Pro scan still respects MAX_SCAN_LIMIT");
assert.strictEqual(Pro.effectiveScanLimit(0, false), Pro.FREE_SCAN_LIMIT, "Falsy/0 limit falls back to FREE_SCAN_LIMIT");
assert.strictEqual(Pro.effectiveScanLimit(-5, false), 1, "Negative limit floors at 1");

// Known Pro features require payment; unknown keys are always allowed.
assert.strictEqual(Pro.canUse("exportNotebook", false), false);
assert.strictEqual(Pro.canUse("exportNotebook", true), true);
assert.strictEqual(Pro.canUse("unlimitedScan", false), false);
assert.strictEqual(Pro.canUse("somethingFree", false), true, "Non-Pro features stay free");

assert(Object.keys(Pro.PRO_FEATURES).length >= 4, "Should advertise the Pro feature set");

console.log("Pro tests passed.");
