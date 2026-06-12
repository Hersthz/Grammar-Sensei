/**
 * Grammar Sensei - Content Script
 *
 * Detects Japanese text selections, shows lightweight controls, and renders
 * grammar analysis results without requiring the user to leave the page.
 */

(() => {
  "use strict";

  const DEFAULT_SETTINGS = {
    enabled: true,
    floatingButton: true,
    autoAnalyze: false,
    saveHistory: true,
    compactMode: false,
    showMatchList: true
  };

  let settings = { ...DEFAULT_SETTINGS };
  let floatingBtn = null;
  let popupCard = null;
  let autoAnalyzeTimer = null;
  let lastSelection = { text: "", x: 0, y: 0 };

  function containsJapanese(text) {
    return /[\u3040-\u30ff\u3400-\u9fff]/u.test(text || "");
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

  function isEditableElement(element) {
    if (!element) return false;
    const tag = element.tagName?.toLowerCase();
    return tag === "textarea" || tag === "input" || element.isContentEditable;
  }

  function getSelectedText() {
    const active = document.activeElement;
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
    return Boolean(
      target?.closest?.("#gs-floating-btn") ||
      target?.closest?.("#gs-popup-card")
    );
  }

  function removeFloatingBtn() {
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
    }
  }

  function removePopupCard() {
    if (popupCard) {
      popupCard.remove();
      popupCard = null;
    }
  }

  function cleanup() {
    window.clearTimeout(autoAnalyzeTimer);
    removeFloatingBtn();
    removePopupCard();
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

        resolve(response);
      });
    });
  }

  function formatAnalysisSummary(selectedText, data) {
    const primary = data.primary || data;
    const also = (data.matches || [])
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

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_error) {
        // Fall through to the textarea fallback for restricted pages.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
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

  function showFloatingButton(x, y) {
    removeFloatingBtn();
    if (!settings.enabled || !settings.floatingButton) return;

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

  function positionCard(card, x, y) {
    document.body.appendChild(card);
    const rect = card.getBoundingClientRect();
    const pos = clampPosition(x + 12, y + 10, rect.width, rect.height);
    card.style.left = `${pos.x}px`;
    card.style.top = `${pos.y}px`;
  }

  function renderMatchList(matches) {
    if (!settings.showMatchList || !matches || matches.length <= 1) return "";

    return `
      <section class="gs-section gs-match-list" aria-label="Detected grammar patterns">
        <div class="gs-section-label">Also Detected</div>
        <div class="gs-match-grid">
          ${matches.slice(1, 7).map((match) => `
            <div class="gs-match-pill">
              <span>${escapeHTML(match.grammar)}</span>
              <small>${escapeHTML(match.jlpt_level)}</small>
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
        <div class="gs-section-label">Try This</div>
        <ul class="gs-suggestion-list">
          ${suggestions.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  function renderTags(tags) {
    if (!tags?.length) return "";
    return `
      <div class="gs-tag-row">
        ${tags.slice(0, 5).map((tag) => `<span class="gs-tag">${escapeHTML(tag)}</span>`).join("")}
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
        <div class="gs-loading-text">Analyzing grammar...</div>
      </div>
    `;

    positionCard(card, x, y);
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
          <div class="gs-empty-title">Could not analyze this selection</div>
          <div class="gs-empty-copy">${escapeHTML(message)}</div>
        </div>
      </div>
    `;

    positionCard(card, x, y);
    card.querySelector(".gs-card-close").addEventListener("click", cleanup);
    popupCard = card;
  }

  function showPopupCard(x, y, selectedText, data) {
    removePopupCard();

    const primary = data.primary || {
      grammar: data.grammar,
      meaning: data.meaning,
      structure: data.structure,
      example: data.example,
      jlpt_level: data.jlpt_level,
      confidence: data.confidence,
      tags: data.tags || []
    };

    const hasResult = Boolean(data.primary);
    const matches = data.matches || [];
    const card = document.createElement("div");
    card.id = "gs-popup-card";
    card.className = settings.compactMode ? "gs-compact" : "";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Grammar Sensei analysis");

    card.innerHTML = `
      <div class="gs-card-header">
        <div>
          <div class="gs-card-title">Grammar Sensei</div>
          <div class="gs-card-subtitle">
            ${hasResult ? `${matches.length} match${matches.length === 1 ? "" : "es"} found` : "No exact match"}
          </div>
        </div>
        <div class="gs-card-actions">
          <button class="gs-icon-btn gs-copy-btn" type="button" title="Copy summary" aria-label="Copy summary">Copy</button>
          <button class="gs-icon-btn gs-card-close" type="button" title="Close" aria-label="Close">&times;</button>
        </div>
      </div>

      <div class="gs-card-body">
        <div class="gs-selected-text">${escapeHTML(truncate(selectedText, 180))}</div>

        <section class="gs-primary-panel ${hasResult ? "" : "gs-no-result"}">
          <div class="gs-primary-topline">
            <div>
              <div class="gs-section-label">Grammar Pattern</div>
              <div class="gs-pattern">${escapeHTML(primary.grammar || "Not detected")}</div>
            </div>
            <span class="gs-jlpt-badge gs-jlpt-${escapeHTML(primary.jlpt_level || "none")}">${escapeHTML(primary.jlpt_level || "-")}</span>
          </div>

          <div class="gs-confidence-wrap" ${hasResult ? "" : "hidden"}>
            <div class="gs-confidence-bar" style="--gs-confidence:${Number(primary.confidence || 0)}%;"></div>
            <span>${Number(primary.confidence || 0)}%</span>
          </div>

          ${renderTags(primary.tags)}
        </section>

        <section class="gs-section">
          <div class="gs-section-label">Meaning</div>
          <div class="gs-section-content">${escapeHTML(primary.meaning || data.meaning || "-")}</div>
        </section>

        <section class="gs-section">
          <div class="gs-section-label">Structure</div>
          <div class="gs-code-line">${escapeHTML(primary.structure || "-")}</div>
        </section>

        <section class="gs-section">
          <div class="gs-section-label">Example</div>
          <div class="gs-example">${escapeHTML(primary.example || "-")}</div>
        </section>

        ${primary.nuance ? `
          <section class="gs-section">
            <div class="gs-section-label">Sensei Note</div>
            <div class="gs-section-content">${escapeHTML(primary.nuance)}</div>
          </section>
        ` : ""}

        ${renderMatchList(matches)}
        ${renderSuggestions(data)}

        <div class="gs-card-footer">
          <span>${settings.saveHistory && hasResult ? "Saved to history" : "History off or no result"}</span>
          <span class="gs-card-status" aria-live="polite"></span>
        </div>
      </div>
    `;

    positionCard(card, x, y);

    card.querySelector(".gs-card-close").addEventListener("click", (event) => {
      event.stopPropagation();
      cleanup();
    });

    card.querySelector(".gs-copy-btn").addEventListener("click", async (event) => {
      event.stopPropagation();
      const ok = await copyText(formatAnalysisSummary(selectedText, data));
      setCardStatus(card, ok ? "Copied" : "Copy failed", ok ? "success" : "danger");
    });

    popupCard = card;
  }

  async function handleAnalyze(selectedText, x, y, source = "selection") {
    const text = String(selectedText || getSelectedText()).trim();
    if (!settings.enabled || !text || !containsJapanese(text)) {
      cleanup();
      return;
    }

    lastSelection = { text, x, y };
    removeFloatingBtn();
    showLoadingCard(x, y, text);

    try {
      const response = await sendRuntimeMessage({
        type: "ANALYZE_GRAMMAR",
        text,
        source,
        saveHistory: settings.saveHistory
      });
      showPopupCard(x, y, text, response.data);
    } catch (error) {
      console.error("Grammar Sensei:", error);
      showErrorCard(x, y, text, error.message);
    }
  }

  function scheduleAutoAnalyze(text, point) {
    window.clearTimeout(autoAnalyzeTimer);
    autoAnalyzeTimer = window.setTimeout(() => {
      handleAnalyze(text, point.x, point.y, "auto-selection");
    }, 260);
  }

  function loadSettings() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      settings = { ...DEFAULT_SETTINGS, ...items };
      if (!settings.enabled) cleanup();
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") return;
    for (const [key, change] of Object.entries(changes)) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        settings[key] = change.newValue;
      }
    }
    if (!settings.enabled) cleanup();
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type === "GET_CURRENT_SELECTION") {
      const text = getSelectedText();
      sendResponse({ success: true, text, hasJapanese: containsJapanese(text) });
      return false;
    }

    if (request?.type === "SHOW_GRAMMAR_ANALYSIS") {
      const point = getSelectionPoint();
      const x = lastSelection.x || point.x;
      const y = lastSelection.y || point.y;
      lastSelection = { text: request.text || "", x, y };
      removeFloatingBtn();
      showPopupCard(x, y, request.text || "", request.data);
      sendResponse({ success: true });
      return false;
    }

    return false;
  });

  document.addEventListener("mouseup", (event) => {
    if (grammarSenseiContains(event.target) || !settings.enabled) return;

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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") cleanup();
  });

  window.addEventListener("scroll", removeFloatingBtn, { passive: true });

  loadSettings();
})();
