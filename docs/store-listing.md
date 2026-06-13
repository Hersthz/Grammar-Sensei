# Chrome Web Store Listing Draft

## Name

Grammar Sensei - Japanese Grammar Detector

## Short Name

Grammar Sensei

## Short Description

Detect Japanese grammar from selected text, manual input, and page scans — with Vietnamese-first explanations and in-sentence highlighting.

## Detailed Description

Grammar Sensei helps Japanese learners understand grammar patterns while reading the web.

Highlight Japanese text, click the floating 文 button, or use the right-click menu to detect grammar patterns such as 〜たことがある, 〜ている, 〜なければならない, 〜ようになる, and more. The extension shows the JLPT level, highlights the exact grammar point inside your sentence, gives Vietnamese-first meaning, structure, conjugation examples, romaji, related patterns, and possible confusions.

Key features:

- Local grammar detection with 378 JLPT N5–N1 patterns — runs on your device, no server.
- Automatic on-device AI fallback — when a sentence uses grammar outside the local database, Gemini Nano (built into Chrome) analyzes it automatically, on your machine, with no network call and no button to press.
- In-sentence highlight — color-coded by JLPT level so you see exactly which part triggered the rule.
- Listen (TTS) — hear any Japanese sentence spoken aloud with one click using the browser's built-in voice.
- Vietnamese-first explanations with English as secondary context.
- Floating 文 button for selected Japanese text.
- Right-click context menu analysis.
- Toolbar popup with manual input and scan page.
- Alt+Shift+G on-page scan panel for visible Japanese sentences.
- Shift-hover quick scan for the sentence under the cursor.
- Optional hover tooltip, disabled by default.
- Side Panel detail view with examples, confusions, and review queue.
- Local notebook and lightweight spaced-repetition review (SRS).
- Export/import local data as JSON.
- Optional Cloud AI connector through your own configured backend only (off until you set it up).

Pro features ($10 one-time):

- Export notebook to Anki (.txt) and CSV (Excel-compatible) for use in flashcard apps.
- Unlimited page scan (Free tier: up to 15 sentences per scan).
- Notebook sync across devices (coming soon).
- Advanced study stats (coming soon).

Privacy:

Grammar Sensei is local-first. Grammar analysis, highlight, TTS, notebook, and the on-device AI fallback (Gemini Nano) all run inside your browser with no network calls. Cloud AI is a separate, opt-in feature that stays off until you configure your own backend endpoint and accept the AI privacy notice. The extension does not include provider API keys and does not send full page text, page URL, page title, cookies, passwords, or payment data.

## Category

Education

## Language

English listing with Vietnamese-first learning content.

## Permission Justifications

### activeTab

Used to read the user's current selection after they click the extension popup, and to inject the grammar result card into the active tab.

### contextMenus

Used to add "Analyze Japanese grammar" to the right-click menu for selected text.

### storage

Used to save extension settings, analysis history, notebook items, Pro entitlement status, and spaced-repetition metadata locally on the user's device.

### sidePanel

Used to show the detailed grammar explanation, examples, confusions, notebook, and SRS review queue in a persistent side panel.

### Content script match: all URLs

The content script is declared for all sites so users can analyze selected Japanese text, display the floating 文 button and on-page result cards, show in-sentence grammar highlights, and run user-triggered page scans on whatever Japanese website they are reading. All analysis runs locally in the extension; no page content is sent anywhere by default.

### optional_host_permissions (requested at runtime)

No broad host permission is requested at install time. When — and only when — a user enables Cloud AI and saves their own backend endpoint URL, the extension requests access to that single origin at runtime via a user gesture (Save button). Default features (local detection, highlight, TTS, notebook, export) never trigger this request.

## Screenshots To Capture

1. Floating 文 button on selected Japanese text → on-page result card with in-sentence highlight (color-coded JLPT level) and 🔊 TTS button.
2. Popup: Analyze Selection result with match list.
3. Popup: Manual Input tab + Scan Page result.
4. Side Panel: detail view with examples, confusions, and Anki/CSV export buttons (Pro unlocked).
5. On-page scan panel opened with Alt+Shift+G showing sentence list.
6. Notebook / SRS review queue in side panel.
7. Options page — Pro panel showing "Simulate Pro" toggle and Free/Pro badge.
