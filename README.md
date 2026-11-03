# Umrah invitation

Live page: `index.html` (plain static site, no build step on Vercel). `og.jpg` is the WhatsApp/Facebook preview image.

## Deploy
Vercel: import this repo, Framework Preset **Other**, leave build settings empty.

## Edit and rebuild
Everything is in `src/`. After editing, run `python3 build.py` to regenerate `index.html`, then commit.
If you change Tailwind classes, run `npm install` once and then `npm run site` (rebuilds `src/tw.css` and `index.html`). `vercel.json` turns off Vercel's own build, so always commit the built `index.html`.

- `src/template.html` – page, styles, countdown, dock, RSVP
- `src/scenes.js` – three.js 3D scenes (Makkah, Madina fallback)
- `src/parts/memories.html`, `src/parts/location.html` – photo section and map
- `src/img/p/` – photos used on the page
- `thumbnails/` – share images (square for WhatsApp, wide for Facebook)

If the Vercel address is not `umrah.vercel.app`, change it in the `og:` tags near the top of `src/template.html` and rebuild.
