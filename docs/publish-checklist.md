# Grammar Sensei Publish Checklist

Use this checklist before uploading a ZIP to Chrome Web Store.

## Policy Alignment

- The extension has a single purpose: help users learn Japanese grammar from selected/manual/user-triggered text.
- All permissions are explained in `docs/store-listing.md`.
- Privacy behavior is documented in `docs/privacy-policy.md`.
- Cloud AI is optional and off by default.
- No AI provider API keys are stored in extension source.
- No remote scripts are loaded.
- No code obfuscation is used.
- No ads, affiliate links, deceptive installs, or unrelated monetization are present.

Official references checked during Phase 6:

- Chrome Web Store Program Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Side Panel API availability: https://developer.chrome.com/docs/extensions/reference/api/sidePanel

## Local Verification

```powershell
node scripts/validate-publish.js
node --check background.js
node --check content.js
node --check popup.js
node --check sidepanel.js
node --check options.js
node --check onboarding.js
node --check core/ai-provider.js
node --check core/matcher.js
node --check core/srs.js
node --check core/pro.js
node test-analyzer.js
node test-ai-provider.js
node test-nlp.js
node test-srs.js
node test-pro.js
```

## Manual QA

- Load unpacked from `chrome://extensions`.
- Confirm no red error appears on extension load.
- Install opens onboarding page.
- Onboarding sample analysis works.
- Selection -> floating 文 -> on-page card works.
- Right-click selected Japanese -> Analyze Japanese grammar works.
- Popup Analyze Selection works.
- Manual Japanese input works.
- Manual Vietnamese/English semantic input works.
- Scan Page works on a Japanese page.
- Alt+Shift+G opens the on-page scan panel on a Japanese page.
- Holding Shift over Japanese text shows a mini grammar tooltip.
- Hover mode is off by default, can be enabled, and shows mini tooltip.
- Side Panel opens and shows detail.
- Save to Notebook works.
- Review queue Again / Hard / Good / Easy works.
- Options save settings.
- Disable domain works.
- Export/import JSON works.
- Anki/CSV export is locked for Free users (shows upgrade prompt) and works after enabling Pro.
- Options "Simulate Pro" toggle flips notebook export and the popup Pro badge between Free and Pro.
- Free page scan caps at the free sentence limit; Pro scans up to the configured limit.
- Clear history and clear notebook work.
- Default AI mode is on-device (browser): on Chrome 138+ with Gemini Nano available, selecting a sentence whose grammar is NOT in the local DB auto-shows an AI result (no button press); the loading card appears while it runs.
- On-device auto fallback degrades gracefully where Gemini Nano is unavailable (local "not detected" stands, no error spam).
- Hover and page scan never trigger AI (no model spam while browsing).
- AI mode Off does not call any AI (local only).
- AI mode Cloud without consent shows setup warning.
- AI mode Cloud without endpoint shows setup warning.
- AI mode Cloud sends only current sentence and compact local result to configured backend.
- Saving Cloud mode with an endpoint prompts for host access to that single origin only (no install-time broad host permission).
- Denying the host permission prompt leaves Cloud AI unable to call out (graceful warning), while local and on-device AI keep working.
- On Microsoft Edge (Chromium): core local features work; on-device Gemini Nano may be unavailable and degrades gracefully.

## Store Assets

- 128x128 icon is present.
- Prepare at least one 1280x800 or 640x400 screenshot for the listing.
- Prepare privacy policy URL from `docs/privacy-policy.md`.
- Add support email or support website.
- Fill data usage disclosures to match the privacy policy.

## Packaging

Run:

```powershell
.\scripts\package-extension.ps1
```

Upload the generated ZIP from `dist/`.
