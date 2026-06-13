/**
 * Grammar Sensei - MV3 background service worker
 *
 * Orchestrates local analysis, settings, history, context menus, notebook,
 * optional AI providers, and side panel state.
 */

importScripts(
  "core/defaults.js",
  "data/grammar-database.js",
  "data/grammar-phase4-pack.js",
  "data/grammar-phase8-pack.js",
  "data/semantic-map.js",
  "data/semantic-phase8-map.js",
  "core/normalize.js",
  "core/romaji.js",
  "core/tokenizer.js",
  "core/conjugation.js",
  "core/srs.js",
  "core/ai-provider.js",
  "core/matcher.js"
);

const EXTENSION_MENU_ID = "grammar-sensei-analyze-selection";
const HISTORY_LIMIT = 80;
const NOTEBOOK_LIMIT = 300;
const STORAGE_SCHEMA_VERSION = 4;
const SIDE_PANEL_STATE_KEY = "sidePanelState";

const DEFAULT_SETTINGS = GrammarSenseiCore.DEFAULT_SETTINGS;

const Analyzer = GrammarSenseiCore.Analyzer;
const AIProvider = GrammarSenseiCore.AIProvider;
const SRS = GrammarSenseiCore.SRS;

let migrationPromise = null;

function nowIso() {
  return new Date().toISOString();
}

function normalizeSettings(items = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...items,
    hoverDelayMs: clampNumber(items.hoverDelayMs, 150, 1500, DEFAULT_SETTINGS.hoverDelayMs),
    shiftScanDelayMs: clampNumber(items.shiftScanDelayMs, 100, 1000, DEFAULT_SETTINGS.shiftScanDelayMs),
    scanLimit: clampNumber(items.scanLimit, 1, 100, DEFAULT_SETTINGS.scanLimit),
    confidenceThreshold: clampNumber(items.confidenceThreshold, 0, 99, DEFAULT_SETTINGS.confidenceThreshold),
    aiTimeoutMs: clampNumber(items.aiTimeoutMs, 3000, 30000, DEFAULT_SETTINGS.aiTimeoutMs),
    aiMode: ["off", "browser", "cloud"].includes(items.aiMode) ? items.aiMode : DEFAULT_SETTINGS.aiMode,
    cloudEndpoint: typeof items.cloudEndpoint === "string" ? items.cloudEndpoint.trim() : DEFAULT_SETTINGS.cloudEndpoint,
    aiConsentAccepted: Boolean(items.aiConsentAccepted),
    aiStrictMode: items.aiStrictMode !== false,
    uiLanguage: ["vi", "en"].includes(items.uiLanguage) ? items.uiLanguage : DEFAULT_SETTINGS.uiLanguage,
    disabledDomains: Array.isArray(items.disabledDomains) ? items.disabledDomains : []
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function chromeGet(area, defaults) {
  return new Promise((resolve) => {
    area.get(defaults, (items) => resolve(items || defaults));
  });
}

function chromeSet(area, items) {
  return new Promise((resolve) => {
    area.set(items, () => resolve(items));
  });
}

async function getSettings() {
  const items = await chromeGet(chrome.storage.sync, DEFAULT_SETTINGS);
  return normalizeSettings(items);
}

async function updateSettings(partial) {
  const current = await getSettings();
  const next = normalizeSettings({ ...current, ...partial });
  await chromeSet(chrome.storage.sync, next);
  Analyzer.clearCache();
  return next;
}

async function ensureStorageMigration() {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    const local = await chromeGet(chrome.storage.local, {
      storageSchemaVersion: 0,
      history: [],
      notebook: []
    });

    if (Number(local.storageSchemaVersion || 0) >= STORAGE_SCHEMA_VERSION) {
      return { migrated: false, storageSchemaVersion: STORAGE_SCHEMA_VERSION };
    }

    const history = Array.isArray(local.history) ? local.history.slice(0, HISTORY_LIMIT) : [];
    const notebook = Array.isArray(local.notebook)
      ? local.notebook.map((item) => SRS.normalizeNotebookItem(item)).slice(0, NOTEBOOK_LIMIT)
      : [];

    await chromeSet(chrome.storage.local, {
      storageSchemaVersion: STORAGE_SCHEMA_VERSION,
      history,
      notebook
    });

    return {
      migrated: true,
      storageSchemaVersion: STORAGE_SCHEMA_VERSION,
      historyCount: history.length,
      notebookCount: notebook.length
    };
  })();

  return migrationPromise;
}

function getHost(url) {
  try {
    return new URL(url || "").hostname;
  } catch (_error) {
    return "";
  }
}

function isDomainDisabled(settings, url) {
  const host = getHost(url);
  if (!host) return false;
  return settings.disabledDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function analysisOptions(settings, source) {
  return {
    source,
    confidenceThreshold: settings.confidenceThreshold,
    semanticMode: settings.semanticMode,
    debugMatches: settings.debugMatches
  };
}

function analyzeGrammar(text, source, settings) {
  return Analyzer.analyzeText(text, analysisOptions(settings, source));
}

function summarizeHistoryEntry(text, analysis, source) {
  const primary = analysis.primary;
  if (!primary) return null;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: String(text || "").trim().slice(0, 700),
    grammarId: primary.id,
    grammar: primary.display || primary.grammar,
    detected: primary.matchedText || primary.detected,
    meaning_vi: primary.meaning_vi,
    meaning_en: primary.meaning_en,
    jlpt_level: primary.jlpt_level,
    confidence: primary.confidence,
    matchCount: analysis.matches.length,
    source,
    createdAt: nowIso()
  };
}

async function getHistory() {
  const { history } = await chromeGet(chrome.storage.local, { history: [] });
  return Array.isArray(history) ? history : [];
}

async function setHistory(history) {
  await chromeSet(chrome.storage.local, { history });
  return history;
}

async function saveHistoryEntry(text, analysis, source) {
  const settings = await getSettings();
  if (!settings.saveHistory) return null;

  const entry = summarizeHistoryEntry(text, analysis, source);
  if (!entry) return null;

  const history = await getHistory();
  const deduped = history.filter((item) => !(item.text === entry.text && item.grammarId === entry.grammarId));
  await setHistory([entry, ...deduped].slice(0, HISTORY_LIMIT));
  return entry;
}

async function clearHistory() {
  return setHistory([]);
}

async function deleteHistoryItem(id) {
  const history = await getHistory();
  const next = history.filter((item) => item.id !== id);
  await setHistory(next);
  return { deleted: history.length !== next.length, total: next.length };
}

async function getNotebook() {
  const { notebook } = await chromeGet(chrome.storage.local, { notebook: [] });
  const items = Array.isArray(notebook) ? notebook.map((item) => SRS.normalizeNotebookItem(item)) : [];
  return items.sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
}

async function saveNotebookItem(payload) {
  const item = SRS.createNotebookItem(payload);
  const notebook = await getNotebook();
  const deduped = notebook.filter((entry) => !(entry.sentence === item.sentence && entry.grammarId === item.grammarId));
  await chromeSet(chrome.storage.local, { notebook: [item, ...deduped].slice(0, NOTEBOOK_LIMIT) });
  return item;
}

async function setNotebook(notebook) {
  const items = (notebook || []).map((item) => SRS.normalizeNotebookItem(item)).slice(0, NOTEBOOK_LIMIT);
  await chromeSet(chrome.storage.local, { notebook: items });
  return items;
}

async function reviewNotebookItem(id, rating) {
  if (!["again", "hard", "good", "easy"].includes(rating)) {
    throw new Error("Unknown review rating.");
  }

  const notebook = await getNotebook();
  const index = notebook.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Notebook item not found.");

  const reviewed = SRS.reviewNotebookItem(notebook[index], rating);
  notebook[index] = reviewed;
  await setNotebook(notebook);
  return reviewed;
}

async function updateNotebookItem(payload) {
  const notebook = await getNotebook();
  const index = notebook.findIndex((item) => item.id === payload.id);
  if (index < 0) throw new Error("Notebook item not found.");

  notebook[index] = SRS.normalizeNotebookItem({
    ...notebook[index],
    note: typeof payload.note === "string" ? payload.note.slice(0, 1000) : notebook[index].note
  });
  await setNotebook(notebook);
  return notebook[index];
}

async function deleteNotebookItem(id) {
  const notebook = await getNotebook();
  const next = notebook.filter((item) => item.id !== id);
  await setNotebook(next);
  return { deleted: notebook.length !== next.length, total: next.length };
}

async function getNotebookStats() {
  return SRS.getNotebookStats(await getNotebook());
}

async function clearNotebook() {
  await chromeSet(chrome.storage.local, { notebook: [] });
  return [];
}

async function exportUserData() {
  return {
    app: "Grammar Sensei",
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    grammarDbVersion: GrammarSenseiData.DB_VERSION,
    exportedAt: nowIso(),
    settings: await getSettings(),
    history: await getHistory(),
    notebook: await getNotebook()
  };
}

async function importUserData(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid import payload.");
  }

  const importedSettings = payload.settings && typeof payload.settings === "object"
    ? normalizeSettings(payload.settings)
    : await getSettings();
  const history = Array.isArray(payload.history) ? payload.history.slice(0, HISTORY_LIMIT) : [];
  const notebook = Array.isArray(payload.notebook)
    ? payload.notebook.map((item) => SRS.normalizeNotebookItem(item)).slice(0, NOTEBOOK_LIMIT)
    : [];

  await chromeSet(chrome.storage.sync, importedSettings);
  await chromeSet(chrome.storage.local, {
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    history,
    notebook
  });
  Analyzer.clearCache();

  return {
    settings: importedSettings,
    historyCount: history.length,
    notebookCount: notebook.length
  };
}

async function resetSettings() {
  await chromeSet(chrome.storage.sync, DEFAULT_SETTINGS);
  Analyzer.clearCache();
  return DEFAULT_SETTINGS;
}

async function setSidePanelState(data) {
  const state = {
    analysis: data.analysis || null,
    source: data.source || "selection",
    pageUrl: data.pageUrl || "",
    pageTitle: data.pageTitle || "",
    updatedAt: nowIso()
  };
  await chromeSet(chrome.storage.local, { [SIDE_PANEL_STATE_KEY]: state });
  return state;
}

async function getSidePanelState() {
  const result = await chromeGet(chrome.storage.local, { [SIDE_PANEL_STATE_KEY]: null });
  return result[SIDE_PANEL_STATE_KEY];
}

async function openSidePanel(tabId, data) {
  const state = await setSidePanelState(data);
  if (chrome.sidePanel?.open && tabId) {
    try {
      await chrome.sidePanel.open({ tabId });
    } catch (error) {
      console.warn("Grammar Sensei side panel:", error.message);
    }
  }
  return state;
}

function setupContextMenu() {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: EXTENSION_MENU_ID,
      title: "Analyze Japanese grammar",
      contexts: ["selection"]
    });
  });
}

function openOnboardingPage() {
  if (!chrome.tabs?.create) return;
  chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") }, () => {
    if (chrome.runtime.lastError) {
      console.warn("Grammar Sensei onboarding:", chrome.runtime.lastError.message);
    }
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await ensureStorageMigration();
  const settings = await getSettings();
  await chromeSet(chrome.storage.sync, settings);
  setupContextMenu();
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
  if (details?.reason === "install") {
    openOnboardingPage();
  }
});

chrome.runtime.onStartup.addListener(() => {
  ensureStorageMigration().catch((error) => console.warn("Grammar Sensei migration:", error.message));
  setupContextMenu();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== EXTENSION_MENU_ID || !info.selectionText || !tab?.id) return;

  const settings = await getSettings();
  if (!settings.enabled || isDomainDisabled(settings, tab.url)) return;

  const analysis = analyzeGrammar(info.selectionText, "context-menu", settings);
  await saveHistoryEntry(info.selectionText, analysis, "context-menu");
  await setSidePanelState({ analysis, source: "context-menu", pageUrl: tab.url, pageTitle: tab.title });

  chrome.tabs.sendMessage(tab.id, {
    type: "SHOW_GRAMMAR_ANALYSIS",
    text: info.selectionText,
    data: analysis,
    source: "context-menu"
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn("Grammar Sensei:", chrome.runtime.lastError.message);
    }
  });
});

async function handleMessage(request, sender) {
  await ensureStorageMigration();
  const type = request?.type;

  switch (type) {
    case "ANALYZE_GRAMMAR": {
      const settings = await getSettings();
      if (sender?.tab?.url && isDomainDisabled(settings, sender.tab.url)) {
        throw new Error("Grammar Sensei is disabled on this domain.");
      }
      const source = request.source || "selection";
      const analysis = analyzeGrammar(request.text, source, settings);
      if (request.saveHistory !== false) {
        await saveHistoryEntry(request.text, analysis, source);
      }
      if (analysis.primary) {
        await setSidePanelState({
          analysis,
          source,
          pageUrl: request.pageUrl || sender?.tab?.url || "",
          pageTitle: request.pageTitle || sender?.tab?.title || ""
        });
      }
      return analysis;
    }

    case "ANALYZE_BATCH": {
      const settings = await getSettings();
      const limit = Math.min(Number(request.limit || settings.scanLimit), settings.scanLimit);
      return Analyzer.analyzeBatch(request.sentences || [], {
        ...analysisOptions(settings, request.source || "scan"),
        limit
      });
    }

    case "AI_ANALYZE_GRAMMAR": {
      const settings = await getSettings();
      const provider = AIProvider.createAIProvider(settings.aiMode);
      const text = request.text || request.localResult?.input || "";
      const localResult = request.localResult || (text ? analyzeGrammar(text, request.source || "ai", settings) : null);
      return provider.analyze(text, {
        grammarEntries: Analyzer.entries(),
        grammarDbVersion: GrammarSenseiData.DB_VERSION,
        localResult,
        strictMode: settings.aiStrictMode,
        detectedLanguage: request.detectedLanguage || localResult?.detectedLanguage || "unknown",
        source: request.source || localResult?.source || "ai",
        uiLanguage: settings.uiLanguage,
        extensionVersion: chrome.runtime.getManifest?.().version || "1.0.0",
        aiConsentAccepted: settings.aiConsentAccepted,
        cloudEndpoint: settings.cloudEndpoint,
        aiTimeoutMs: settings.aiTimeoutMs
      });
    }

    case "GET_SETTINGS":
      return getSettings();

    case "UPDATE_SETTINGS":
      return updateSettings(request.settings || {});

    case "GET_HISTORY":
      return getHistory();

    case "CLEAR_HISTORY":
      return clearHistory();

    case "DELETE_HISTORY_ITEM":
      return deleteHistoryItem(request.id);

    case "GET_GRAMMAR_SUMMARY":
      return Analyzer.getSummary();

    case "SAVE_NOTEBOOK_ITEM":
      return saveNotebookItem(request.item || request);

    case "GET_NOTEBOOK":
      return getNotebook();

    case "GET_NOTEBOOK_STATS":
      return getNotebookStats();

    case "CLEAR_NOTEBOOK":
      return clearNotebook();

    case "REVIEW_NOTEBOOK_ITEM":
      return reviewNotebookItem(request.id, request.rating);

    case "UPDATE_NOTEBOOK_ITEM":
      return updateNotebookItem(request.item || request);

    case "DELETE_NOTEBOOK_ITEM":
      return deleteNotebookItem(request.id);

    case "EXPORT_USER_DATA":
      return exportUserData();

    case "IMPORT_USER_DATA":
      return importUserData(request.data || request.payload);

    case "RESET_SETTINGS":
      return resetSettings();

    case "SET_SIDE_PANEL_STATE":
      return setSidePanelState(request.data || request);

    case "GET_SIDE_PANEL_STATE":
      return getSidePanelState();

    case "OPEN_SIDE_PANEL":
      return openSidePanel(sender?.tab?.id || request.tabId, request.data || request);

    default:
      throw new Error(`Unknown message type: ${type || "empty"}`);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender)
    .then((data) => sendResponse({ success: true, data }))
    .catch((error) => {
      console.error("Grammar Sensei:", error);
      sendResponse({ success: false, error: error.message });
    });
  return true;
});
