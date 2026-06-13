/**
 * Grammar Sensei - content script
 *
 * Handles selection, floating action, hover tooltip, page scan, and on-page
 * result cards. Heavy analysis stays in the background service worker.
 */

(() => {
  "use strict";

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
    uiLanguage: "vi",
    disabledDomains: []
  };

  const SKIP_SELECTOR = [
    "input",
    "textarea",
    "select",
    "button",
    "code",
    "pre",
    "script",
    "style",
    "nav",
    "[contenteditable='true']",
    "[role='button']",
    "[aria-hidden='true']",
    "#gs-floating-btn",
    "#gs-popup-card",
    "#gs-mini-tooltip",
    "#gs-scan-panel",
    "#gs-scan-toast"
  ].join(",");

  let settings = { ...DEFAULT_SETTINGS };
  let floatingBtn = null;
  let popupCard = null;
  let miniTooltip = null;
  let scanPanel = null;
  let scanToast = null;
  let hoverTimer = null;
  let shiftScanTimer = null;
  let autoAnalyzeTimer = null;
  let lastSelection = { text: "", x: 0, y: 0 };
  let lastHoverSentence = "";
  let lastHoverAnalysis = null;
  let lastShiftSentence = "";

  function containsJapanese(text) {
    return /[\u3040-\u30ff\u3400-\u9fff]/u.test(text || "");
  }

  function normalizeText(text) {
    return String(text || "").normalize("NFKC").replace(/[ \t\r\n]+/g, " ").trim();
  }

  function normalizeForMatch(text) {
    return normalizeText(text).replace(/\s+/g, "");
  }

  function splitJapaneseSentences(text) {
    return normalizeText(text)
      .split(/(?<=[。！？!?])\s+|(?<=[。！？!?])/u)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 2 && containsJapanese(sentence));
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(String(value ?? "")));
    return div.innerHTML;
  }

  function truncate(value, max) {
    const text = String(value || "");
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  function currentDomainDisabled() {
    const host = location.hostname;
    return settings.disabledDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  }

  function isPrivateInput(element) {
    if (!element || element.tagName?.toLowerCase() !== "input") return false;
    const type = String(element.type || "text").toLowerCase();
    const name = String(element.name || element.id || "").toLowerCase();
    return ["password", "email", "tel", "number", "credit-card"].includes(type) ||
      /card|cc|payment|email|mail|phone|password|pass/.test(name);
  }

  function isEditableElement(element) {
    if (!element) return false;
    const tag = element.tagName?.toLowerCase();
    return tag === "textarea" || tag === "input" || element.isContentEditable;
  }

  function shouldSkipElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return true;
    if (element.closest(SKIP_SELECTOR)) return true;
    if (isPrivateInput(element)) return true;
    return false;
  }

  function getSelectedText() {
    const active = document.activeElement;
    if (isPrivateInput(active)) return "";
    if (isEditableElement(active) && typeof active.selectionStart === "number") {
      return active.value.slice(active.selectionStart, active.selectionEnd).trim();
    }

    const selection = window.getSelection();
    return selection ? selection.toString().trim() : "";
  }

  function getSelectionPoint(event) {
    const fallback = {
      x: event?.pageX || window.scrollX + window.innerWidth / 2,
      y: event?.pageY || window.scrollY + window.innerHeight / 3
    };

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return fallback;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return fallback;

    return {
      x: window.scrollX + rect.left + Math.min(rect.width, 260),
      y: window.scrollY + rect.bottom
    };
  }

  function grammarSenseiContains(target) {
    return Boolean(target?.closest?.("#gs-floating-btn, #gs-popup-card, #gs-mini-tooltip, #gs-scan-panel, #gs-scan-toast"));
  }

  function removeFloatingBtn() {
    floatingBtn?.remove();
    floatingBtn = null;
  }

  function removePopupCard() {
    popupCard?.remove();
    popupCard = null;
  }

  function removeMiniTooltip() {
    miniTooltip?.remove();
    miniTooltip = null;
  }

  function removeScanPanel() {
    scanPanel?.remove();
    scanPanel = null;
  }

  function removeScanToast() {
    scanToast?.remove();
    scanToast = null;
  }

  function cleanup({ keepTooltip = false } = {}) {
    window.clearTimeout(autoAnalyzeTimer);
    window.clearTimeout(hoverTimer);
    window.clearTimeout(shiftScanTimer);
    removeFloatingBtn();
    removePopupCard();
    removeScanPanel();
    removeScanToast();
    if (!keepTooltip) removeMiniTooltip();
  }

  function clampPosition(left, top, width, height) {
    const margin = 12;
    const minX = window.scrollX + margin;
    const minY = window.scrollY + margin;
    const maxX = window.scrollX + window.innerWidth - width - margin;
    const maxY = window.scrollY + window.innerHeight - height - margin;
    return {
      x: Math.max(minX, Math.min(left, maxX)),
      y: Math.max(minY, Math.min(top, maxY))
    };
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

  function formatAnalysisSummary(selectedText, data) {
    const primary = data.primary || data;
    const also = (data.matches || [])
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
    return ok;
  }

  function setCardStatus(card, message, tone = "neutral") {
    const status = card.querySelector(".gs-card-status");
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
    window.setTimeout(() => {
      if (status.textContent === message) status.textContent = "";
    }, 2200);
  }

  function showScanToast(message, tone = "neutral") {
    removeScanToast();
    const toast = document.createElement("div");
    toast.id = "gs-scan-toast";
    toast.dataset.tone = tone;
    toast.textContent = message;
    document.body.appendChild(toast);
    scanToast = toast;

    window.setTimeout(() => {
      if (scanToast === toast) removeScanToast();
    }, 2400);
  }

  function showFloatingButton(x, y) {
    removeFloatingBtn();
    if (!settings.enabled || !settings.floatingButton || currentDomainDisabled()) return;

    const btn = document.createElement("button");
    btn.id = "gs-floating-btn";
    btn.type = "button";
    btn.textContent = "文";
    btn.title = "Analyze grammar with Grammar Sensei";
    btn.setAttribute("aria-label", "Analyze Japanese grammar");
    btn.style.left = `${x + 8}px`;
    btn.style.top = `${Math.max(8, y - 44)}px`;

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleAnalyze(lastSelection.text, lastSelection.x || x, lastSelection.y || y, "floating-button");
    });

    document.body.appendChild(btn);
    floatingBtn = btn;
  }

  function positionFloatingElement(element, x, y) {
    document.body.appendChild(element);
    const rect = element.getBoundingClientRect();
    const pos = clampPosition(x + 12, y + 10, rect.width, rect.height);
    element.style.left = `${pos.x}px`;
    element.style.top = `${pos.y}px`;
  }

  function renderTags(tags) {
    if (!tags?.length) return "";
    return `<div class="gs-tag-row">${tags.slice(0, 5).map((tag) => `<span class="gs-tag">${escapeHTML(tag)}</span>`).join("")}</div>`;
  }

  function renderMatchList(matches) {
    if (!settings.showMatchList || !matches || matches.length <= 1) return "";
    const secondaryMatches = matches.slice(1);
    return `
      <section class="gs-section gs-match-list">
        <div class="gs-section-label">Cũng phát hiện</div>
        <div class="gs-match-grid">
          ${secondaryMatches.map((match) => `
            <div class="gs-match-pill" title="${escapeHTML(match.matchedText || match.detected || "")}">
              <span>${escapeHTML(match.display || match.grammar)}</span>
              <small>${escapeHTML(match.jlpt_level)} · ${escapeHTML(match.confidence || "-")}%</small>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderSuggestions(data) {
    const suggestions = data.suggestions || [];
    if (!suggestions.length) return "";
    return `
      <section class="gs-section">
        <div class="gs-section-label">Gợi ý</div>
        <ul class="gs-suggestion-list">
          ${suggestions.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderExample(primary) {
    const example = primary.example;
    if (!example) return `<div class="gs-example">-</div>`;
    if (typeof example === "string") return `<div class="gs-example">${escapeHTML(example)}</div>`;
    return `
      <div class="gs-example">
        <div class="gs-example-ja">${escapeHTML(example.ja || "-")}</div>
        <div class="gs-example-romaji">${escapeHTML(example.romaji || "")}</div>
        <div class="gs-example-vi">${escapeHTML(example.vi || "")}</div>
        ${example.en ? `<div class="gs-example-en">${escapeHTML(example.en)}</div>` : ""}
      </div>
    `;
  }

  function showLoadingCard(x, y, selectedText) {
    removePopupCard();

    const card = document.createElement("div");
    card.id = "gs-popup-card";
    card.className = settings.compactMode ? "gs-compact" : "";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-live", "polite");
    card.innerHTML = `
      <div class="gs-card-header">
        <div>
          <div class="gs-card-title">Grammar Sensei</div>
          <div class="gs-card-subtitle">${escapeHTML(truncate(selectedText, 54))}</div>
        </div>
        <button class="gs-icon-btn gs-card-close" type="button" title="Close" aria-label="Close">&times;</button>
      </div>
      <div class="gs-loading">
        <div class="gs-spinner" aria-hidden="true"></div>
        <div class="gs-loading-text">Đang phân tích...</div>
      </div>
    `;

    positionFloatingElement(card, x, y);
    card.querySelector(".gs-card-close").addEventListener("click", cleanup);
    popupCard = card;
  }

  function showErrorCard(x, y, selectedText, message) {
    removePopupCard();

    const card = document.createElement("div");
    card.id = "gs-popup-card";
    card.className = "gs-error-card";
    card.setAttribute("role", "dialog");
    card.innerHTML = `
      <div class="gs-card-header">
        <div>
          <div class="gs-card-title">Grammar Sensei</div>
          <div class="gs-card-subtitle">${escapeHTML(truncate(selectedText, 54))}</div>
        </div>
        <button class="gs-icon-btn gs-card-close" type="button" title="Close" aria-label="Close">&times;</button>
      </div>
      <div class="gs-card-body">
        <div class="gs-empty-state">
          <div class="gs-empty-title">Không phân tích được selection này</div>
          <div class="gs-empty-copy">${escapeHTML(message)}</div>
        </div>
      </div>
    `;

    positionFloatingElement(card, x, y);
    card.querySelector(".gs-card-close").addEventListener("click", cleanup);
    popupCard = card;
  }

  function showPopupCard(x, y, selectedText, data) {
    removePopupCard();
    removeMiniTooltip();

    const primary = data.primary || {
      grammar: data.grammar,
      display: data.grammar,
      meaning_vi: data.meaning,
      structure: data.structure,
      example: data.example,
      jlpt_level: data.jlpt_level,
      confidence: data.confidence,
      tags: data.tags || []
    };
    const hasResult = Boolean(data.primary);
    const matches = data.matches || [];
    const confidence = Number(primary.confidence || 0);

    const card = document.createElement("div");
    card.id = "gs-popup-card";
    card.className = settings.compactMode ? "gs-compact" : "";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Grammar Sensei analysis");
    card.innerHTML = `
      <div class="gs-card-header">
        <div>
          <div class="gs-card-title">Grammar Sensei${data.aiGenerated ? ` <span class="gs-ai-pill">AI on-device</span>` : ""}</div>
          <div class="gs-card-subtitle">${hasResult ? `${matches.length} mẫu được phát hiện${data.aiGenerated ? " · suy luận bằng AI" : ""}` : "Chưa có match chắc chắn"}</div>
        </div>
        <div class="gs-card-actions">
          <button class="gs-icon-btn gs-copy-btn" type="button" title="Copy summary">Copy</button>
          <button class="gs-icon-btn gs-detail-btn" type="button" title="More detail">Detail</button>
          <button class="gs-icon-btn gs-card-close" type="button" title="Close" aria-label="Close">&times;</button>
        </div>
      </div>

      <div class="gs-card-body">
        <div class="gs-selected-text">${escapeHTML(truncate(selectedText, 180))}</div>

        <section class="gs-primary-panel ${hasResult ? "" : "gs-no-result"}">
          <div class="gs-primary-topline">
            <div>
              <div class="gs-section-label">Mẫu ngữ pháp</div>
              <div class="gs-pattern">${escapeHTML(primary.display || primary.grammar || "Not detected")}</div>
            </div>
            <span class="gs-jlpt-badge gs-jlpt-${escapeHTML(primary.jlpt_level || "none")}">${escapeHTML(primary.jlpt_level || "-")}</span>
          </div>

          <div class="gs-confidence-wrap" ${hasResult ? "" : "hidden"}>
            <div class="gs-confidence-bar" style="--gs-confidence:${confidence}%;"></div>
            <span>${confidence}%</span>
          </div>

          ${renderTags(primary.tags)}
        </section>

        ${data.romaji ? `
          <section class="gs-section">
            <div class="gs-section-label">Romaji</div>
            <div class="gs-code-line">${escapeHTML(data.romaji)}</div>
          </section>
        ` : ""}

        ${data.japaneseEquivalent ? `
          <section class="gs-section">
            <div class="gs-section-label">Mẫu tiếng Nhật tương đương</div>
            <div class="gs-code-line">${escapeHTML(data.japaneseEquivalent)}</div>
          </section>
        ` : ""}

        <section class="gs-section">
          <div class="gs-section-label">Nghĩa</div>
          <div class="gs-section-content">${escapeHTML(primary.meaning_vi || data.meaning || "-")}</div>
          ${primary.meaning_en ? `<div class="gs-muted-line">${escapeHTML(primary.meaning_en)}</div>` : ""}
        </section>

        <section class="gs-section">
          <div class="gs-section-label">Cấu trúc</div>
          <div class="gs-code-line">${escapeHTML(primary.structure || "-")}</div>
        </section>

        <section class="gs-section">
          <div class="gs-section-label">Ví dụ</div>
          ${renderExample(primary)}
        </section>

        ${primary.nuance_vi || primary.nuance ? `
          <section class="gs-section">
            <div class="gs-section-label">Sensei Note</div>
            <div class="gs-section-content">${escapeHTML(primary.nuance_vi || primary.nuance)}</div>
          </section>
        ` : ""}

        ${renderMatchList(matches)}
        ${renderSuggestions(data)}

        <div class="gs-card-footer">
          <span>${settings.saveHistory && hasResult ? "Đã lưu vào history" : "Local-only"}</span>
          <span class="gs-card-status" aria-live="polite"></span>
        </div>
      </div>
    `;

    positionFloatingElement(card, x, y);

    card.querySelector(".gs-card-close").addEventListener("click", (event) => {
      event.stopPropagation();
      cleanup();
    });

    card.querySelector(".gs-copy-btn").addEventListener("click", async (event) => {
      event.stopPropagation();
      const ok = await copyText(formatAnalysisSummary(selectedText, data));
      setCardStatus(card, ok ? "Copied" : "Copy failed", ok ? "success" : "danger");
    });

    card.querySelector(".gs-detail-btn").addEventListener("click", async (event) => {
      event.stopPropagation();
      await openDetail(data, "card");
      setCardStatus(card, "Detail opened", "success");
    });

    popupCard = card;
  }

  function showMiniTooltip(x, y, sentence, analysis) {
    removeMiniTooltip();
    if (!analysis?.primary) return;

    const primary = analysis.primary;
    const tooltip = document.createElement("div");
    tooltip.id = "gs-mini-tooltip";
    tooltip.setAttribute("role", "status");
    tooltip.innerHTML = `
      <div class="gs-mini-mark">文</div>
      <div class="gs-mini-main">
        <div class="gs-mini-pattern">${escapeHTML(primary.display || primary.grammar)}</div>
        <div class="gs-mini-meta">${escapeHTML(primary.jlpt_level)} · ${escapeHTML(primary.meaning_vi || primary.meaning || "")}</div>
      </div>
      <button class="gs-mini-more" type="button">More</button>
    `;

    tooltip.querySelector(".gs-mini-more").addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      lastSelection = { text: sentence, x, y };
      showPopupCard(x, y, sentence, analysis);
    });

    positionFloatingElement(tooltip, x, y);
    miniTooltip = tooltip;
  }

  async function openDetail(analysis, source = "selection") {
    await sendRuntimeMessage({
      type: "OPEN_SIDE_PANEL",
      data: {
        analysis,
        source,
        pageUrl: location.href,
        pageTitle: document.title
      }
    });
  }

  async function handleAnalyze(selectedText, x, y, source = "selection", options = {}) {
    const text = String(selectedText || getSelectedText()).trim();
    if (!settings.enabled || currentDomainDisabled() || !text || !containsJapanese(text)) {
      cleanup();
      return null;
    }

    lastSelection = { text, x, y };
    removeFloatingBtn();
    if (!options.silent) showLoadingCard(x, y, text);

    try {
      const analysis = await sendRuntimeMessage({
        type: "ANALYZE_GRAMMAR",
        text,
        source,
        saveHistory: options.saveHistory ?? settings.saveHistory,
        pageUrl: location.href,
        pageTitle: document.title
      });
      if (!options.silent) showPopupCard(x, y, text, analysis);
      return analysis;
    } catch (error) {
      console.error("Grammar Sensei:", error);
      if (!options.silent) showErrorCard(x, y, text, error.message);
      return null;
    }
  }

  function scheduleAutoAnalyze(text, point) {
    window.clearTimeout(autoAnalyzeTimer);
    autoAnalyzeTimer = window.setTimeout(() => {
      handleAnalyze(text, point.x, point.y, "auto-selection");
    }, 260);
  }

  function getSentenceNearPoint(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element || shouldSkipElement(element)) return "";

    const text = normalizeText(element.innerText || element.textContent || "");
    if (!containsJapanese(text) || text.length > 2500) return "";

    const sentences = splitJapaneseSentences(text);
    return sentences.find((sentence) => sentence.length >= 4) || "";
  }

  function handleHoverMove(event) {
    if (event.shiftKey && settings.shiftScanEnabled) {
      scheduleShiftScan(event);
      return;
    }

    window.clearTimeout(shiftScanTimer);
    if (!settings.enabled || !settings.hoverEnabled || currentDomainDisabled()) return;
    if (grammarSenseiContains(event.target)) return;

    window.clearTimeout(hoverTimer);
    const point = { clientX: event.clientX, clientY: event.clientY, x: event.pageX, y: event.pageY };
    hoverTimer = window.setTimeout(async () => {
      const sentence = getSentenceNearPoint(point.clientX, point.clientY);
      const key = normalizeForMatch(sentence);
      if (!sentence || key === lastHoverSentence) return;
      lastHoverSentence = key;

      const analysis = await handleAnalyze(sentence, point.x, point.y, "hover", { silent: true, saveHistory: false });
      lastHoverAnalysis = analysis;
      if (analysis?.primary) showMiniTooltip(point.x, point.y, sentence, analysis);
    }, settings.hoverDelayMs);
  }

  function isVisibleElement(element) {
    if (!element || shouldSkipElement(element)) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= window.innerHeight;
  }

  function collectVisibleJapaneseSentences(limit) {
    const sentences = [];
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !isVisibleElement(parent)) return NodeFilter.FILTER_REJECT;
        const text = normalizeText(node.nodeValue);
        if (!containsJapanese(text) || text.length < 2) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node = walker.nextNode();
    while (node && sentences.length < limit) {
      for (const sentence of splitJapaneseSentences(node.nodeValue)) {
        const key = normalizeForMatch(sentence);
        if (key.length < 3 || seen.has(key)) continue;
        seen.add(key);
        sentences.push(sentence);
        if (sentences.length >= limit) break;
      }
      node = walker.nextNode();
    }

    return sentences;
  }

  async function scanPageText() {
    const limit = Math.max(1, Math.min(Number(settings.scanLimit || 50), 100));
    const sentences = collectVisibleJapaneseSentences(limit);
    if (!sentences.length) {
      return { sentences: [], results: [], pageUrl: location.href, pageTitle: document.title };
    }

    const results = await sendRuntimeMessage({
      type: "ANALYZE_BATCH",
      sentences,
      source: "scan",
      limit
    });

    return { sentences, results, pageUrl: location.href, pageTitle: document.title };
  }

  function renderScanPanelItem(result, index) {
    const primary = result.primary || {};
    const hasMatch = Boolean(result.primary);
    const secondaryCount = Math.max(0, (result.matches || []).length - 1);
    return `
      <article class="gs-scan-panel-item" data-index="${index}">
        <div class="gs-scan-panel-topline">
          <div class="gs-scan-panel-pattern">${escapeHTML(primary.display || primary.grammar || "No strong match")}</div>
          <span class="gs-jlpt-badge gs-jlpt-${escapeHTML(primary.jlpt_level || "none")}">${escapeHTML(primary.jlpt_level || "-")}</span>
        </div>
        <div class="gs-scan-panel-text">${escapeHTML(truncate(result.input || result.normalized_input || "", 116))}</div>
        <div class="gs-scan-panel-meaning">${escapeHTML(primary.meaning_vi || (hasMatch ? "" : "Không có mẫu đủ ngưỡng confidence."))}</div>
        ${secondaryCount ? `
          <div class="gs-scan-panel-matches">
            +${secondaryCount} mẫu khác:
            ${(result.matches || []).slice(1).map((match) => `<span>${escapeHTML(match.display || match.grammar)} · ${escapeHTML(match.jlpt_level || "-")}</span>`).join("")}
          </div>
        ` : ""}
        <div class="gs-scan-panel-actions">
          <button type="button" data-action="card">Card</button>
          <button type="button" data-action="detail">Detail</button>
          <button type="button" data-action="copy">Copy</button>
        </div>
      </article>
    `;
  }

  function showScanPanel(scanData, source = "keyboard-scan") {
    removeScanPanel();

    const results = Array.isArray(scanData?.results) ? scanData.results : [];
    const panel = document.createElement("aside");
    panel.id = "gs-scan-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Grammar Sensei scan results");
    panel.innerHTML = `
      <div class="gs-scan-panel-header">
        <div>
          <div class="gs-scan-panel-title">Grammar Sensei Scan</div>
          <div class="gs-scan-panel-subtitle">${results.length} sentence${results.length === 1 ? "" : "s"} · visible page</div>
        </div>
        <button class="gs-scan-panel-close" type="button" title="Close" aria-label="Close">&times;</button>
      </div>
      <div class="gs-scan-panel-body">
        ${results.length ? results.map(renderScanPanelItem).join("") : `
          <div class="gs-scan-panel-empty">
            <div>Không tìm thấy câu tiếng Nhật đang hiển thị.</div>
            <small>Thử cuộn đến phần có nội dung Nhật rồi scan lại.</small>
          </div>
        `}
      </div>
      <div class="gs-scan-panel-footer">
        <span>Alt+Shift+G scan lại · giữ Shift để scan câu dưới chuột</span>
        <span>${results.length ? `${results.length} câu · Local-only` : "Local-only"}</span>
      </div>
    `;

    panel.querySelector(".gs-scan-panel-close").addEventListener("click", (event) => {
      event.stopPropagation();
      removeScanPanel();
    });

    panel.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();

      const item = button.closest(".gs-scan-panel-item");
      const result = results[Number(item?.dataset.index)];
      if (!result) return;

      const action = button.dataset.action;
      if (action === "card") {
        showPopupCard(window.scrollX + window.innerWidth - 430, window.scrollY + 72, result.input || "", result);
        return;
      }

      if (action === "detail") {
        await openDetail(result, source);
        showScanToast("Detail opened", "success");
        return;
      }

      if (action === "copy") {
        const ok = await copyText(formatAnalysisSummary(result.input || "", result));
        showScanToast(ok ? "Copied scan result" : "Copy failed", ok ? "success" : "danger");
      }
    });

    document.body.appendChild(panel);
    scanPanel = panel;
  }

  async function runKeyboardPageScan() {
    if (!settings.enabled || !settings.keyboardScanEnabled || currentDomainDisabled()) return;

    showScanToast("Scanning visible Japanese...");
    try {
      const data = await scanPageText();
      showScanPanel(data, "keyboard-scan");
      const count = data.results?.length || 0;
      showScanToast(count ? `Scan complete: ${count} sentences` : "No Japanese sentences found", count ? "success" : "neutral");
    } catch (error) {
      console.error("Grammar Sensei scan:", error);
      showScanToast(error.message || "Scan failed", "danger");
    }
  }

  function scheduleShiftScan(event) {
    if (!settings.enabled || !settings.shiftScanEnabled || currentDomainDisabled()) return;
    if (!event.shiftKey || grammarSenseiContains(event.target)) return;

    window.clearTimeout(shiftScanTimer);
    const delay = Math.max(100, Math.min(Number(settings.shiftScanDelayMs || 250), 1000));
    const point = { clientX: event.clientX, clientY: event.clientY, x: event.pageX, y: event.pageY };

    shiftScanTimer = window.setTimeout(async () => {
      const sentence = getSentenceNearPoint(point.clientX, point.clientY);
      const key = normalizeForMatch(sentence);
      if (!sentence || key === lastShiftSentence) return;
      lastShiftSentence = key;

      const analysis = await handleAnalyze(sentence, point.x, point.y, "shift-scan", {
        silent: true,
        saveHistory: false
      });

      if (analysis?.primary) {
        lastHoverAnalysis = analysis;
        showMiniTooltip(point.x, point.y, sentence, analysis);
      }
    }, delay);
  }

  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      settings = { ...DEFAULT_SETTINGS, ...items };
      if (!settings.enabled || currentDomainDisabled()) cleanup();
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    for (const [key, change] of Object.entries(changes)) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        settings[key] = change.newValue;
      }
    }
    if (!settings.enabled || currentDomainDisabled()) cleanup();
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type === "GET_CURRENT_SELECTION") {
      const text = getSelectedText();
      sendResponse({ success: true, data: { text, hasJapanese: containsJapanese(text) } });
      return false;
    }

    if (request?.type === "SHOW_GRAMMAR_ANALYSIS") {
      const point = getSelectionPoint();
      const x = lastSelection.x || point.x;
      const y = lastSelection.y || point.y;
      lastSelection = { text: request.text || "", x, y };
      removeFloatingBtn();
      showPopupCard(x, y, request.text || request.data?.input || "", request.data);
      sendResponse({ success: true, data: true });
      return false;
    }

    if (request?.type === "SHOW_MINI_TOOLTIP") {
      showMiniTooltip(request.x || window.scrollX + 40, request.y || window.scrollY + 40, request.text || "", request.data);
      sendResponse({ success: true, data: true });
      return false;
    }

    if (request?.type === "OPEN_DETAIL_CARD") {
      openDetail(request.data, request.source || "message")
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }

    if (request?.type === "SCAN_PAGE_TEXT") {
      scanPageText()
        .then((data) => sendResponse({ success: true, data }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;
    }

    return false;
  });

  document.addEventListener("mouseup", (event) => {
    if (grammarSenseiContains(event.target) || !settings.enabled || currentDomainDisabled()) return;

    window.setTimeout(() => {
      const text = getSelectedText();
      if (!text || !containsJapanese(text)) {
        removeFloatingBtn();
        return;
      }

      const point = getSelectionPoint(event);
      lastSelection = { text, x: point.x, y: point.y };

      if (settings.autoAnalyze) {
        removeFloatingBtn();
        scheduleAutoAnalyze(text, point);
      } else {
        showFloatingButton(point.x, point.y);
      }
    }, 15);
  });

  document.addEventListener("mousedown", (event) => {
    if (grammarSenseiContains(event.target)) return;
    cleanup();
  });

  document.addEventListener("mousemove", handleHoverMove, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cleanup();
    const key = String(event.key || "").toLowerCase();
    if (settings.keyboardScanEnabled && event.altKey && event.shiftKey && key === "g" && !isEditableElement(event.target)) {
      event.preventDefault();
      runKeyboardPageScan();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "Shift") {
      window.clearTimeout(shiftScanTimer);
      lastShiftSentence = "";
    }
  });

  window.addEventListener("scroll", () => {
    removeFloatingBtn();
    removeMiniTooltip();
  }, { passive: true });

  loadSettings();
})();
