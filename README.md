# AcrossAds website

A static, single-page marketing site: plain HTML, CSS and JS with no build step. To preview it, open `acrossads/index.html` in a browser. To host it, upload this folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

```
acrossads/          ← the website (Vercel serves this folder)
├── index.html      page structure and all copy
├── styles.css      design tokens (brand colours) at the top in :root
├── script.js       animations, hero chat script, form submission
├── demo.css        interactive demo styles (uses the site's own tokens)
├── demo.js         interactive demo logic (scripted conversations, not a live AI)
└── assets/         logo mark, favicon, full logo
```

## Make the contact form live (about 2 minutes)

1. Go to https://web3forms.com, enter the email that should receive leads, and copy the Access Key they send you.
2. In `index.html`, find `YOUR_WEB3FORMS_ACCESS_KEY` and paste your key there.
3. Optional: in `script.js`, set `FALLBACK_EMAIL`. It is only used while no key is set, and it opens the visitor's email app pre-filled.

## Swapping placeholder content

Every editable spot has a ✏️ comment in `index.html`. Search the file for `✏️`.

| What | Where |
|---|---|
| Stats (3x, 25+ hrs…) | `data-count`, `data-prefix` and `data-suffix` on `.stat__num` |
| Screenshots | Replace a `<div class="shot-placeholder">…</div>` with `<img src="assets/your-file.jpg" alt="…">` |
| Testimonials | `.t-card` blocks. **These are samples. Replace them with real client quotes before launch.** |
| Testimonial photos | Replace `<div class="t-card__avatar">RM</div>` with `<img class="t-card__avatar" src="…" alt="…">` |
| Hero chat conversation | `HERO_CHAT` array at the top of `script.js` |
| Brand colours | CSS variables in `:root` in `styles.css` |
| WhatsApp number | Search for `917021081263` (it assumes the +91 country code) |

## Interactive demo

The "AI demo" section (below *How it works*, linked from the header) is a scripted WhatsApp conversation the visitor can play through for Real Estate, E-commerce and Clinics. It is **not** a live AI and the page says so. To change the conversations, edit `SCENARIOS` at the top of `demo.js`; to restyle it, change the tokens in `:root` in `styles.css` (the demo reuses them).
