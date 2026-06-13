/**
 * Grammar Sensei - side panel detail view
 */

const els = {};
let currentState = null;
let notebook = [];
let stats = { total: 0, due: 0, new: 0, reviewed: 0, weak: 0 };
let aiResult = null;
let aiResultKey = "";

function escapeHTML(value) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(value ?? "")));
  return div.innerHTML;
}

function escapeAttr(value) {
  return escapeHTML(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function truncate(value, max) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function containsJapanese(text) {
  return /[぀-ヿ㐀-鿿]/u.test(text || "");
}

function speakJapanese(text) {
  const synth = window.speechSynthesis;
  if (!text || !synth) return false;
  try {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    const voices = synth.getVoices() || [];
    const jaVoice = voices.find((voice) => /ja(-|_)?JP/i.test(voice.lang) || /japanese/i.test(voice.name));
    if (jaVoice) utterance.voice = jaVoice;
    synth.speak(utterance);
    return true;
  } catch (_error) {
    return false;
  }
}

function speakButton(text) {
  if (!text || !containsJapanese(text)) return "";
  return `<button class="speak-btn" type="button" data-speak="${escapeAttr(text)}" title="Nghe phát âm" aria-label="Nghe phát âm">🔊</button>`;
}

function buildHighlightRanges(text, matches) {
  const ranges = [];
  const sorted = [...(matches || [])]
    .filter((match) => match && (match.matchedText || match.detected))
    .sort((a, b) => {
      const lenA = (a.matchedText || a.detected || "").length;
      const lenB = (b.matchedText || b.detected || "").length;
      if (lenB !== lenA) return lenB - lenA;
      return Number(b.confidence || 0) - Number(a.confidence || 0);
    });

  for (const match of sorted) {
    const term = match.matchedText || match.detected;
    if (!term) continue;
    let from = 0;
    let idx = text.indexOf(term, from);
    while (idx >= 0) {
      const start = idx;
      const end = idx + term.length;
      const overlaps = ranges.some((range) => start < range.end && end > range.start);
      if (!overlaps) ranges.push({ start, end, match });
      from = idx + Math.max(1, term.length);
      idx = text.indexOf(term, from);
    }
  }

  return ranges.sort((a, b) => a.start - b.start);
}

function renderHighlightedText(text, matches) {
  const safe = String(text || "");
  const ranges = buildHighlightRanges(safe, matches);
  if (!ranges.length) return escapeHTML(safe);

  let html = "";
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    html += escapeHTML(safe.slice(cursor, range.start));
    const label = [range.match.display || range.match.grammar, range.match.jlpt_level]
      .filter(Boolean)
      .join(" · ");
    const level = range.match.jlpt_level || "none";
    html += `<mark class="hl hl-${escapeAttr(level)}" title="${escapeAttr(label)}">${escapeHTML(safe.slice(range.start, range.end))}</mark>`;
    cursor = range.end;
  }
  html += escapeHTML(safe.slice(cursor));
  return html;
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
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_error) {}
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("Clipboard is not available.");
  return true;
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function notebookToCsv(items) {
  const headers = [
    "grammar", "jlpt_level", "sentence", "matchedText",
    "meaning_vi", "meaning_en", "structure", "note", "createdAt"
  ];
  const rows = items.map((item) => headers.map((key) => csvCell(item[key])).join(","));
  return [headers.join(","), ...rows].join("\r\n");
}

// Anki TSV: tabs separate fields, newlines separate notes. Anki renders HTML,
// so internal newlines become <br> and stray tabs are flattened to spaces.
function ankiField(value) {
  return String(value ?? "").replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
}

function notebookToAnki(items) {
  const notes = items.map((item) => {
    const front = ankiField(item.sentence || item.matchedText || item.grammar);
    const back = [
      `<b>${ankiField(item.grammar)}</b> (${ankiField(item.jlpt_level || "-")})`,
      item.matchedText ? `📌 ${ankiField(item.matchedText)}` : "",
      item.meaning_vi ? `🇻🇳 ${ankiField(item.meaning_vi)}` : "",
      item.meaning_en ? `🇬🇧 ${ankiField(item.meaning_en)}` : "",
      item.structure ? `🧩 ${ankiField(item.structure)}` : "",
      item.note ? `📝 ${ankiField(item.note)}` : ""
    ].filter(Boolean).join("<br>");
    return `${front}\t${back}`;
  });
  // Header tells Anki the separator and that HTML is allowed.
  return `#separator:tab\n#html:true\n${notes.join("\n")}`;
}

function exportNotebook(format) {
  if (!notebook.length) {
    showStatus("Notebook trống — chưa có gì để xuất");
    return;
  }
  const date = new Date().toISOString().slice(0, 10);
  if (format === "anki") {
    downloadFile(`grammar-sensei-anki-${date}.txt`, notebookToAnki(notebook), "text/plain;charset=utf-8");
    showStatus(`Đã xuất ${notebook.length} thẻ Anki`);
  } else {
    // Prepend BOM so Excel reads UTF-8 Japanese/Vietnamese correctly.
    downloadFile(`grammar-sensei-${date}.csv`, `﻿${notebookToCsv(notebook)}`, "text/csv;charset=utf-8");
    showStatus(`Đã xuất ${notebook.length} dòng CSV`);
  }
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

function getAnalysisKey(analysis) {
  return `${analysis?.input || ""}|${analysis?.primary?.id || ""}|${analysis?.primary?.matchedText || ""}`;
}

function renderAISection() {
  if (!aiResult) return "";

  if (!aiResult.available) {
    return `
      <div class="ai-card warning-card">
        <div class="label">AI</div>
        <div>${escapeHTML(aiResult.warning || "AI is not available.")}</div>
      </div>
    `;
  }

  const matches = aiResult.matches || [];
  return `
    <div class="ai-card">
      <div class="section-head compact">
        <h2>AI Explanation</h2>
        <span class="badge">${escapeHTML(aiResult.mode || "cloud")}</span>
      </div>
      ${aiResult.japaneseEquivalent ? `
        <div class="section">
          <div class="label">Japanese equivalent</div>
          <div class="code-line">${escapeHTML(aiResult.japaneseEquivalent)}</div>
        </div>
      ` : ""}
      ${matches.length ? matches.map((match) => `
        <div class="ai-match">
          <div class="topline">
            <div>
              <div class="label">${escapeHTML(match.jlptLevel || "-")} · ${(Number(match.confidence || 0) * 100).toFixed(0)}%</div>
              <div class="ai-pattern">${escapeHTML(match.pattern || match.grammarId || "-")}</div>
            </div>
          </div>
          <div>${escapeHTML(match.explanationVi || match.meaningVi || "-")}</div>
          ${match.whyMatched ? `<div class="muted">${escapeHTML(match.whyMatched)}</div>` : ""}
          ${match.structure ? `<div class="code-line">${escapeHTML(match.structure)}</div>` : ""}
          ${(match.possibleConfusions || []).length ? `
            <div class="confusion-list">
              ${match.possibleConfusions.map((item) => `<span class="confusion-pill">${escapeHTML(item)}</span>`).join("")}
            </div>
          ` : ""}
        </div>
      `).join("") : `<div class="muted">AI did not return a confident grammar match.</div>`}
      ${aiResult.warning ? `<div class="muted">${escapeHTML(aiResult.warning)}</div>` : ""}
    </div>
  `;
}

function renderDetail() {
  const analysis = currentState?.analysis;
  const primary = analysis?.primary;

  if (!analysis || !primary) {
    els.detail.innerHTML = `<div class="empty">Analyze Japanese text from a page or popup to see details here.</div>`;
    return;
  }

  const matches = analysis.matches || [];
  const secondaryMatches = matches.slice(1);
  const example = primary.example || {};
  els.detail.innerHTML = `
    <article class="detail-card">
      <div class="detail-main">
        <div class="sentence">${renderHighlightedText(analysis.input || "", matches)}${speakButton(analysis.input)}</div>

        <div class="topline">
          <div>
            <div class="label">Mẫu ngữ pháp${analysis.aiGenerated ? ` <span class="badge ai-badge">AI on-device</span>` : ""}</div>
            <div class="pattern">${escapeHTML(primary.display || primary.grammar)}</div>
          </div>
          <span class="badge">${escapeHTML(primary.jlpt_level || "-")}</span>
        </div>

        ${analysis.japaneseEquivalent ? `
          <div class="section">
            <div class="label">Mẫu tiếng Nhật tương đương</div>
            <div class="code-line">${escapeHTML(analysis.japaneseEquivalent)}</div>
          </div>
        ` : ""}

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
            <strong>${escapeHTML(example.ja || "-")}</strong>${speakButton(example.ja)}
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

        ${(primary.related || []).length ? `
          <div class="section">
            <div class="label">Related grammar</div>
            <div class="match-list">
              ${primary.related.map((item) => `<span class="match-pill">${escapeHTML(item)}</span>`).join("")}
            </div>
          </div>
        ` : ""}

        ${secondaryMatches.length ? `
          <div class="section">
            <div class="label">Also detected (${secondaryMatches.length})</div>
            <div class="match-list">
              ${secondaryMatches.map((match) => `
                <span class="match-pill" title="${escapeHTML(match.matchedText || match.detected || "")}">
                  <strong>${escapeHTML(match.jlpt_level)}</strong>${escapeHTML(match.display || match.grammar)} · ${escapeHTML(match.confidence || "-")}%
                </span>
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
          <button class="mini-btn ai-btn" id="ask-ai" type="button">Ask AI</button>
        </div>

        ${renderAISection()}
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

  document.getElementById("ask-ai").addEventListener("click", async () => {
    await askAI();
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
      <div class="sentence">${escapeHTML(item.sentence)}${speakButton(item.sentence)}</div>
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

async function askAI() {
  const analysis = currentState?.analysis;
  if (!analysis) {
    showStatus("No analysis to send");
    return;
  }

  const button = document.getElementById("ask-ai");
  if (button) {
    button.disabled = true;
    button.textContent = "Asking...";
  }

  try {
    aiResult = await sendRuntimeMessage({
      type: "AI_ANALYZE_GRAMMAR",
      text: analysis.input,
      localResult: analysis,
      detectedLanguage: analysis.detectedLanguage,
      source: "sidepanel"
    });
    aiResultKey = getAnalysisKey(analysis);
    renderDetail();
    showStatus(aiResult.available ? "AI explanation ready" : "AI needs setup");
  } catch (error) {
    aiResult = {
      available: false,
      warning: error.message,
      matches: []
    };
    aiResultKey = getAnalysisKey(analysis);
    renderDetail();
    showStatus(error.message);
  }
}

async function loadState() {
  const previousKey = aiResultKey;
  currentState = await sendRuntimeMessage({ type: "GET_SIDE_PANEL_STATE" });
  const nextKey = getAnalysisKey(currentState?.analysis);
  if (previousKey && previousKey !== nextKey) {
    aiResult = null;
    aiResultKey = "";
  }
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
    exportAnki: document.getElementById("export-anki"),
    exportCsv: document.getElementById("export-csv"),
    status: document.getElementById("status")
  });

  els.exportAnki.addEventListener("click", () => exportNotebook("anki"));
  els.exportCsv.addEventListener("click", () => exportNotebook("csv"));

  document.addEventListener("click", (event) => {
    const speakBtn = event.target.closest(".speak-btn");
    if (!speakBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const ok = speakJapanese(speakBtn.dataset.speak);
    if (!ok) showStatus("Trình duyệt không hỗ trợ phát âm");
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

// Keep the panel live: react to new analyses and notebook changes without a
// manual Refresh click.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes.sidePanelState) {
    loadState().catch((error) => showStatus(error.message));
  }
  if (changes.notebook) {
    loadNotebook().catch((error) => showStatus(error.message));
  }
});

document.addEventListener("DOMContentLoaded", init);
