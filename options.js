/**
 * Grammar Sensei - options page
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
  autoAiFallback: true,
  cloudEndpoint: "",
  aiConsentAccepted: false,
  aiStrictMode: true,
  aiTimeoutMs: 12000,
  uiLanguage: "vi",
  disabledDomains: []
};

let settings = { ...DEFAULT_SETTINGS };
const els = {};

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

function showStatus(message) {
  els.status.textContent = message;
  window.setTimeout(() => {
    if (els.status.textContent === message) els.status.textContent = "";
  }, 2600);
}

function renderSettings() {
  for (const input of document.querySelectorAll("[data-setting]")) {
    input.checked = Boolean(settings[input.dataset.setting]);
  }
  for (const input of document.querySelectorAll("[data-number-setting]")) {
    input.value = settings[input.dataset.numberSetting];
  }
  for (const input of document.querySelectorAll("[data-text-setting]")) {
    input.value = settings[input.dataset.textSetting] || "";
  }
  for (const select of document.querySelectorAll("[data-select-setting]")) {
    select.value = settings[select.dataset.selectSetting];
  }
  els.disabledDomains.value = (settings.disabledDomains || []).join("\n");
}

function readSettingsFromForm() {
  const next = { ...settings };
  for (const input of document.querySelectorAll("[data-setting]")) {
    next[input.dataset.setting] = input.checked;
  }
  for (const input of document.querySelectorAll("[data-number-setting]")) {
    next[input.dataset.numberSetting] = Number(input.value);
  }
  for (const input of document.querySelectorAll("[data-text-setting]")) {
    next[input.dataset.textSetting] = input.value.trim();
  }
  for (const select of document.querySelectorAll("[data-select-setting]")) {
    next[select.dataset.selectSetting] = select.value;
  }
  next.disabledDomains = els.disabledDomains.value
    .split(/\r?\n/)
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  return next;
}

async function refreshStats() {
  const [summary, history, notebookStats] = await Promise.all([
    sendRuntimeMessage({ type: "GET_GRAMMAR_SUMMARY" }),
    sendRuntimeMessage({ type: "GET_HISTORY" }),
    sendRuntimeMessage({ type: "GET_NOTEBOOK_STATS" })
  ]);

  els.patternCount.textContent = String(summary.total || 0);
  els.historyCount.textContent = String(history.length || 0);
  els.notebookTotal.textContent = String(notebookStats.total || 0);
  els.notebookDue.textContent = String(notebookStats.due || 0);
}

async function loadSettings() {
  settings = { ...DEFAULT_SETTINGS, ...(await sendRuntimeMessage({ type: "GET_SETTINGS" })) };
  renderSettings();
}

async function saveSettings() {
  settings = await sendRuntimeMessage({
    type: "UPDATE_SETTINGS",
    settings: readSettingsFromForm()
  });
  renderSettings();
  showStatus("Settings saved");
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grammar-sensei-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportData() {
  const data = await sendRuntimeMessage({ type: "EXPORT_USER_DATA" });
  downloadJson(data);
  showStatus("Exported");
}

async function importData(file) {
  if (!file) return;
  const text = await file.text();
  const data = JSON.parse(text);
  const result = await sendRuntimeMessage({ type: "IMPORT_USER_DATA", data });
  showStatus(`Imported ${result.historyCount} history and ${result.notebookCount} notebook items`);
  await Promise.all([loadSettings(), refreshStats()]);
}

async function clearHistory() {
  await sendRuntimeMessage({ type: "CLEAR_HISTORY" });
  showStatus("History cleared");
  await refreshStats();
}

async function clearNotebook() {
  await sendRuntimeMessage({ type: "CLEAR_NOTEBOOK" });
  showStatus("Notebook cleared");
  await refreshStats();
}

async function resetSettings() {
  settings = await sendRuntimeMessage({ type: "RESET_SETTINGS" });
  renderSettings();
  showStatus("Settings reset");
}

function bindEvents() {
  els.saveSettings.addEventListener("click", saveSettings);
  els.saveDomains.addEventListener("click", saveSettings);
  els.exportData.addEventListener("click", exportData);
  els.importFile.addEventListener("change", async () => {
    try {
      await importData(els.importFile.files[0]);
    } catch (error) {
      showStatus(error.message);
    } finally {
      els.importFile.value = "";
    }
  });
  els.clearHistory.addEventListener("click", clearHistory);
  els.clearNotebook.addEventListener("click", clearNotebook);
  els.resetSettings.addEventListener("click", resetSettings);
}

async function init() {
  Object.assign(els, {
    clearHistory: document.getElementById("clear-history"),
    clearNotebook: document.getElementById("clear-notebook"),
    disabledDomains: document.getElementById("disabled-domains"),
    exportData: document.getElementById("export-data"),
    historyCount: document.getElementById("history-count"),
    importFile: document.getElementById("import-file"),
    notebookDue: document.getElementById("notebook-due"),
    notebookTotal: document.getElementById("notebook-total"),
    patternCount: document.getElementById("pattern-count"),
    resetSettings: document.getElementById("reset-settings"),
    saveDomains: document.getElementById("save-domains"),
    saveSettings: document.getElementById("save-settings"),
    status: document.getElementById("status")
  });

  bindEvents();

  try {
    await Promise.all([loadSettings(), refreshStats()]);
  } catch (error) {
    showStatus(error.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
