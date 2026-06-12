/* Grammar Sensei - first-run onboarding */

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

function escapeHTML(value) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(value ?? "")));
  return div.innerHTML;
}

async function trySample() {
  const sentence = "日本に行ったことがあります。";
  els.sampleResult.textContent = "Analyzing locally...";
  els.sampleResult.dataset.ready = "false";

  try {
    const analysis = await sendRuntimeMessage({
      type: "ANALYZE_GRAMMAR",
      text: sentence,
      source: "onboarding",
      saveHistory: false
    });
    const primary = analysis.primary || {};
    els.sampleResult.dataset.ready = "true";
    els.sampleResult.innerHTML = `
      <strong>${escapeHTML(primary.display || primary.grammar || "No match")}</strong>
      <div>JLPT: ${escapeHTML(primary.jlpt_level || "-")} · Confidence: ${escapeHTML(primary.confidence || 0)}</div>
      <div>${escapeHTML(primary.meaning_vi || "-")}</div>
      <div>${escapeHTML(primary.structure || "-")}</div>
    `;
  } catch (error) {
    els.sampleResult.textContent = error.message;
  }
}

function init() {
  Object.assign(els, {
    openOptions: document.getElementById("open-options"),
    sampleResult: document.getElementById("sample-result"),
    trySample: document.getElementById("try-sample")
  });

  els.trySample.addEventListener("click", trySample);
  els.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());
}

document.addEventListener("DOMContentLoaded", init);
