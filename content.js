/**
 * Grammar Sensei – Content Script
 *
 * Injected into every page. Detects Japanese text selection,
 * shows a floating button, and renders grammar analysis popups.
 */

(() => {
  "use strict";

  /* ─── State ──────────────────────────────── */
  let floatingBtn = null;
  let popupCard   = null;

  /* ─── Helpers ────────────────────────────── */

  /**
   * Returns true if the string contains Japanese characters
   * (Hiragana, Katakana, CJK Unified Ideographs / Kanji).
   */
  function containsJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
  }

  /** Escape HTML special characters to prevent XSS. */
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /** Truncate a string to `max` characters, adding ellipsis. */
  function truncate(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max) + "…" : str;
  }

  /** Remove the floating button from the DOM. */
  function removeFloatingBtn() {
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
    }
  }

  /** Remove the popup card from the DOM. */
  function removePopupCard() {
    if (popupCard) {
      popupCard.remove();
      popupCard = null;
    }
  }

  /** Clean up all Grammar Sensei UI. */
  function cleanup() {
    removeFloatingBtn();
    removePopupCard();
  }

  /**
   * Clamp a popup position so it stays within the viewport.
   */
  function clampPosition(left, top, width, height) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let x = left;
    let y = top;

    if (x + width > scrollX + vw - 12) {
      x = scrollX + vw - width - 12;
    }
    if (x < scrollX + 12) {
      x = scrollX + 12;
    }
    if (y + height > scrollY + vh - 12) {
      y = scrollY + vh - height - 12;
    }
    if (y < scrollY + 12) {
      y = scrollY + 12;
    }

    return { x, y };
  }

  /* ─── Floating Button ───────────────────── */

  /**
   * Create and position the floating action button near the
   * user's text selection.
   */
  function showFloatingButton(x, y) {
    removeFloatingBtn();

    const btn = document.createElement("button");
    btn.id = "gs-floating-btn";
    btn.textContent = "文";
    btn.title = "Grammar Sensei – Analyze grammar";

    /* Position near cursor */
    btn.style.left = `${x + 8}px`;
    btn.style.top  = `${y - 44}px`;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAnalyze(x, y);
    });

    document.body.appendChild(btn);
    floatingBtn = btn;
  }

  /* ─── Popup Card ─────────────────────────── */

  /**
   * Build and display the grammar analysis popup.
   */
  function showPopupCard(x, y, selectedText, data) {
    removePopupCard();

    const card = document.createElement("div");
    card.id = "gs-popup-card";

    /* Determine JLPT badge class */
    const jlptClass = data.jlpt_level && data.jlpt_level.startsWith("N")
      ? `gs-jlpt-${data.jlpt_level}`
      : "";

    /* Extra grammar matches (beyond the primary one) */
    let extraMatchesHTML = "";
    if (data.all_matches && data.all_matches.length > 1) {
      const tags = data.all_matches
        .slice(1)
        .map((m) => `<span class="gs-extra-tag">${escapeHTML(m)}</span>`)
        .join("");
      extraMatchesHTML = `
        <div class="gs-section">
          <div class="gs-section-label">Also detected</div>
          <div class="gs-extra-matches">${tags}</div>
        </div>`;
    }

    card.innerHTML = `
      <div class="gs-card-header">
        <span class="gs-card-title">🎌 Grammar Sensei</span>
        <button class="gs-card-close" title="Close">&times;</button>
      </div>
      <div class="gs-card-body">
        <div class="gs-selected-text">${escapeHTML(truncate(selectedText, 120))}</div>

        <div class="gs-section">
          <div class="gs-section-label">Grammar Pattern</div>
          <div class="gs-section-content" style="font-size:15px;font-weight:700;color:#cba6f7;">${escapeHTML(data.grammar)}</div>
        </div>

        <div class="gs-section">
          <div class="gs-section-label">Meaning</div>
          <div class="gs-section-content">${escapeHTML(data.meaning)}</div>
        </div>

        <div class="gs-section">
          <div class="gs-section-label">Structure</div>
          <div class="gs-section-content" style="font-family:monospace;font-size:12.5px;color:#94e2d5;">${escapeHTML(data.structure)}</div>
        </div>

        <div class="gs-section">
          <div class="gs-section-label">Example</div>
          <div class="gs-section-content" style="color:#f9e2af;">${escapeHTML(data.example)}</div>
        </div>

        <div class="gs-section">
          <div class="gs-section-label">JLPT Level</div>
          <div class="gs-section-content">
            <span class="gs-jlpt-badge ${jlptClass}">${escapeHTML(data.jlpt_level)}</span>
          </div>
        </div>

        ${extraMatchesHTML}
      </div>
    `;

    /* Position the card */
    document.body.appendChild(card);

    const rect = card.getBoundingClientRect();
    const pos  = clampPosition(x + 12, y + 8, rect.width, rect.height);
    card.style.left = `${pos.x}px`;
    card.style.top  = `${pos.y}px`;

    /* Close button */
    card.querySelector(".gs-card-close").addEventListener("click", (e) => {
      e.stopPropagation();
      cleanup();
    });

    popupCard = card;
  }

  /**
   * Show a loading state in a popup card.
   */
  function showLoadingCard(x, y) {
    removePopupCard();

    const card = document.createElement("div");
    card.id = "gs-popup-card";
    card.innerHTML = `
      <div class="gs-card-header">
        <span class="gs-card-title">🎌 Grammar Sensei</span>
        <button class="gs-card-close" title="Close">&times;</button>
      </div>
      <div class="gs-loading">
        <div class="gs-spinner"></div>
        <div class="gs-loading-text">Analyzing grammar…</div>
      </div>
    `;

    document.body.appendChild(card);

    const rect = card.getBoundingClientRect();
    const pos  = clampPosition(x + 12, y + 8, rect.width, rect.height);
    card.style.left = `${pos.x}px`;
    card.style.top  = `${pos.y}px`;

    card.querySelector(".gs-card-close").addEventListener("click", (e) => {
      e.stopPropagation();
      cleanup();
    });

    popupCard = card;
  }

  /* ─── Analysis Handler ──────────────────── */

  function handleAnalyze(x, y) {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (!selectedText || !containsJapanese(selectedText)) {
      cleanup();
      return;
    }

    removeFloatingBtn();
    showLoadingCard(x, y);

    /* Send text to background service worker for analysis */
    chrome.runtime.sendMessage(
      { type: "ANALYZE_GRAMMAR", text: selectedText },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Grammar Sensei:", chrome.runtime.lastError.message);
          cleanup();
          return;
        }

        if (response && response.success) {
          showPopupCard(x, y, selectedText, response.data);
        } else {
          cleanup();
        }
      }
    );
  }

  /* ─── Event Listeners ───────────────────── */

  /**
   * On mouseup: detect Japanese text selection and show floating button.
   */
  document.addEventListener("mouseup", (e) => {
    /* Ignore clicks inside our own UI */
    if (
      (floatingBtn && floatingBtn.contains(e.target)) ||
      (popupCard && popupCard.contains(e.target))
    ) {
      return;
    }

    /* Small delay to let the browser finalize the selection */
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";

      if (selectedText.length > 0 && containsJapanese(selectedText)) {
        showFloatingButton(e.pageX, e.pageY);
      } else {
        removeFloatingBtn();
      }
    }, 10);
  });

  /**
   * On mousedown: clean up UI if clicking outside our elements.
   */
  document.addEventListener("mousedown", (e) => {
    if (
      (floatingBtn && floatingBtn.contains(e.target)) ||
      (popupCard && popupCard.contains(e.target))
    ) {
      return;
    }
    cleanup();
  });

  /**
   * Clean up on Escape key.
   */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cleanup();
    }
  });
})();
