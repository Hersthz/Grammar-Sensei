/* Grammar Sensei - lightweight local SRS helpers */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const DEFAULT_EASE = 2.5;
  const MIN_EASE = 1.3;

  function nowDate(now = Date.now()) {
    return now instanceof Date ? now : new Date(now);
  }

  function iso(now = Date.now()) {
    return nowDate(now).toISOString();
  }

  function addMinutes(now, minutes) {
    return new Date(nowDate(now).getTime() + minutes * 60000).toISOString();
  }

  function addDays(now, days) {
    return new Date(nowDate(now).getTime() + days * 86400000).toISOString();
  }

  function clampEase(value) {
    return Math.max(MIN_EASE, Number(value || DEFAULT_EASE));
  }

  function createNotebookItem(payload, now = Date.now()) {
    const analysis = payload.analysis || null;
    const primary = analysis?.primary || payload.primary || null;
    if (!primary) throw new Error("Cannot save notebook item without a grammar match.");

    return {
      id: payload.id || `${nowDate(now).getTime()}-${Math.random().toString(16).slice(2)}`,
      grammarId: primary.id,
      grammar: primary.display || primary.grammar,
      sentence: String(payload.sentence || analysis?.input || "").slice(0, 1000),
      matchedText: primary.matchedText || primary.detected || "",
      meaning_vi: primary.meaning_vi || "",
      meaning_en: primary.meaning_en || "",
      structure: primary.structure || "",
      jlpt_level: primary.jlpt_level || "",
      pageUrl: payload.pageUrl || "",
      pageTitle: payload.pageTitle || "",
      note: payload.note || "",
      createdAt: payload.createdAt || iso(now),
      lastReviewedAt: payload.lastReviewedAt || "",
      nextReviewAt: payload.nextReviewAt || iso(now),
      reviewState: payload.reviewState || "new",
      reviewCount: Number(payload.reviewCount || 0),
      lapseCount: Number(payload.lapseCount || 0),
      intervalDays: Number(payload.intervalDays || 0),
      easeFactor: clampEase(payload.easeFactor),
      lastRating: payload.lastRating || ""
    };
  }

  function normalizeNotebookItem(item, now = Date.now()) {
    return {
      id: item.id,
      grammarId: item.grammarId,
      grammar: item.grammar || item.grammarId || "",
      sentence: item.sentence || "",
      matchedText: item.matchedText || "",
      meaning_vi: item.meaning_vi || "",
      meaning_en: item.meaning_en || "",
      structure: item.structure || "",
      jlpt_level: item.jlpt_level || "",
      pageUrl: item.pageUrl || "",
      pageTitle: item.pageTitle || "",
      note: item.note || "",
      createdAt: item.createdAt || iso(now),
      lastReviewedAt: item.lastReviewedAt || "",
      nextReviewAt: item.nextReviewAt || item.createdAt || iso(now),
      reviewState: item.reviewState || "new",
      reviewCount: Number(item.reviewCount || 0),
      lapseCount: Number(item.lapseCount || 0),
      intervalDays: Number(item.intervalDays || 0),
      easeFactor: clampEase(item.easeFactor),
      lastRating: item.lastRating || ""
    };
  }

  function reviewNotebookItem(item, rating, now = Date.now()) {
    const current = normalizeNotebookItem(item, now);
    const previousInterval = Math.max(0, Number(current.intervalDays || 0));
    let ease = clampEase(current.easeFactor);
    let intervalDays = previousInterval;
    let nextReviewAt = "";
    let reviewState = "review";
    let lapseCount = current.lapseCount;

    switch (rating) {
      case "again":
        ease = clampEase(ease - 0.2);
        intervalDays = 0;
        nextReviewAt = addMinutes(now, 10);
        reviewState = "learning";
        lapseCount += 1;
        break;
      case "hard":
        ease = clampEase(ease - 0.15);
        intervalDays = Math.max(1, Math.ceil(previousInterval * 1.2));
        nextReviewAt = addDays(now, intervalDays);
        break;
      case "easy":
        ease = clampEase(ease + 0.15);
        intervalDays = previousInterval === 0 ? 4 : Math.ceil(previousInterval * ease * 1.4);
        nextReviewAt = addDays(now, intervalDays);
        break;
      case "good":
      default:
        intervalDays = previousInterval === 0 ? 1 : Math.ceil(previousInterval * ease);
        nextReviewAt = addDays(now, intervalDays);
        break;
    }

    return {
      ...current,
      lastReviewedAt: iso(now),
      nextReviewAt,
      reviewState,
      reviewCount: current.reviewCount + 1,
      lapseCount,
      intervalDays,
      easeFactor: ease,
      lastRating: rating
    };
  }

  function isDue(item, now = Date.now()) {
    const normalized = normalizeNotebookItem(item, now);
    return new Date(normalized.nextReviewAt).getTime() <= nowDate(now).getTime();
  }

  function getNotebookStats(items, now = Date.now()) {
    const normalized = (items || []).map((item) => normalizeNotebookItem(item, now));
    const due = normalized.filter((item) => isDue(item, now));
    const weak = normalized.filter((item) => item.lapseCount > 0 || item.easeFactor < 2.1);
    const newItems = normalized.filter((item) => item.reviewState === "new");
    const reviewed = normalized.filter((item) => item.reviewCount > 0);

    return {
      total: normalized.length,
      due: due.length,
      new: newItems.length,
      reviewed: reviewed.length,
      weak: weak.length,
      nextDueAt: normalized
        .map((item) => item.nextReviewAt)
        .filter(Boolean)
        .sort()[0] || ""
    };
  }

  Core.SRS = {
    DEFAULT_EASE,
    MIN_EASE,
    createNotebookItem,
    normalizeNotebookItem,
    reviewNotebookItem,
    getNotebookStats,
    isDue
  };
})(globalThis);
