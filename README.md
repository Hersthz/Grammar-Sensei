# Grammar Sensei – Japanese Grammar Detector

> A lightweight Chrome Extension that helps Japanese learners understand **grammar patterns** directly on any webpage.

![Chrome Extension](https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome)
![JLPT](https://img.shields.io/badge/JLPT-N5–N1-teal)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Inline grammar analysis** — highlight Japanese text, click, and learn
- **JLPT level estimation** — N5 through N1
- **Clean popup card** — shows pattern, meaning, structure & example
- **Zero dependencies** — vanilla JS, HTML, CSS only
- **Works offline** — uses a built-in mock grammar database (20 patterns)
- **Ready for AI** — swap the mock function for a real API in minutes

---

## 🚀 Quick Start

1. Clone or download this folder.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in top-right).
4. Click **Load unpacked** → select the `Grammar-Sensei` folder.
5. Visit any webpage with Japanese text.
6. **Highlight** Japanese text → click the floating **文** button → read the grammar breakdown!

---

## 📁 Project Structure

```
Grammar-Sensei/
├── manifest.json      # Extension manifest (V3)
├── background.js      # Service worker + mock grammar analyser
├── content.js         # Selection detection + popup rendering
├── styles.css         # Injected content styles
├── popup.html         # Extension toolbar popup
├── popup.js           # Popup script
├── icons/             # Extension icons (16, 48, 128)
└── README.md          # You are here
```

---

## 🎯 How It Works

```
User selects Japanese text
        │
        ▼
  content.js detects selection & shows floating button
        │
        ▼
  User clicks button → content.js sends text to background.js
        │
        ▼
  background.js → analyzeJapaneseGrammar(text) → returns JSON
        │
        ▼
  content.js renders popup card with grammar explanation
```

---

## 🤖 AI Integration (Future)

The mock function `analyzeJapaneseGrammar()` in `background.js` can be replaced with a real API call.
Use the prompts below with any LLM API (OpenAI, Anthropic, Gemini, etc.).

### System Prompt

```
You are a Japanese grammar teacher helping JLPT learners.
Explain grammar structures only.
Do not translate the entire sentence.
Be concise and beginner-friendly.
```

### User Prompt Template

```
Analyze this Japanese sentence:

{sentence}

Identify grammar patterns and output:

Grammar:
Meaning:
Structure:
Example:
JLPT Level:
```

### Expected JSON Response Shape

```json
{
  "grammar": "ている",
  "meaning": "Ongoing action or resulting state (progressive / stative)",
  "structure": "Verb て-form + いる",
  "example": "彼は本を読んでいる。(He is reading a book.)",
  "jlpt_level": "N5"
}
```

---

## 🔧 Extending

| Want to…                        | Edit…                |
|--------------------------------|----------------------|
| Add more grammar patterns      | `background.js` – `GRAMMAR_DATABASE` array |
| Change popup styling           | `styles.css`         |
| Add settings / dark mode toggle| `popup.html` + `popup.js` |
| Connect a real AI API          | `background.js` – `analyzeJapaneseGrammar()` |
| Add history / bookmarks        | Use `chrome.storage.local` |

---

## 📜 License

MIT — free to use, modify, and distribute.
