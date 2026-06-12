# Grammar Sensei / Grammar-Sensei

Grammar Sensei is a local-first Chrome Extension for Japanese learners. It helps you inspect Japanese sentences on any webpage, detect grammar patterns, and read concise Vietnamese-first explanations with JLPT level, romaji, examples, related matches, and saved notes.

The project is still plain JavaScript/HTML/CSS with no build step.

## Features

- Select Japanese text and click the floating `文` button.
- Right-click selected text and choose `Analyze Japanese grammar`.
- Use the toolbar popup to analyze the current selection.
- Paste Japanese, Vietnamese, or English into Manual Input.
- Scan the current visible page for Japanese sentences on demand.
- Optional hover mode with a small tooltip, disabled by default.
- Side Panel detail view with explanation, examples, confusions, copy, and notebook save.
- Local grammar engine with 50 JLPT N5-N1 patterns.
- Vietnamese-first grammar data with English kept as secondary context.
- Basic kana-only romaji helper; kanji readings are not guessed.
- Settings and history via Chrome storage.
- AI mode settings and provider stubs, but AI is off by default.

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
- Hover: enable `Hover mode` in Settings, then hover a Japanese sentence and click `More`.
- Detail: click `Detail` from a card/result to open Chrome Side Panel.

## Privacy

Grammar Sensei is local-only by default.

- Local grammar matching runs inside the extension.
- Scan Page only runs when you click `Scan Page`.
- Hover mode is disabled by default.
- AI mode is `off` by default.
- Phase 1 AI providers are safe stubs and do not send text to cloud.
- The extension avoids input, password, email/payment-like fields, code blocks, nav, buttons, script, and style nodes.
- You can disable the current domain from the popup.

`host_permissions: <all_urls>` is used so the content script can analyze selected text on pages where the user explicitly interacts with Grammar Sensei.

## Architecture

```text
GRAMMAR-SENSEI/
  data/
    grammar-database.js
    semantic-map.js
  core/
    normalize.js
    romaji.js
    matcher.js
    ai-provider.js
  background.js
  content.js
  popup.html
  popup.js
  sidepanel.html
  sidepanel.js
  sidepanel.css
  styles.css
  manifest.json
  test-analyzer.js
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
  meaning_vi,
  meaning_en,
  structure,
  example,
  examples,
  jlpt_level,
  nuance_vi,
  nuance_en,
  confusions,
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
  scanLimit: 50,
  confidenceThreshold: 70,
  semanticMode: true,
  aiMode: "off",
  uiLanguage: "vi",
  disabledDomains: []
}
```

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

## Checks

```powershell
node --check background.js
node --check content.js
node --check popup.js
node --check sidepanel.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"
node test-analyzer.js
```

## Known Limitations

- The local matcher is not a full Japanese parser.
- Romaji is basic kana-only; kanji readings are not guessed without a dictionary/tokenizer.
- Semantic Vietnamese/English mode is keyword-based.
- AI mode is only scaffolded in Phase 1 and is off by default.
- OCR, subtitles, and SRS scheduling are not implemented yet.

## License

MIT
