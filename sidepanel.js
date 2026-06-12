/**
 * Grammar Sensei - side panel detail view
 */

const els = {};
let currentState = null;
let notebook = [];

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

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function formatSummary(analysis) {
  const primary = analysis?.primary || {};
  return [
    "Grammar Sensei",
    `Text: ${analysis?.input || ""}`,
    `Pattern: ${primary.display || primary.grammar || "-"}`,
    `Matched: ${primary.matchedText || primary.detected || "-"}`,
    `JLPT: ${primary.jlpt_level || "-"}`,
    `Meaning VI: ${primary.meaning_vi || "-"}`,
    `Meaning EN: ${primary.meaning_en || "-"}`,
    `Structure: ${primary.structure || "-"}`,
    `Example: ${primary.example?.ja || "-"}`,
    primary.example?.vi ? `Example VI: ${primary.example.vi}` : ""
  ].filter(Boolean).join("\n");
}

function showStatus(message) {
  els.status.textContent = message;
  window.setTimeout(() => {
    if (els.status.textContent === message) els.status.textContent = "";
  }, 2200);
}

function renderDetail() {
  const analysis = currentState?.analysis;
  const primary = analysis?.primary;

  if (!analysis || !primary) {
    els.detail.innerHTML = `<div class="empty">Analyze Japanese text from a page or popup to see details here.</div>`;
    return;
  }

  const matches = analysis.matches || [];
  const example = primary.example || {};
  els.detail.innerHTML = `
    <article class="detail-card">
      <div class="detail-main">
        <div class="sentence">${escapeHTML(analysis.input || "")}</div>

        <div class="topline">
          <div>
            <div class="label">Mẫu ngữ pháp</div>
            <div class="pattern">${escapeHTML(primary.display || primary.grammar)}</div>
          </div>
          <span class="badge">${escapeHTML(primary.jlpt_level || "-")}</span>
        </div>

        <div class="section">
          <div class="label">Matched text</div>
          <div class="code-line">${escapeHTML(primary.matchedText || primary.detected || "-")}</div>
        </div>

        ${analysis.romaji ? `
          <div class="section">
            <div class="label">Romaji</div>
            <div class="code-line">${escapeHTML(analysis.romaji)}</div>
            <div class="muted">${escapeHTML(analysis.romajiQuality || "")}</div>
          </div>
        ` : ""}

        <div class="section">
          <div class="label">Nghĩa tiếng Việt</div>
          <div>${escapeHTML(primary.meaning_vi || "-")}</div>
          ${primary.meaning_en ? `<div class="muted">${escapeHTML(primary.meaning_en)}</div>` : ""}
        </div>

        <div class="section">
          <div class="label">Cấu trúc</div>
          <div class="code-line">${escapeHTML(primary.structure || "-")}</div>
        </div>

        <div class="section">
          <div class="label">Giải thích</div>
          <div>${escapeHTML(primary.nuance_vi || primary.nuance || "-")}</div>
          ${primary.nuance_en ? `<div class="muted">${escapeHTML(primary.nuance_en)}</div>` : ""}
        </div>

        <div class="section">
          <div class="label">Ví dụ</div>
          <div class="example">
            <strong>${escapeHTML(example.ja || "-")}</strong>
            ${example.romaji ? `<div class="muted">${escapeHTML(example.romaji)}</div>` : ""}
            ${example.vi ? `<div>${escapeHTML(example.vi)}</div>` : ""}
            ${example.en ? `<div class="muted">${escapeHTML(example.en)}</div>` : ""}
          </div>
        </div>

        ${(primary.confusions || []).length ? `
          <div class="section">
            <div class="label">Mẫu dễ nhầm</div>
            <div class="confusion-list">
              ${primary.confusions.map((item) => `<span class="confusion-pill">${escapeHTML(item)}</span>`).join("")}
            </div>
          </div>
        ` : ""}

        ${matches.length > 1 ? `
          <div class="section">
            <div class="label">Also detected</div>
            <div class="match-list">
              ${matches.slice(1, 10).map((match) => `
                <span class="match-pill"><strong>${escapeHTML(match.jlpt_level)}</strong>${escapeHTML(match.display || match.grammar)}</span>
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${(primary.tags || []).length ? `
          <div class="tag-row">
            ${primary.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}
          </div>
        ` : ""}

        <div class="actions-row">
          <button class="mini-btn" id="copy-detail" type="button">Copy</button>
          <button class="mini-btn" id="save-detail" type="button">Save to Notebook</button>
        </div>
      </div>
    </article>
  `;

  document.getElementById("copy-detail").addEventListener("click", async () => {
    await copyText(formatSummary(analysis));
    showStatus("Copied");
  });

  document.getElementById("save-detail").addEventListener("click", async () => {
    await saveCurrentAnalysis();
  });
}

function renderNotebook() {
  if (!notebook.length) {
    els.notebookList.innerHTML = `<div class="empty">No saved grammar yet.</div>`;
    return;
  }

  els.notebookList.innerHTML = notebook.slice(0, 30).map((item) => `
    <article class="notebook-card">
      <div class="notebook-title">${escapeHTML(item.grammar)} · ${escapeHTML(item.reviewState || "new")}</div>
      <div>${escapeHTML(truncate(item.sentence, 120))}</div>
      <div class="muted">${escapeHTML(item.matchedText || "")}</div>
    </article>
  `).join("");
}

async function saveCurrentAnalysis() {
  const analysis = currentState?.analysis;
  if (!analysis?.primary) {
    showStatus("No match to save");
    return;
  }

  await sendRuntimeMessage({
    type: "SAVE_NOTEBOOK_ITEM",
    item: {
      analysis,
      sentence: analysis.input,
      pageUrl: currentState.pageUrl || "",
      pageTitle: currentState.pageTitle || ""
    }
  });
  showStatus("Saved");
  await loadNotebook();
}

async function loadState() {
  currentState = await sendRuntimeMessage({ type: "GET_SIDE_PANEL_STATE" });
  renderDetail();
}

async function loadNotebook() {
  notebook = await sendRuntimeMessage({ type: "GET_NOTEBOOK" });
  renderNotebook();
}

async function init() {
  Object.assign(els, {
    detail: document.getElementById("detail"),
    notebookList: document.getElementById("notebook-list"),
    refreshState: document.getElementById("refresh-state"),
    reloadNotebook: document.getElementById("reload-notebook"),
    status: document.getElementById("status")
  });

  els.refreshState.addEventListener("click", async () => {
    await loadState();
    showStatus("Refreshed");
  });
  els.reloadNotebook.addEventListener("click", async () => {
    await loadNotebook();
    showStatus("Notebook reloaded");
  });

  try {
    await Promise.all([loadState(), loadNotebook()]);
  } catch (error) {
    showStatus(error.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
