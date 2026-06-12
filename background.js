/**
 * Grammar Sensei - MV3 background service worker
 *
 * Orchestrates local analysis, settings, history, context menus, notebook,
 * optional AI provider stubs, and side panel state.
 */

importScripts(
  "data/grammar-database.js",
  "data/semantic-map.js",
  "core/normalize.js",
  "core/romaji.js",
  "core/ai-provider.js",
  "core/matcher.js"
);

const EXTENSION_MENU_ID = "grammar-sensei-analyze-selection";
const HISTORY_LIMIT = 80;
const NOTEBOOK_LIMIT = 300;
const SIDE_PANEL_STATE_KEY = "sidePanelState";

const DEFAULT_SETTINGS = {
  enabled: true,
  floatingButton: true,
  autoAnalyze: false,
  saveHistory: true,
  compactMode: false,
  showMatchList: true,
  hoverEnabled: false,
  hoverDelayMs: 400,
  scanLimit: 50,
  confidenceThreshold: 70,
  semanticMode: true,
  aiMode: "off",
  uiLanguage: "vi",
  disabledDomains: []
};

const Analyzer = GrammarSenseiCore.Analyzer;
const AIProvider = GrammarSenseiCore.AIProvider;

function nowIso() {
  return new Date().toISOString();
}

function normalizeSettings(items = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...items,
    hoverDelayMs: clampNumber(items.hoverDelayMs, 150, 1500, DEFAULT_SETTINGS.hoverDelayMs),
    scanLimit: clampNumber(items.scanLimit, 1, 100, DEFAULT_SETTINGS.scanLimit),
    confidenceThreshold: clampNumber(items.confidenceThreshold, 0, 99, DEFAULT_SETTINGS.confidenceThreshold),
    aiMode: ["off", "browser", "cloud"].includes(items.aiMode) ? items.aiMode : DEFAULT_SETTINGS.aiMode,
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
    semanticMode: settings.semanticMode
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

async function getNotebook() {
  const { notebook } = await chromeGet(chrome.storage.local, { notebook: [] });
  return Array.isArray(notebook) ? notebook : [];
}

async function saveNotebookItem(payload) {
  const analysis = payload.analysis || null;
  const primary = analysis?.primary || payload.primary || null;
  if (!primary) throw new Error("Cannot save notebook item without a grammar match.");

  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    grammarId: primary.id,
    grammar: primary.display || primary.grammar,
    sentence: String(payload.sentence || analysis?.input || "").slice(0, 1000),
    matchedText: primary.matchedText || primary.detected || "",
    pageUrl: payload.pageUrl || "",
    pageTitle: payload.pageTitle || "",
    note: payload.note || "",
    createdAt: nowIso(),
    nextReviewAt: "",
    reviewState: "new"
  };

  const notebook = await getNotebook();
  const deduped = notebook.filter((entry) => !(entry.sentence === item.sentence && entry.grammarId === item.grammarId));
  await chromeSet(chrome.storage.local, { notebook: [item, ...deduped].slice(0, NOTEBOOK_LIMIT) });
  return item;
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

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await chromeSet(chrome.storage.sync, settings);
  setupContextMenu();
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

chrome.runtime.onStartup.addListener(setupContextMenu);

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
      return provider.analyze(request.text || "", {
        grammarEntries: Analyzer.entries(),
        strictMode: true,
        detectedLanguage: request.detectedLanguage || "unknown"
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

    case "GET_GRAMMAR_SUMMARY":
      return Analyzer.getSummary();

    case "SAVE_NOTEBOOK_ITEM":
      return saveNotebookItem(request.item || request);

    case "GET_NOTEBOOK":
      return getNotebook();

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
