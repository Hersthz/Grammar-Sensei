# Chrome Web Store Listing Draft

## Name

Grammar Sensei - Japanese Grammar Detector

## Short Name

Grammar Sensei

## Short Description

Analyze Japanese grammar from selected text, manual input, and page scans with Vietnamese-first explanations.

## Detailed Description

Grammar Sensei helps Japanese learners understand grammar patterns while reading the web.

Highlight Japanese text, click the floating 文 button, or use the right-click menu to detect grammar patterns such as 〜たことがある, 〜ている, 〜なければならない, 〜ようになる, and more. The extension shows JLPT level, matched text, Vietnamese-first meaning, structure, examples, romaji, related patterns, and possible confusions.

Key features:

- Local grammar detection with 100+ JLPT N5-N1 patterns.
- Vietnamese-first explanations with English as secondary context.
- Floating 文 button for selected Japanese text.
- Right-click context menu analysis.
- Toolbar popup with manual input and scan page.
- Optional hover tooltip, disabled by default.
- Side Panel detail view with examples and confusions.
- Local notebook and lightweight review queue.
- Export/import for local data.
- Optional Cloud AI connector through your configured backend only.

Privacy:

Grammar Sensei is local-first by default. Cloud AI is off unless the user configures a backend endpoint, accepts the AI privacy notice, and clicks Ask AI. The extension does not include provider API keys and does not send full page text, page URL, page title, cookies, passwords, or payment data.

## Category

Education

## Language

English listing with Vietnamese-first learning content.

## Permission Justifications

### activeTab

Used to read the user's current selection after they click the extension popup.

### contextMenus

Used to add "Analyze Japanese grammar" for selected text.

### storage

Used to save extension settings, history, notebook items, and review metadata locally.

### sidePanel

Used to show detailed grammar explanations, examples, confusions, notebook, and review queue.

### Host permission: all URLs

Used to inject the content script so users can analyze selected Japanese text, show the floating 文 button, display on-page result cards, and run user-triggered page scans on websites they visit.

## Screenshots To Capture

- Popup with Analyze Selection, Manual Input, Scan Page, and settings.
- Floating 文 button on selected Japanese text.
- On-page result card.
- Side Panel detail view.
- Notebook/review queue.
- Options page with privacy and AI cloud settings.

