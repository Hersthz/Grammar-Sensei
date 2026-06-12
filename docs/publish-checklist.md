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
node test-analyzer.js
node test-ai-provider.js
node test-nlp.js
node test-srs.js
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
- Hover mode is off by default, can be enabled, and shows mini tooltip.
- Side Panel opens and shows detail.
- Save to Notebook works.
- Review queue Again / Hard / Good / Easy works.
- Options save settings.
- Disable domain works.
- Export/import JSON works.
- Clear history and clear notebook work.
- AI mode Off does not call cloud.
- AI mode Cloud without consent shows setup warning.
- AI mode Cloud without endpoint shows setup warning.
- AI mode Cloud sends only current sentence and compact local result to configured backend.

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

