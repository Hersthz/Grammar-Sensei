/**
 * Grammar Sensei - side panel detail view
 */

const els = {};
let currentState = null;
let notebook = [];
let stats = { total: 0, due: 0, new: 0, reviewed: 0, weak: 0 };

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

  els.notebookList.innerHTML = notebook.slice(0, 40).map((item) => `
    <article class="notebook-card" data-id="${escapeHTML(item.id)}">
      <div class="notebook-top">
        <div class="notebook-title">${escapeHTML(item.grammar)} · ${escapeHTML(item.reviewState || "new")}</div>
        <span class="badge">${escapeHTML(item.jlpt_level || "-")}</span>
      </div>
      <div>${escapeHTML(truncate(item.sentence, 120))}</div>
      <div class="muted">${escapeHTML(item.matchedText || "")}</div>
      <div class="muted">Reviews: ${Number(item.reviewCount || 0)} · Lapses: ${Number(item.lapseCount || 0)} · Next: ${escapeHTML(formatDue(item.nextReviewAt))}</div>
      ${item.note ? `<div class="note">${escapeHTML(item.note)}</div>` : ""}
      <div class="actions-row">
        <button class="mini-btn" type="button" data-copy-item="${escapeHTML(item.id)}">Copy</button>
        <button class="mini-btn" type="button" data-delete-item="${escapeHTML(item.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

function formatDue(iso) {
  if (!iso) return "now";
  const delta = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(delta) || delta <= 0) return "due";
  const minutes = Math.ceil(delta / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

function getDueItems() {
  const now = Date.now();
  return notebook.filter((item) => !item.nextReviewAt || new Date(item.nextReviewAt).getTime() <= now);
}

function renderReview() {
  els.reviewStats.innerHTML = `
    <div class="stat-row">
      <span>Total <strong>${stats.total}</strong></span>
      <span>Due <strong>${stats.due}</strong></span>
      <span>New <strong>${stats.new}</strong></span>
      <span>Weak <strong>${stats.weak}</strong></span>
    </div>
  `;

  const due = getDueItems();
  if (!due.length) {
    els.reviewCard.innerHTML = `<div class="empty">No cards due right now.</div>`;
    return;
  }

  const item = due[0];
  els.reviewCard.innerHTML = `
    <article class="review-item" data-id="${escapeHTML(item.id)}">
      <div class="topline">
        <div>
          <div class="label">Due now</div>
          <div class="pattern">${escapeHTML(item.grammar)}</div>
        </div>
        <span class="badge">${escapeHTML(item.jlpt_level || "-")}</span>
      </div>
      <div class="sentence">${escapeHTML(item.sentence)}</div>
      <div class="section">
        <div class="label">Matched text</div>
        <div class="code-line">${escapeHTML(item.matchedText || "-")}</div>
      </div>
      <div class="section">
        <div class="label">Meaning</div>
        <div>${escapeHTML(item.meaning_vi || "-")}</div>
        ${item.meaning_en ? `<div class="muted">${escapeHTML(item.meaning_en)}</div>` : ""}
      </div>
      <div class="actions-row srs-row">
        <button class="mini-btn danger" type="button" data-review="again">Again</button>
        <button class="mini-btn warn" type="button" data-review="hard">Hard</button>
        <button class="mini-btn good" type="button" data-review="good">Good</button>
        <button class="mini-btn easy" type="button" data-review="easy">Easy</button>
      </div>
    </article>
  `;
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
  stats = await sendRuntimeMessage({ type: "GET_NOTEBOOK_STATS" });
  renderNotebook();
  renderReview();
}

async function reviewItem(id, rating) {
  await sendRuntimeMessage({ type: "REVIEW_NOTEBOOK_ITEM", id, rating });
  showStatus(`Reviewed: ${rating}`);
  await loadNotebook();
}

async function deleteItem(id) {
  await sendRuntimeMessage({ type: "DELETE_NOTEBOOK_ITEM", id });
  showStatus("Deleted");
  await loadNotebook();
}

async function init() {
  Object.assign(els, {
    detail: document.getElementById("detail"),
    notebookList: document.getElementById("notebook-list"),
    reviewCard: document.getElementById("review-card"),
    reviewStats: document.getElementById("review-stats"),
    refreshState: document.getElementById("refresh-state"),
    reloadReview: document.getElementById("reload-review"),
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
  els.reloadReview.addEventListener("click", async () => {
    await loadNotebook();
    showStatus("Review queue reloaded");
  });
  els.reviewCard.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-review]");
    if (!button) return;
    const item = event.target.closest("[data-id]");
    if (!item) return;
    await reviewItem(item.dataset.id, button.dataset.review);
  });
  els.notebookList.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-item]");
    const deleteButton = event.target.closest("[data-delete-item]");
    if (copyButton) {
      const item = notebook.find((entry) => entry.id === copyButton.dataset.copyItem);
      if (!item) return;
      await copyText([
        "Grammar Sensei",
        `Pattern: ${item.grammar}`,
        `Sentence: ${item.sentence}`,
        `Matched: ${item.matchedText}`,
        `Meaning VI: ${item.meaning_vi}`,
        `Structure: ${item.structure}`
      ].join("\n"));
      showStatus("Copied");
    }
    if (deleteButton) {
      await deleteItem(deleteButton.dataset.deleteItem);
    }
  });

  try {
    await Promise.all([loadState(), loadNotebook()]);
  } catch (error) {
    showStatus(error.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
