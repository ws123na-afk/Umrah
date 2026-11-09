# Umrah invitation

Live page: `index.html` (plain static site, no build step on Vercel). `og.jpg` is the WhatsApp/Facebook preview image.

## Deploy
Vercel: import this repo, Framework Preset **Other**, leave build settings empty.

## Edit and rebuild
Everything is in `src/`. After editing, run `python3 build.py` to regenerate `index.html`, then commit.
If you change Tailwind classes, run `npm install` once and then `npm run site` (rebuilds `src/tw.css` and `index.html`). `vercel.json` turns off Vercel's own build, so always commit the built `index.html`.

- `src/template.html`: page, styles, countdown, dock, RSVP
- `src/scenes.js`: three.js 3D scenes (Makkah, Madina fallback)
- `src/parts/memories.html`, `src/parts/location.html`: photo section and map
- `src/img/p/`: photos used on the page
- `thumbnails/`: share images (square for WhatsApp, wide for Facebook)

- `src/config.js`: **all switches**: site address, Supabase key, tracking, reply form
- `src/rsvp.js`: reply form + click counting; `src/i18n.js` – Urdu/English text
- `report.html` (built from `src/report.html`): your private report
- `supabase/umrah.sql`: one-time database setup

## Link preview picture (WhatsApp / Facebook)
Set `siteUrl` in `src/config.js` to your real live address (for example `https://umrah-xyz.vercel.app`), run `python3 build.py`, commit.
The preview uses `og.jpg` (1200×630) and `thumbnails/umrah-invite-square.jpg` (1080×1080). WhatsApp caches previews: test with a new link such as `https://your-site/?v=2`.

## Replies and report (one-time setup)
1. Supabase → your project → **SQL Editor** → paste all of `supabase/umrah.sql` → **Run**. The last result row is your private **report key**: keep it secret.
2. Supabase → **Project Settings → API Keys** → copy the **Publishable** key (`sb_publishable_…`, or the legacy `anon` key). Paste it into `supabaseKey` in `src/config.js`. This key is public by design; guests can only add rows, never read them.
3. `python3 build.py`, commit, push.
4. Open `https://your-site/report.html` and paste the report key (or open `report.html#YOUR_KEY` once; it is remembered on that device only).

The report shows: visitors, who opened the invitation, replies (coming / not coming / number of people / messages), calls and WhatsApp taps, maps, calendar, shares, photos, devices (phone or computer, Android/iPhone, browser or in-app), where visits came from, and recent activity.

**Knowing who opened it:** send each guest a personal link, e.g. `https://your-site/?to=Ali%20Khan`. The page greets them by name and the report lists their visits under that name. No IP address or location is collected.

## Switches in `src/config.js`
- `rsvp.mode`: `'form'` (save replies for the report), `'whatsapp'` (old: guest picks a host on WhatsApp), `'off'` (hide all confirm buttons)
- `rsvp.askAttending`, `rsvp.askGuests`, `rsvp.maxGuests`, `rsvp.askMessage`: turn form questions on/off
- `tracking: false` stops click counting; empty `supabaseKey` turns storage off completely (form falls back to WhatsApp)

After any change: `python3 build.py`, commit, push.
