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
- Lightweight conjugation/context helpers for better matched phrases.
- Vietnamese-first grammar data with English kept as secondary context.
- Basic kana-only romaji helper; kanji readings are not guessed.
- Settings and history via Chrome storage.
- Publish-safe AI cloud connector with backend proxy contract; AI is off by default.

## How To Use

- Selection: highlight Japanese text, click the floating `文` button.
- Context menu: highlight Japanese text, right-click, choose `Analyze Japanese grammar`.
- Popup: click the extension icon, then use `Analyze Selection`, `Analyze Input`, or `Scan Page`.
- Keyboard scan: press `Alt+Shift+G` on a page with visible Japanese text to open an on-page scan panel.
- Shift scan: hold `Shift` and move the cursor over a Japanese sentence to show a mini grammar tooltip.
- Hover: enable `Hover mode` in Settings, then hover a Japanese sentence and click `More`.
- Detail: click `Detail` from a card/result to open Chrome Side Panel.
- AI: configure a backend endpoint in Options, accept the AI privacy notice, then click `Ask AI` in the Side Panel.

The service worker loads `data/` and `core/` with classic `importScripts`, keeping the extension no-build and MV3-friendly.

## Cloud AI

Grammar Sensei does not store provider API keys in the extension. Cloud mode calls a backend proxy that you control:

```text
Extension -> Your Backend -> AI Provider
```

The backend contract lives in `docs/cloud-ai-contract.md`. The extension sends the current sentence, compact local result, grammar DB version, allowed grammar IDs, and grammar candidates. It intentionally excludes page URL, page title, and full page text.

## Adding Grammar Patterns

Grammar entries are organized by JLPT level. Add a pattern to the file for its level: `data/grammar-n5.js`, `grammar-n4.js`, `grammar-n3.js`, `grammar-n2.js`, or `grammar-n1.js`. Each entry should include:

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

Use specific variants/regex and avoid broad patterns unless priority is low. Prefer leaving ambiguous morphology (passive/potential られる, conjugated 可能形) to the AI fallback rather than adding a broad regex that mislabels.

Each `grammar-n*.js` file pushes its entries with `Data.GRAMMAR_DATABASE = (Data.GRAMMAR_DATABASE || []).concat(entries)`. Register new files in `background.js` importScripts and the test files' `files` arrays, and bump the DB-count assertion in `test-analyzer.js`.

Semantic Vietnamese/English intent mappings are also organized by level: `data/semantic-n5.js` … `semantic-n1.js` (grouped by the level of the target grammarId).

## Local NLP Layer

A small no-dependency NLP layer supports matching:

- `core/conjugation.js` infers coarse surface forms such as `te-form`, `ta-form`, `nai-form`, and polite endings, and expands a matched phrase to its natural boundary.
- `core/matcher.js` includes `conjugation` context on each match.

This is deliberately lightweight. It improves UI context and false-positive control without turning the extension into a heavy parser.

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
- The conjugation helpers are rule-based and intentionally lightweight.
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
