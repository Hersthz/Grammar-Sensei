/**
 * Grammar Sensei - toolbar popup
 */

const DEFAULT_SETTINGS = globalThis.GRAMMAR_SENSEI_DEFAULT_SETTINGS || {
  enabled: true,
  floatingButton: true,
  autoAnalyze: false,
  saveHistory: true,
  compactMode: false,
  showMatchList: true,
  hoverEnabled: false,
  hoverDelayMs: 400,
  shiftScanEnabled: true,
  shiftScanDelayMs: 250,
  keyboardScanEnabled: true,
  scanLimit: 50,
  confidenceThreshold: 70,
  semanticMode: true,
  debugMatches: false,
  aiMode: "off",
  cloudEndpoint: "",
  aiConsentAccepted: false,
  aiStrictMode: true,
  aiTimeoutMs: 12000,
  uiLanguage: "vi",
  disabledDomains: []
};

let settings = { ...DEFAULT_SETTINGS };
let historyItems = [];
let notebookStats = { total: 0, due: 0 };
let currentSelection = "";
let currentAnalysis = null;
let activeTab = null;
let scanResults = [];

const els = {};

function escapeHTML(value) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(value ?? "")));
  return div.innerHTML;
}

function truncate(value, max) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.success) {
        reject(new Error(response?.error || "Unknown extension error."));
        return;
      }
      resolve(response.data);
    });
  });
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      const tab = tabs?.[0];
      if (!tab?.id) {
        reject(new Error("No active tab was found."));
        return;
      }
      resolve(tab);
    });
  });
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.success) {
        reject(new Error(response?.error || "The current page did not respond."));
        return;
      }
      resolve(response.data);
    });
  });
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard is not available.");
}

function formatAnalysisSummary(selectedText, data) {
  const primary = data?.primary || data || {};
  const also = (data?.matches || [])
    .slice(1)
    .map((match) => `${match.display || match.grammar} (${match.jlpt_level})`)
    .join(", ");

  return [
    "Grammar Sensei",
    `Text: ${selectedText}`,
    `Pattern: ${primary.display || primary.grammar || "Not detected"}`,
    `JLPT: ${primary.jlpt_level || "-"}`,
    `Matched: ${primary.matchedText || primary.detected || "-"}`,
    `Meaning VI: ${primary.meaning_vi || primary.meaning || "-"}`,
    `Meaning EN: ${primary.meaning_en || "-"}`,
    `Structure: ${primary.structure || "-"}`,
    `Example: ${primary.example?.ja || primary.example || "-"}`,
    primary.example?.vi ? `Example VI: ${primary.example.vi}` : "",
    also ? `Also detected: ${also}` : ""
  ].filter(Boolean).join("\n");
}

function formatHistorySummary(item) {
  return [
    "Grammar Sensei",
    `Text: ${item.text}`,
    `Pattern: ${item.grammar}`,
    `Detected: ${item.detected || item.grammar}`,
    `JLPT: ${item.jlpt_level}`,
    `Meaning VI: ${item.meaning_vi || item.meaning || "-"}`
  ].join("\n");
}

function relativeTime(iso) {
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(deltaMs)) return "";
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function showToast(message) {
  els.settingsToast.textContent = message;
  window.setTimeout(() => {
    if (els.settingsToast.textContent === message) els.settingsToast.textContent = "";
  }, 1900);
}

function setButtonBusy(button, busy, busyLabel, normalHTML) {
  button.disabled = busy;
  button.innerHTML = busy ? busyLabel : normalHTML;
}

function getActiveHost() {
  try {
    return new URL(activeTab?.url || "").hostname;
  } catch (_error) {
    return "";
  }
}

function isCurrentDomainDisabled() {
  const host = getActiveHost();
  return Boolean(host && settings.disabledDomains.some((domain) => host === domain || host.endsWith(`.${domain}`)));
}

function renderSettings() {
  for (const input of document.querySelectorAll("[data-setting]")) {
    input.checked = Boolean(settings[input.dataset.setting]);
  }
  for (const input of document.querySelectorAll("[data-number-setting]")) {
    input.value = settings[input.dataset.numberSetting];
  }
  for (const select of document.querySelectorAll("[data-select-setting]")) {
    select.value = settings[select.dataset.selectSetting];
  }

  els.statusPill.dataset.enabled = String(Boolean(settings.enabled));
  els.statusText.textContent = settings.enabled ? "On" : "Off";
  els.aiWarning.dataset.visible = String(settings.aiMode !== "off");
  els.aiWarning.textContent = settings.aiMode === "browser"
    ? "On-device AI (Gemini Nano) runs locally in Chrome. Nothing is sent over the network. First use may download the model."
    : "Cloud AI sends only the current sentence and compact local result to the backend endpoint configured in Options.";
  els.toggleDomain.textContent = isCurrentDomainDisabled() ? "Enable This Domain" : "Disable This Domain";
}

function renderSecondaryMatches(matches) {
  const secondaryMatches = (matches || []).slice(1);
  if (!secondaryMatches.length) return "";
  return `
    <div class="detected-matches">
      <div class="mini-label">Also detected (${secondaryMatches.length})</div>
      <div class="match-chip-row">
        ${secondaryMatches.map((match) => `
          <span class="match-chip" title="${escapeHTML(match.matchedText || match.detected || "")}">
            ${escapeHTML(match.display || match.grammar)} · ${escapeHTML(match.jlpt_level || "-")} · ${escapeHTML(match.confidence || "-")}%
          </span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderResult(container, selectedText, analysis) {
  const primary = analysis.primary || analysis;
  container.dataset.visible = "true";
  container.innerHTML = `
    <div class="result-top">
      <div>
        <div class="pattern">${escapeHTML(primary.display || primary.grammar || "Not detected")}</div>
        <div class="result-meta">${escapeHTML(primary.meaning_vi || primary.meaning || "-")}</div>
      </div>
      <span class="badge">${escapeHTML(primary.jlpt_level || "-")}</span>
    </div>
    <div class="result-text">${escapeHTML(truncate(selectedText, 140))}</div>
    <div class="result-meta">${escapeHTML(primary.structure || "-")}</div>
    ${analysis.romaji ? `<div class="result-meta">Romaji: ${escapeHTML(analysis.romaji)}</div>` : ""}
    ${renderSecondaryMatches(analysis.matches)}
    <div class="actions-row">
      <button class="mini-btn" type="button" data-result-action="copy">Copy</button>
      <button class="mini-btn" type="button" data-result-action="show">Show On Page</button>
      <button class="mini-btn" type="button" data-result-action="detail">Detail</button>
      <button class="mini-btn" type="button" data-result-action="save">Save</button>
    </div>
  `;

  container.querySelector("[data-result-action='copy']").addEventListener("click", async () => {
    await copyText(formatAnalysisSummary(selectedText, analysis));
    showToast("Copied");
  });
  container.querySelector("[data-result-action='show']").addEventListener("click", () => showAnalysisOnPage(selectedText, analysis));
  container.querySelector("[data-result-action='detail']").addEventListener("click", () => openDetail(analysis));
  container.querySelector("[data-result-action='save']").addEventListener("click", () => saveNotebook(analysis));
}

function renderSelectionResult(selectedText, analysis) {
  currentSelection = selectedText;
  currentAnalysis = analysis;
  renderResult(els.selectionResult, selectedText, analysis);
}

function renderManualResult(text, analysis) {
  currentSelection = text;
  currentAnalysis = analysis;
  renderResult(els.manualResult, text, analysis);
}

function renderScanResults(results) {
  scanResults = results || [];
  els.scanResult.dataset.visible = "true";

  if (!scanResults.length) {
    els.scanList.innerHTML = `<div class="empty">No Japanese sentences found on the visible page.</div>`;
    return;
  }

  els.scanList.innerHTML = scanResults.map((result, index) => {
    const primary = result.primary;
    return `
      <article class="scan-item">
        <div class="scan-main">
          <div>
            <div class="scan-grammar">${escapeHTML(primary?.display || "No match")}</div>
            <div class="scan-text">${escapeHTML(truncate(result.input, 120))}</div>
          </div>
          <span class="badge">${escapeHTML(primary?.jlpt_level || "-")}</span>
        </div>
        <div class="result-meta">${escapeHTML(primary?.meaning_vi || result.meaning || "Không có match đủ chắc.")}</div>
        ${renderSecondaryMatches(result.matches)}
        <div class="actions-row">
          <button class="mini-btn" type="button" data-scan-copy="${index}">Copy</button>
          <button class="mini-btn" type="button" data-scan-detail="${index}">Detail</button>
          <button class="mini-btn" type="button" data-scan-save="${index}">Save</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderHistory() {
  if (!historyItems.length) {
    els.historyList.innerHTML = `<div class="empty">No saved analyses yet.</div>`;
    return;
  }

  els.historyList.innerHTML = historyItems.slice(0, 16).map((item) => `
    <article class="history-item">
      <div class="history-main">
        <div class="history-grammar">${escapeHTML(item.grammar)} <span class="badge">${escapeHTML(item.jlpt_level)}</span></div>
        <div class="history-time">${escapeHTML(relativeTime(item.createdAt))}</div>
      </div>
      <div class="history-text">${escapeHTML(truncate(item.text, 120))}</div>
      <div class="actions-row">
        <button class="mini-btn" type="button" data-copy-history="${escapeHTML(item.id)}">Copy</button>
      </div>
    </article>
  `).join("");
}

async function refreshSettings() {
  settings = { ...DEFAULT_SETTINGS, ...(await sendRuntimeMessage({ type: "GET_SETTINGS" })) };
  renderSettings();
}

async function refreshSummary() {
  const summary = await sendRuntimeMessage({ type: "GET_GRAMMAR_SUMMARY" });
  els.patternCount.textContent = String(summary.total);
}

async function refreshHistory() {
  historyItems = await sendRuntimeMessage({ type: "GET_HISTORY" });
  renderHistory();
}

async function refreshNotebookStats() {
  notebookStats = await sendRuntimeMessage({ type: "GET_NOTEBOOK_STATS" });
  els.notebookDueCount.textContent = String(notebookStats.due || 0);
  els.notebookTotalCount.textContent = String(notebookStats.total || 0);
}

async function analyzeCurrentSelection() {
  setButtonBusy(els.analyzeSelection, true, "<span>...</span><span>Analyzing</span>", "<span>文</span><span>Analyze Selection</span>");
  els.selectionHint.textContent = "Reading active tab selection...";

  try {
    activeTab = await getActiveTab();
    const selection = await sendTabMessage(activeTab.id, { type: "GET_CURRENT_SELECTION" });

    if (!selection.text || !selection.hasJapanese) {
      els.selectionHint.textContent = "Select a Japanese phrase on the current page first.";
      els.selectionResult.dataset.visible = "false";
      return;
    }

    const analysis = await sendRuntimeMessage({
      type: "ANALYZE_GRAMMAR",
      text: selection.text,
      source: "popup",
      saveHistory: settings.saveHistory,
      pageUrl: activeTab.url,
      pageTitle: activeTab.title
    });

    renderSelectionResult(selection.text, analysis);
    els.selectionHint.textContent = analysis.primary ? "Analysis ready." : "No confident local match.";
    await showAnalysisOnPage(selection.text, analysis, false);
    await refreshHistory();
  } catch (error) {
    els.selectionHint.textContent = error.message.includes("Receiving end")
      ? "This page cannot be analyzed. Try a normal webpage with Japanese text."
      : error.message;
    els.selectionResult.dataset.visible = "false";
  } finally {
    setButtonBusy(els.analyzeSelection, false, "", "<span>文</span><span>Analyze Selection</span>");
  }
}

async function analyzeManualInput() {
  const text = els.manualInput.value.trim();
  if (!text) {
    showToast("Paste a sentence first");
    return;
  }

  setButtonBusy(els.analyzeInput, true, "Analyzing...", "Analyze Input");
  try {
    const analysis = await sendRuntimeMessage({
      type: "ANALYZE_GRAMMAR",
      text,
      source: "manual",
      saveHistory: settings.saveHistory
    });
    renderManualResult(text, analysis);
    await refreshHistory();
  } catch (error) {
    showToast(error.message);
  } finally {
    setButtonBusy(els.analyzeInput, false, "", "Analyze Input");
  }
}

async function scanCurrentPage() {
  setButtonBusy(els.scanPage, true, "Scanning...", "Scan Page");
  els.selectionHint.textContent = "Scanning visible Japanese sentences...";

  try {
    activeTab = await getActiveTab();
    const scan = await sendTabMessage(activeTab.id, { type: "SCAN_PAGE_TEXT" });
    renderScanResults(scan.results || []);
    els.selectionHint.textContent = `Scan complete: ${(scan.results || []).length} sentences.`;
  } catch (error) {
    els.selectionHint.textContent = error.message.includes("Receiving end")
      ? "This page cannot be scanned. Try a normal webpage with Japanese text."
      : error.message;
    els.scanResult.dataset.visible = "false";
  } finally {
    setButtonBusy(els.scanPage, false, "", "Scan Page");
  }
}

async function showAnalysisOnPage(text, analysis, notify = true) {
  try {
    activeTab = activeTab || await getActiveTab();
    await sendTabMessage(activeTab.id, {
      type: "SHOW_GRAMMAR_ANALYSIS",
      text,
      data: analysis,
      source: "popup"
    });
    if (notify) showToast("Shown");
  } catch (error) {
    if (notify) showToast(error.message);
  }
}

async function openDetail(analysis = currentAnalysis) {
  if (!analysis) {
    showToast("No analysis yet");
    return;
  }

  activeTab = activeTab || await getActiveTab();
  await sendRuntimeMessage({
    type: "OPEN_SIDE_PANEL",
    tabId: activeTab.id,
    data: {
      analysis,
      source: analysis.source || "popup",
      pageUrl: activeTab.url || "",
      pageTitle: activeTab.title || ""
    }
  });
  showToast("Detail opened");
}

async function saveNotebook(analysis = currentAnalysis) {
  if (!analysis?.primary) {
    showToast("No grammar match to save");
    return;
  }
  activeTab = activeTab || await getActiveTab().catch(() => null);
  await sendRuntimeMessage({
    type: "SAVE_NOTEBOOK_ITEM",
    item: {
      analysis,
      sentence: analysis.input,
      pageUrl: activeTab?.url || "",
      pageTitle: activeTab?.title || ""
    }
  });
  showToast("Saved");
  await refreshNotebookStats();
}

async function updateSetting(key, value) {
  const previous = settings[key];
  settings[key] = value;
  renderSettings();
  try {
    settings = { ...DEFAULT_SETTINGS, ...(await sendRuntimeMessage({ type: "UPDATE_SETTINGS", settings: { [key]: value } })) };
    renderSettings();
    showToast("Saved");
  } catch (error) {
    settings[key] = previous;
    renderSettings();
    showToast(error.message);
  }
}

async function clearHistory() {
  await sendRuntimeMessage({ type: "CLEAR_HISTORY" });
  historyItems = [];
  renderHistory();
  showToast("History cleared");
}

async function toggleCurrentDomain() {
  activeTab = activeTab || await getActiveTab();
  const host = getActiveHost();
  if (!host) {
    showToast("No domain found");
    return;
  }

  const disabledDomains = isCurrentDomainDisabled()
    ? settings.disabledDomains.filter((domain) => domain !== host)
    : [...settings.disabledDomains, host];

  await updateSetting("disabledDomains", disabledDomains);
}

function bindEvents() {
  els.analyzeSelection.addEventListener("click", analyzeCurrentSelection);
  els.analyzeInput.addEventListener("click", analyzeManualInput);
  els.scanPage.addEventListener("click", scanCurrentPage);
  els.clearManual.addEventListener("click", () => {
    els.manualInput.value = "";
    els.manualResult.dataset.visible = "false";
  });
  els.clearHistory.addEventListener("click", clearHistory);
  els.toggleDomain.addEventListener("click", toggleCurrentDomain);
  els.openSidePanel.addEventListener("click", () => openDetail());
  els.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

  document.querySelectorAll("[data-setting]").forEach((input) => {
    input.addEventListener("change", () => updateSetting(input.dataset.setting, input.checked));
  });

  document.querySelectorAll("[data-number-setting]").forEach((input) => {
    input.addEventListener("change", () => updateSetting(input.dataset.numberSetting, Number(input.value)));
  });

  document.querySelectorAll("[data-select-setting]").forEach((select) => {
    select.addEventListener("change", () => updateSetting(select.dataset.selectSetting, select.value));
  });

  els.historyList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-history]");
    if (!button) return;
    const item = historyItems.find((entry) => entry.id === button.dataset.copyHistory);
    if (!item) return;
    await copyText(formatHistorySummary(item));
    showToast("Copied");
  });

  els.scanList.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-scan-copy]");
    const detailButton = event.target.closest("[data-scan-detail]");
    const saveButton = event.target.closest("[data-scan-save]");
    const index = Number(copyButton?.dataset.scanCopy ?? detailButton?.dataset.scanDetail ?? saveButton?.dataset.scanSave);
    const result = scanResults[index];
    if (!result) return;
    if (copyButton) {
      await copyText(formatAnalysisSummary(result.input, result));
      showToast("Copied");
    } else if (detailButton) {
      await openDetail(result);
    } else if (saveButton) {
      await saveNotebook(result);
    }
  });
}

async function init() {
  Object.assign(els, {
    analyzeInput: document.getElementById("analyze-input"),
    analyzeSelection: document.getElementById("analyze-selection"),
    aiWarning: document.getElementById("ai-warning"),
    clearHistory: document.getElementById("clear-history"),
    clearManual: document.getElementById("clear-manual"),
    historyList: document.getElementById("history-list"),
    manualInput: document.getElementById("manual-input"),
    manualResult: document.getElementById("manual-result"),
    notebookDueCount: document.getElementById("notebook-due-count"),
    notebookTotalCount: document.getElementById("notebook-total-count"),
    openSidePanel: document.getElementById("open-side-panel"),
    openOptions: document.getElementById("open-options"),
    patternCount: document.getElementById("pattern-count"),
    scanList: document.getElementById("scan-list"),
    scanPage: document.getElementById("scan-page"),
    scanResult: document.getElementById("scan-result"),
    selectionHint: document.getElementById("selection-hint"),
    selectionResult: document.getElementById("selection-result"),
    settingsToast: document.getElementById("settings-toast"),
    statusPill: document.getElementById("status-pill"),
    statusText: document.getElementById("status-text"),
    toggleDomain: document.getElementById("toggle-domain")
  });

  bindEvents();

  try {
    activeTab = await getActiveTab().catch(() => null);
    await Promise.all([refreshSettings(), refreshSummary(), refreshHistory(), refreshNotebookStats()]);
  } catch (error) {
    els.selectionHint.textContent = error.message;
  }
}

document.addEventListener("DOMContentLoaded", init);
