# Hosting the Privacy Policy

Chrome Web Store requires a **public URL** for the privacy policy. The file at `docs/privacy-policy.md` is the source — follow one of these options to get a URL.

---

## Option A — GitHub Pages (Recommended, free)

1. Push this repository to GitHub (public or private repo both work; Pages can serve from either).
2. Go to **Settings → Pages** in your GitHub repo.
3. Set Source → **Deploy from a branch** → `main` → `/ (root)` or `/docs`.
4. If serving from `/docs`, the URL will be:
   ```
   https://<your-username>.github.io/<repo-name>/privacy-policy
   ```
   GitHub Pages renders `.md` files as plain text by default. Use a Jekyll `_config.yml` or simply rename the file to `privacy-policy.html` (convert markdown to HTML) for cleaner rendering.

**Quickest path:** rename `docs/privacy-policy.md` → `docs/privacy-policy.html`, wrap the content in minimal HTML, push to GitHub, enable Pages from `/docs`. The Web Store only needs the URL to load — styling doesn't matter.

---

## Option B — Notion (Fastest, no code)

1. Create a new Notion page.
2. Paste the content of `docs/privacy-policy.md` into it.
3. Click **Share → Publish to web** → copy the public URL.
4. Use that URL in the Web Store submission form.

---

## Option C — Any Static Host

The file can be hosted anywhere publicly reachable: Netlify, Vercel, Cloudflare Pages, your own domain, etc.

---

## After Hosting

Once you have a public URL, add it in two places:

1. **Chrome Web Store submission form** → "Privacy policy URL" field.
2. **`docs/publish-checklist.md`** → Store Assets section (keep a record).

The URL does not need to be inside the extension package itself.
