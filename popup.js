/**
 * Grammar Sensei - Toolbar Popup
 *
 * Provides settings, selection analysis, and local history.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  floatingButton: true,
  autoAnalyze: false,
  saveHistory: true,
  compactMode: false,
  showMatchList: true
};

let settings = { ...DEFAULT_SETTINGS };
let historyItems = [];
let currentSelection = "";
let currentAnalysis = null;

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

      resolve(response);
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

      resolve(response);
    });
  });
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function formatAnalysisSummary(selectedText, data) {
  const primary = data?.primary || data || {};
  const also = (data?.matches || [])
    .slice(1)
    .map((match) => `${match.grammar} (${match.jlpt_level})`)
    .join(", ");

  return [
    "Grammar Sensei",
    `Text: ${selectedText}`,
    `Pattern: ${primary.grammar || "Not detected"}`,
    `JLPT: ${primary.jlpt_level || "-"}`,
    `Meaning: ${primary.meaning || "-"}`,
    `Structure: ${primary.structure || "-"}`,
    `Example: ${primary.example || "-"}`,
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
    `Meaning: ${item.meaning}`
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

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function showToast(message) {
  els.settingsToast.textContent = message;
  window.setTimeout(() => {
    if (els.settingsToast.textContent === message) {
      els.settingsToast.textContent = "";
    }
  }, 1800);
}

function setAnalyzeState(isLoading) {
  els.analyzeSelection.disabled = isLoading;
  els.analyzeSelection.innerHTML = isLoading
    ? "<span>...</span><span>Analyzing</span>"
    : "<span>文</span><span>Analyze Current Selection</span>";
}

function renderSettings() {
  for (const input of document.querySelectorAll("[data-setting]")) {
    const key = input.dataset.setting;
    input.checked = Boolean(settings[key]);
  }

  els.statusPill.dataset.enabled = String(Boolean(settings.enabled));
  els.statusText.textContent = settings.enabled ? "On" : "Off";
}

function renderSelectionResult(selectedText, analysis) {
  const primary = analysis.primary || analysis;
  currentSelection = selectedText;
  currentAnalysis = analysis;

  els.selectionResult.dataset.visible = "true";
  els.selectionResult.innerHTML = `
    <div class="result-top">
      <div>
        <div class="pattern">${escapeHTML(primary.grammar || "Not detected")}</div>
        <div class="result-meta">${escapeHTML(primary.meaning || analysis.meaning || "-")}</div>
      </div>
      <span class="badge">${escapeHTML(primary.jlpt_level || "-")}</span>
    </div>
    <div class="result-text">${escapeHTML(truncate(selectedText, 120))}</div>
    <div class="result-meta">${escapeHTML(primary.structure || "-")}</div>
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button class="mini-btn" type="button" data-copy-current>Copy</button>
      <button class="mini-btn" type="button" data-show-current>Show On Page</button>
    </div>
  `;

  els.selectionResult.querySelector("[data-copy-current]").addEventListener("click", async () => {
    await copyText(formatAnalysisSummary(currentSelection, currentAnalysis));
    showToast("Copied");
  });

  els.selectionResult.querySelector("[data-show-current]").addEventListener("click", async () => {
    try {
      const tab = await getActiveTab();
      await sendTabMessage(tab.id, {
        type: "SHOW_GRAMMAR_ANALYSIS",
        text: currentSelection,
        data: currentAnalysis,
        source: "toolbar-popup"
      });
      showToast("Shown");
    } catch (error) {
      showToast(error.message);
    }
  });
}

function renderHistory() {
  els.historyCount.textContent = String(historyItems.length);

  if (!historyItems.length) {
    els.historyList.innerHTML = `<div class="empty">No saved analyses yet.</div>`;
    return;
  }

  els.historyList.innerHTML = historyItems.slice(0, 12).map((item) => `
    <article class="history-item">
      <div class="history-main">
        <div class="history-grammar">${escapeHTML(item.grammar)} <span class="badge">${escapeHTML(item.jlpt_level)}</span></div>
        <div class="history-time">${escapeHTML(relativeTime(item.createdAt))}</div>
      </div>
      <div class="history-text">${escapeHTML(truncate(item.text, 110))}</div>
      <div>
        <button class="mini-btn" type="button" data-copy-history="${escapeHTML(item.id)}">Copy</button>
      </div>
    </article>
  `).join("");
}

async function refreshSettings() {
  const response = await sendRuntimeMessage({ type: "GET_SETTINGS" });
  settings = { ...DEFAULT_SETTINGS, ...response.data };
  renderSettings();
}

async function refreshSummary() {
  const response = await sendRuntimeMessage({ type: "GET_GRAMMAR_SUMMARY" });
  els.patternCount.textContent = String(response.data.total);
}

async function refreshHistory() {
  const response = await sendRuntimeMessage({ type: "GET_HISTORY" });
  historyItems = response.data || [];
  renderHistory();
}

async function analyzeCurrentSelection() {
  setAnalyzeState(true);
  els.selectionHint.textContent = "Reading the active tab selection...";

  try {
    const tab = await getActiveTab();
    const selection = await sendTabMessage(tab.id, { type: "GET_CURRENT_SELECTION" });

    if (!selection.text || !selection.hasJapanese) {
      els.selectionHint.textContent = "Select a Japanese phrase on the current page first.";
      els.selectionResult.dataset.visible = "false";
      return;
    }

    els.selectionHint.textContent = "Analyzing selected Japanese text...";
    const response = await sendRuntimeMessage({
      type: "ANALYZE_GRAMMAR",
      text: selection.text,
      source: "toolbar-popup",
      saveHistory: settings.saveHistory
    });

    renderSelectionResult(selection.text, response.data);
    els.selectionHint.textContent = response.data.primary
      ? "Analysis ready. The result is also available from page selection."
      : "No exact pattern found. Try selecting a longer phrase.";

    try {
      await sendTabMessage(tab.id, {
        type: "SHOW_GRAMMAR_ANALYSIS",
        text: selection.text,
        data: response.data,
        source: "toolbar-popup"
      });
    } catch (_error) {
      // The popup result is still useful when the page cannot receive messages.
    }

    await refreshHistory();
  } catch (error) {
    els.selectionHint.textContent = error.message.includes("Receiving end")
      ? "This page cannot be analyzed. Try a normal webpage with Japanese text."
      : error.message;
    els.selectionResult.dataset.visible = "false";
  } finally {
    setAnalyzeState(false);
  }
}

async function updateSetting(key, value) {
  const previous = settings[key];
  settings[key] = value;
  renderSettings();

  try {
    const response = await sendRuntimeMessage({
      type: "UPDATE_SETTINGS",
      settings: { [key]: value }
    });
    settings = { ...DEFAULT_SETTINGS, ...response.data };
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

function bindEvents() {
  els.analyzeSelection.addEventListener("click", analyzeCurrentSelection);
  els.clearHistory.addEventListener("click", clearHistory);

  document.querySelectorAll("[data-setting]").forEach((input) => {
    input.addEventListener("change", () => {
      updateSetting(input.dataset.setting, input.checked);
    });
  });

  els.historyList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-history]");
    if (!button) return;

    const item = historyItems.find((entry) => entry.id === button.dataset.copyHistory);
    if (!item) return;

    await copyText(formatHistorySummary(item));
    showToast("Copied");
  });
}

async function init() {
  Object.assign(els, {
    analyzeSelection: document.getElementById("analyze-selection"),
    clearHistory: document.getElementById("clear-history"),
    historyCount: document.getElementById("history-count"),
    historyList: document.getElementById("history-list"),
    patternCount: document.getElementById("pattern-count"),
    selectionHint: document.getElementById("selection-hint"),
    selectionResult: document.getElementById("selection-result"),
    settingsToast: document.getElementById("settings-toast"),
    statusPill: document.getElementById("status-pill"),
    statusText: document.getElementById("status-text")
  });

  bindEvents();

  try {
    await Promise.all([refreshSettings(), refreshSummary(), refreshHistory()]);
  } catch (error) {
    els.selectionHint.textContent = error.message;
  }
}

document.addEventListener("DOMContentLoaded", init);
