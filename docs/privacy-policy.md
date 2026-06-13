# Grammar Sensei Privacy Policy

Effective date: 2026-06-13

Grammar Sensei is a Chrome extension for learning Japanese grammar. It analyzes selected Japanese text, manual input, and user-triggered page scans to show grammar explanations, JLPT levels, in-sentence highlights, examples, and saved review items.

## Local-First Default

Grammar Sensei is local-first. All core features — grammar detection, in-sentence highlighting, text-to-speech playback, notebook, spaced-repetition review, and the on-device AI fallback — run entirely inside your browser with no network requests.

- Grammar matching runs inside the Chrome extension using an on-device pattern database.
- In-sentence highlight and TTS use browser built-in APIs (no external service).
- Hover mode is disabled by default.
- Page scanning happens only when the user clicks Scan Page or presses Alt+Shift+G.
- Shift scan analyzes only the sentence under the cursor while the user holds Shift.
- On-device AI (Gemini Nano, built into Chrome) is the default AI mode. When the local database has no confident match for a sentence the user actively queried, it analyzes that sentence automatically. It runs on the user's machine and sends nothing over the network. On devices or Chrome versions where it is unavailable, it simply does nothing and the local result stands.
- Cloud AI is a separate mode that is off until the user configures it (see below).

## Data Processed Locally

The extension may process:

- text selected by the user;
- text typed into Manual Input;
- visible Japanese sentences collected only when the user clicks Scan Page;
- visible Japanese sentences collected only when the user presses Alt+Shift+G;
- the Japanese sentence under the cursor while the user holds Shift;
- grammar analysis results;
- saved notebook items and Pro entitlement status;
- spaced-repetition (SRS) metadata;
- extension settings and disabled domains.

This data is stored locally in Chrome storage on the user's device. It is never transmitted to any third party unless the user explicitly enables optional Cloud AI (see below).

## Optional Cloud AI

Cloud AI is off by default and runs only when all of the following are true:

- AI mode is set to Cloud in Options (the default is on-device, not cloud);
- the user accepts the AI privacy consent;
- a backend endpoint URL is configured by the user.

Once the user has opted into Cloud mode and configured an endpoint, cloud analysis may fire automatically for sentences the user actively queries (selection, manual input, context menu) when the local database has no confident match — the user does not have to press a separate button each time. High-frequency background sources (hover and page scan) never trigger cloud calls. The user can return to on-device or off mode at any time in Options.

When Cloud AI is used, Grammar Sensei sends only:

- the current sentence being analyzed;
- compact local grammar analysis result;
- grammar database version;
- allowed grammar IDs and grammar candidates;
- UI language and strict-mode setting.

Grammar Sensei does not send full page text, page URL, page title, cookies, passwords, payment data, or browsing history to any server.

The extension does not contain AI provider API keys. Cloud AI must be handled through a backend proxy configured and controlled by the user.

## Pro Entitlement

Pro status is stored locally in Chrome storage. No purchase data, payment card information, or personal identifiers are processed by the extension itself. Payment is handled externally by a third-party payment provider (ExtensionPay / Stripe); Grammar Sensei only receives a boolean paid status written to local storage by that provider.

## Data Not Collected

Grammar Sensei does not collect:

- passwords or form field contents;
- payment or financial information;
- cookies or session tokens;
- browsing history or visited URLs;
- full webpage content (only user-selected or user-triggered text is processed);
- analytics or advertising identifiers;
- device identifiers or fingerprints.

## Permissions

Grammar Sensei requests Chrome permissions only for its learning features:

- `activeTab`: read the current selection when the user interacts with the popup or context menu.
- `contextMenus`: add "Analyze Japanese grammar" to the right-click menu for selected text.
- `storage`: save settings, history, notebook, Pro status, and SRS metadata locally on the user's device.
- `sidePanel`: display detailed grammar explanations, examples, notebook, and review tools.
- Content script (`<all_urls>` match): inject the floating 文 button, on-page result cards, in-sentence highlights, and user-triggered scan panel into webpages. This is a content script declaration — not a host permission — so the extension does not make cross-origin network requests to those sites. All processing is local.
- `optional_host_permissions` (runtime only): when the user enables Cloud AI and saves a backend endpoint, the extension requests access to that specific origin only. This is never triggered by default features.

## Data Retention

History and notebook data remain on the user's device until the user clears them from the Options page or uninstalls the extension. Exporting and deleting data is available at any time from Options → Data Management.

## User Controls

Users can:

- disable the extension globally;
- disable the extension on specific domains;
- enable or disable hover mode;
- clear analysis history;
- clear notebook and review data;
- export all local data to JSON;
- import a previously exported JSON backup;
- switch AI mode between on-device (default), off, or cloud at any time;
- export notebook to Anki or CSV (Pro).

## Changes to This Policy

If this policy changes materially, the effective date above will be updated. Continued use of the extension after a policy update constitutes acceptance of the new terms.

## Contact

For privacy questions or data requests, contact: tamhoang2022005@gmail.com
