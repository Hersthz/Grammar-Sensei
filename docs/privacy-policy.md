# Grammar Sensei Privacy Policy Draft

Effective date: 2026-06-12

Grammar Sensei is a Chrome extension for learning Japanese grammar. It analyzes selected Japanese text, manual input, and user-triggered page scans to show grammar explanations, JLPT levels, examples, and saved review items.

## Local-First Default

Grammar Sensei is local-first by default.

- Local grammar matching runs inside the Chrome extension.
- Hover mode is disabled by default.
- Page scanning happens only when the user clicks Scan Page.
- Keyboard page scanning happens only when the user presses Alt+Shift+G.
- Shift scan only analyzes the sentence under the cursor while the user is holding Shift.
- Cloud AI is off by default.

## Data Processed Locally

The extension may process:

- text selected by the user;
- text typed into Manual Input;
- visible Japanese sentences collected only when the user clicks Scan Page;
- visible Japanese sentences collected only when the user presses Alt+Shift+G;
- the Japanese sentence under the cursor while the user holds Shift;
- grammar analysis results;
- saved notebook items;
- review/SRS metadata;
- extension settings and disabled domains.

This data is stored locally in Chrome storage on the user's device unless the user explicitly exports it or enables optional cloud AI.

## Optional Cloud AI

Cloud AI runs only when all of the following are true:

- AI mode is set to Cloud;
- the user accepts the AI privacy consent;
- a backend endpoint is configured;
- the user clicks Ask AI.

When Cloud AI is used, Grammar Sensei sends only:

- the current sentence being analyzed;
- compact local grammar analysis;
- grammar database version;
- allowed grammar IDs and grammar candidates;
- UI language and strict-mode setting.

Grammar Sensei does not send full page text, page URL, page title, cookies, passwords, payment data, or browsing history.

The extension does not contain AI provider API keys. Cloud AI must be handled through a backend proxy controlled by the publisher.

## Data Not Collected

Grammar Sensei does not collect:

- passwords;
- payment information;
- email field contents;
- cookies;
- browsing history;
- full webpage content by default;
- analytics identifiers;
- advertising identifiers.

## Permissions

Grammar Sensei uses Chrome permissions only for its learning features:

- `activeTab`: read the current selection when the user interacts with the popup.
- `contextMenus`: add "Analyze Japanese grammar" to selected text.
- `storage`: save settings, history, notebook, and review metadata locally.
- `sidePanel`: show detailed grammar explanations and review tools.
- `<all_urls>` host access: inject the content script so the user can analyze selected Japanese text on webpages.

## Data Retention

History and notebook data remain on the user's device until the user clears them from the extension UI or uninstalls the extension.

## User Controls

Users can:

- disable the extension globally;
- disable specific domains;
- turn hover mode on or off;
- clear history;
- clear notebook data;
- export local data to JSON;
- import a local JSON backup;
- keep AI mode off.

## Contact

Publisher contact: add your support email or website before publishing.
