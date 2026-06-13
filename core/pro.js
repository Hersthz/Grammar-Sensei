/* Grammar Sensei - Pro entitlement policy.
 *
 * Pure, dependency-free rules for what Pro unlocks. The actual paid status is
 * resolved in the service worker (storage now; ExtensionPay later) and passed
 * into these helpers, so this file stays testable and free of chrome APIs.
 */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const PRICE_USD = 10;
  const FREE_SCAN_LIMIT = 15;
  const MAX_SCAN_LIMIT = 100;

  // Feature key -> short human label (shown in upgrade prompts).
  const PRO_FEATURES = {
    exportNotebook: "Xuất sổ tay ra Anki / CSV",
    unlimitedScan: `Quét hơn ${FREE_SCAN_LIMIT} câu mỗi trang`,
    notebookSync: "Đồng bộ sổ tay giữa nhiều máy",
    advancedStats: "Thống kê học tập nâng cao"
  };

  function isProStatus(status) {
    return Boolean(status && status.paid === true);
  }

  // Free users get analysis on every scanned sentence, but capped count.
  function effectiveScanLimit(requestedLimit, paid) {
    const requested = Math.max(1, Math.min(Number(requestedLimit) || FREE_SCAN_LIMIT, MAX_SCAN_LIMIT));
    return paid ? requested : Math.min(requested, FREE_SCAN_LIMIT);
  }

  function canUse(featureKey, paid) {
    if (!Object.prototype.hasOwnProperty.call(PRO_FEATURES, featureKey)) return true;
    return Boolean(paid);
  }

  Core.Pro = {
    PRICE_USD,
    FREE_SCAN_LIMIT,
    MAX_SCAN_LIMIT,
    PRO_FEATURES,
    isProStatus,
    effectiveScanLimit,
    canUse
  };
})(globalThis);
