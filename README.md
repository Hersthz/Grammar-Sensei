# Grammar Sensei - Japanese Grammar Detector

Grammar Sensei is a lightweight Chrome Extension for Japanese learners. It lets you select Japanese text on any webpage and instantly see grammar patterns, meanings, structures, examples, JLPT levels, and related matches.

The extension is built with plain JavaScript, HTML, and CSS. There is no build step and no external dependency.

## Features

- Detects Japanese text selections on normal webpages.
- Shows a floating `文` action button beside the selection.
- Adds a right-click context menu item: `Analyze Japanese grammar`.
- Analyzes grammar offline with a local database of 38 JLPT N5-N1 patterns.
- Supports common variants and contractions such as `ちゃう`, `じゃないか`, `なきゃ`, and `かも`.
- Displays multiple detected patterns when a sentence contains nested grammar.
- Includes confidence, tags, Sensei notes, examples, and copyable summaries.
- Toolbar popup includes settings, current-selection analysis, and local history.
- Uses `chrome.storage` for synced settings and local history.

## Quick Start

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this `Grammar-Sensei` folder.
5. Open a normal webpage that contains Japanese text.
6. Highlight a Japanese phrase, then click the floating `文` button.

You can also right-click selected Japanese text and choose `Analyze Japanese grammar`, or click the extension icon and use `Analyze Current Selection`.

## Project Structure

```text
Grammar-Sensei/
├── manifest.json      # Chrome Extension Manifest V3 configuration
├── background.js      # Service worker, grammar engine, settings, history
├── content.js         # Selection detection and on-page analysis UI
├── styles.css         # Injected UI styles for the content script
├── popup.html         # Toolbar popup UI
├── popup.js           # Toolbar popup behavior
├── icons/             # Extension icons
└── README.md
```

## How It Works

```text
User selects Japanese text
        |
        v
content.js detects Japanese characters
        |
        v
Floating button, context menu, or toolbar popup triggers analysis
        |
        v
background.js runs analyzeJapaneseGrammar(text)
        |
        v
background.js returns primary match + all detected matches
        |
        v
content.js and popup.js render the result and optionally save history
```

## Settings

The toolbar popup lets users control:

- Enable or disable Grammar Sensei.
- Show or hide the floating button.
- Auto-analyze immediately after selecting text.
- Save analysis history locally.
- Use compact on-page cards.
- Show or hide additional match lists.

## Extending The Grammar Database

Add or edit entries in `GRAMMAR_DATABASE` inside `background.js`.

Each entry supports:

- `pattern`: canonical display pattern.
- `variants`: exact text variants to detect.
- `regex`: optional Unicode regular expression for inflected forms.
- `meaning`, `structure`, `example`, `jlpt_level`, `nuance`, `tags`.
- `priority`: ranking weight when multiple patterns match.

## Future AI Integration

The local engine is intentionally shaped like an API result. To integrate an LLM later, replace or augment `analyzeJapaneseGrammar()` in `background.js`, and return the same response shape:

```json
{
  "primary": {
    "grammar": "ている",
    "meaning": "Ongoing action or resulting state.",
    "structure": "Verb て-form + いる",
    "example": "彼は本を読んでいる。 (He is reading a book.)",
    "jlpt_level": "N5"
  },
  "matches": []
}
```

## Verification

Static checks used during development:

```powershell
node --check background.js
node --check content.js
node --check popup.js
Get-Content manifest.json | ConvertFrom-Json | Out-Null
```

## License

MIT
