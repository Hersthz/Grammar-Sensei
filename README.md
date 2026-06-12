# Grammar Sensei / Grammar-Sensei

Grammar Sensei is a local-first Chrome Extension for Japanese learners. It helps you inspect Japanese sentences on any webpage, detect grammar patterns, and read concise Vietnamese-first explanations with JLPT level, romaji, examples, related matches, and saved notes.

The project is still plain JavaScript/HTML/CSS with no build step.

## Features

- Select Japanese text and click the floating `文` button.
- Right-click selected text and choose `Analyze Japanese grammar`.
- Use the toolbar popup to analyze the current selection.
- Paste Japanese, Vietnamese, or English into Manual Input.
- Scan the current visible page for Japanese sentences on demand.
- Press `Alt+Shift+G` to scan visible Japanese sentences from the page without opening the popup.
- Hold `Shift` while moving over Japanese text to quick-scan the sentence under the cursor.
- Optional hover mode with a small tooltip, disabled by default.
- Side Panel detail view with explanation, examples, confusions, copy, and notebook save.
- Review Queue in the Side Panel with Again / Hard / Good / Easy ratings.
- Lightweight local SRS metadata: due date, review count, lapse count, interval, ease factor.
- Options page for advanced settings, disabled domains, export/import, reset, and data clearing.
- Stronger confidence threshold behavior to reduce broad false positives like standalone polite endings in full sentences.
- Local grammar engine with 220+ JLPT N5-N1 patterns.
- Lightweight tokenizer and conjugation/context helpers for better matched phrases.
- Vietnamese-first grammar data with English kept as secondary context.
- Basic kana-only romaji helper; kanji readings are not guessed.
- Settings and history via Chrome storage.
- Publish-safe AI cloud connector with backend proxy contract; AI is off by default.

## Load Unpacked

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this `Grammar-Sensei` folder.
5. Open a normal webpage with Japanese text.

## How To Use

- Selection: highlight Japanese text, click the floating `文` button.
- Context menu: highlight Japanese text, right-click, choose `Analyze Japanese grammar`.
- Popup: click the extension icon, then use `Analyze Selection`, `Analyze Input`, or `Scan Page`.
- Keyboard scan: press `Alt+Shift+G` on a page with visible Japanese text to open an on-page scan panel.
- Shift scan: hold `Shift` and move the cursor over a Japanese sentence to show a mini grammar tooltip.
- Hover: enable `Hover mode` in Settings, then hover a Japanese sentence and click `More`.
- Detail: click `Detail` from a card/result to open Chrome Side Panel.
- AI: configure a backend endpoint in Options, accept the AI privacy notice, then click `Ask AI` in the Side Panel.

## Privacy

Grammar Sensei is local-only by default.

- Local grammar matching runs inside the extension.
- Scan Page only runs when you click `Scan Page`.
- Keyboard page scan only runs when you press `Alt+Shift+G`.
- Shift scan only analyzes the sentence under the cursor while you are holding `Shift`.
- Hover mode is disabled by default.
- AI mode is `off` by default.
- Cloud AI runs only when AI mode is `cloud`, AI privacy consent is accepted, a backend endpoint is configured, and the user clicks `Ask AI`.
- Cloud AI sends only the current sentence and compact local analysis. It does not send full page text, page URL, or page title.
- The extension avoids input, password, email/payment-like fields, code blocks, nav, buttons, script, and style nodes.
- You can disable the current domain from the popup.

`host_permissions: <all_urls>` is used so the content script can analyze selected text on pages where the user explicitly interacts with Grammar Sensei.

## Architecture

```text
GRAMMAR-SENSEI/
  data/
    grammar-database.js
    grammar-phase4-pack.js
    grammar-phase8-pack.js
    semantic-map.js
    semantic-phase8-map.js
  core/
    normalize.js
    romaji.js
    tokenizer.js
    conjugation.js
    srs.js
    matcher.js
    ai-provider.js
  background.js
  content.js
  popup.html
  popup.js
  sidepanel.html
  sidepanel.js
  sidepanel.css
  options.html
  options.js
  options.css
  onboarding.html
  onboarding.js
  onboarding.css
  scripts/
    validate-publish.js
    package-extension.ps1
  styles.css
  manifest.json
  docs/
    privacy-policy.md
    store-listing.md
    publish-checklist.md
    cloud-ai-contract.md
  test-analyzer.js
  test-ai-provider.js
  test-nlp.js
  test-srs.js
```

The service worker loads `data/` and `core/` with classic `importScripts`, keeping the extension no-build and MV3-friendly.

## Analyzer Result Shape

The analyzer returns:

```js
{
  input,
  normalized_input,
  detectedLanguage,
  source,
  primary,
  matches,
  suggestions,
  romaji,
  romajiQuality,
  translation_vi,
  warnings
}
```

Each match includes:

```js
{
  id,
  grammar,
  display,
  detected,
  matchedText,
  conjugation,
  tokens,
  meaning_vi,
  meaning_en,
  structure,
  example,
  examples,
  jlpt_level,
  nuance_vi,
    nuance_en,
    confusions,
    related,
    tags,
  confidence,
  index
}
```

## Settings

Defaults:

```js
{
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
  cloudEndpoint: "",
  aiConsentAccepted: false,
  aiStrictMode: true,
  aiTimeoutMs: 12000,
  uiLanguage: "vi",
  disabledDomains: []
}
```

## Cloud AI

Grammar Sensei does not store provider API keys in the extension. Cloud mode calls a backend proxy that you control:

```text
Extension -> Your Backend -> AI Provider
```

The backend contract lives in `docs/cloud-ai-contract.md`. The extension sends the current sentence, compact local result, grammar DB version, allowed grammar IDs, and grammar candidates. It intentionally excludes page URL, page title, and full page text.

## Adding Grammar Patterns

Edit `data/grammar-database.js`. Each entry should include:

- `id`
- `pattern`
- `display`
- `jlpt_level`
- `meaning_vi`
- `meaning_en`
- `structure`
- `structures`
- `examples`
- `variants`
- `regex`
- `negativeRegex`
- `nuance_vi`
- `nuance_en`
- `confusions`
- `tags`
- `priority`

Use specific variants/regex and avoid broad patterns unless priority is low.

For curated expansions, use `data/grammar-phase4-pack.js` and `data/grammar-phase8-pack.js` while the database is still being reviewed. Once entries are stable, they can be merged back into the base database.

Semantic Vietnamese/English intent mappings live in `data/semantic-map.js` and `data/semantic-phase8-map.js`.

## Local NLP Layer

Phase 4 adds a small no-dependency NLP layer:

- `core/tokenizer.js` splits Japanese text into lightweight tokens, particles, punctuation, and grammar-ending chunks.
- `core/conjugation.js` infers coarse surface forms such as `te-form`, `ta-form`, `nai-form`, and polite endings.
- `core/matcher.js` includes `conjugation` and nearby `tokens` on each match.

This is deliberately lightweight. It improves UI context and false-positive control without turning the extension into a heavy parser.

## Checks

```powershell
node scripts/validate-publish.js
node --check background.js
node --check content.js
node --check popup.js
node --check sidepanel.js
node --check options.js
node --check onboarding.js
node --check core/tokenizer.js
node --check core/conjugation.js
node --check core/srs.js
node --check core/ai-provider.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"
node test-analyzer.js
node test-ai-provider.js
node test-nlp.js
node test-srs.js
```

## Publish Package

Before publishing, read:

- `docs/privacy-policy.md`
- `docs/store-listing.md`
- `docs/publish-checklist.md`

Then create a Chrome Web Store ZIP:

```powershell
.\scripts\package-extension.ps1
```

The ZIP is written to `dist/` and intentionally excludes tests, scripts, and draft docs from the runtime package.

## Known Limitations

- The local matcher is not a full Japanese parser.
- Romaji is basic kana-only; kanji readings are not guessed without a dictionary.
- The tokenizer/conjugation helpers are rule-based and intentionally lightweight.
- Semantic Vietnamese/English mode is keyword-based.
- Cloud AI requires a separate backend proxy; the extension intentionally does not include provider API keys.
- SRS is intentionally lightweight and local-only, not a full FSRS implementation.
- OCR and subtitles are not implemented yet.

## Data Management

Open the extension options page to:

- edit advanced settings;
- manage disabled domains;
- export settings/history/notebook to JSON;
- import a Grammar Sensei JSON backup;
- clear history or notebook separately;
- reset settings to defaults.

Import replaces local settings, history, and notebook records.

## License

MIT
