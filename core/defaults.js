/* Grammar Sensei - single source of truth for default settings.
 *
 * Loaded by the service worker (importScripts), the content script (manifest
 * content_scripts), and every extension page (script tag) so the default
 * settings never drift between contexts.
 */
(function (global) {
  "use strict";

  const Core = global.GrammarSenseiCore = global.GrammarSenseiCore || {};

  const DEFAULT_SETTINGS = {
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
    aiMode: "browser",
    autoAiFallback: true,
    cloudEndpoint: "",
    aiConsentAccepted: false,
    aiStrictMode: true,
    aiTimeoutMs: 12000,
    uiLanguage: "vi",
    disabledDomains: []
  };

  // Frozen so no consumer can accidentally mutate the shared template.
  Core.DEFAULT_SETTINGS = Object.freeze({ ...DEFAULT_SETTINGS });
  global.GRAMMAR_SENSEI_DEFAULT_SETTINGS = Core.DEFAULT_SETTINGS;
})(globalThis);
