# TAWEENA — Fishing Tackles (scroll site)

A BRIX-style 3D-scroll product site, rebuilt for **Taweena fishing tackles**
(سلسلة محلات توينه لأدوات صيد الأسماك — Nasr City · El Tagamoa · 6th of October),
following the same repo style as `tidewright-fishing`: a static GitHub Pages site,
no build step, root `index.html` redirects into `fishing/`.

## The film

The hero is the owner's own Taweena film (tuna → splash → angler → TAWEENA rod macro),
re-edited for a faster rhythm: **15.87s → 10.72s**

| Segment | Original | Edit |
|---|---|---|
| Tuna underwater | 0.0–6.6s @1.0× | @1.75× |
| Splash + angler on the bow | 6.6–10.0s @1.0× | @1.25× |
| Rod macro (TAWEENA lettering) | 10.0–13.9s @1.0× | @1.5× |
| Bent-rod finale | 13.9–15.87s @1.0× | @1.25× |

## Scroll-scrub preparation (both methods from the brief)

- **Option A — WebP image sequence (primary, matches the BRIX site):**
  `assets/hero/frames/frame_0001.webp … frame_0257.webp` (257 frames, ~7.1 MB total).
  Generated at the source's native 1280×720 / 24 fps — the brief's `fps=30, scale=1920`
  would only duplicate frames and upscale pixels, so native rate/size was kept.
  The site preloads the sequence, then draws the frame tied to GSAP ScrollTrigger
  progress onto a pinned 100vh `<canvas>`.
- **Option B — All-keyframe MP4 (fallback):** `assets/video/hero_scrub.mp4`
  (`-g 1 -keyint_min 1 -crf 22 -an`, faststart). If the frames are missing,
  `app.js` switches the hero to `<video>` scrubbing automatically.
- `assets/video/hero_master.mp4` — the full edited film with audio, for sharing/embeds.

## Structure (9 sections, per brief)

1. Fixed transparent header — TAWEENA wordmark, nav, Facebook CTA
2. Hero scroll canvas — pinned, scrubbed tuna-to-rod sequence, giant TAWEENA title
3. Product intro & joint reveal — "PRECISION WHERE IT MATTERS", two-piece ferrule separates/joins on scroll
4. Detail gallery "UP CLOSE" — stills taken from the hero film itself (no stock)
5. Depth-zone explorer — pinned; a jig descends SURFACE → MID WATER → THE DEEPER WATER, gradient + specs scrub with scroll
6. Product collection grid — rendered from `data/products.json`
7. Craftsmanship banner — MAKADI hand-made rigs
8. FAQ accordion — "BEFORE YOU HEAD OUT"
9. Consultation & footer — form opens WhatsApp with the message pre-filled; oversized TAWEENA footer wordmark; real branch phones

## Data honesty

All products, specs, branches and phones come from the public Facebook page
[facebook.com/Taweenafishing](https://www.facebook.com/Taweenafishing) scrape of
26 Nov 2026 (`data/products.json` carries the source note). Prices are shown
**only** where the page itself stated them (Kids Kit EGP 120; KEEP COLD 40L
EGP 2,625 in a page comment reply). Everything else says "PRICE ON WHATSAPP".

## Marketplace + pipeline (automated)

The collection is a working marketplace fed by an automated pipeline:

```
Facebook page ──scrape──▶ data/source_products.csv ──pipeline/sync_products.py──▶ data/products.json ──▶ shop grid + cart
```

- Products/prices live in `data/source_products.csv` (one row per SKU). Prices enter
  **only** where Taweena published them, with `price_source` required by the validator —
  currently 3 priced items (Kids Kit EGP 120, KEEP COLD 40L EGP 2,625, 60L EGP 4,190),
  the rest are price-on-request via WhatsApp.
- `python3 pipeline/sync_products.py` validates and regenerates `data/products.json`;
  `.github/workflows/sync-products.yml` does it automatically on push.
- Priced items are `checkout_ready` and go into the cart (`fishing/cart.js`).
  Checkout (`fishing/checkout.js`) is a provider-adapter layer: today
  `payment.provider` is `null`, so orders fall back to an itemised WhatsApp message.
  When Taweena adds a digital payment method (Paymob / Stripe / Fawry adapters are
  stubbed), set the provider in the pipeline config, implement the one server
  endpoint, and every priced product can be charged with **no catalog changes**.
  Full notes: `pipeline/README.md`.

## Run it

Any static server, e.g. `python3 -m http.server` in the repo root, then open
`http://localhost:8000/`. Or enable GitHub Pages (`.nojekyll` is included).

Libraries (CDN): GSAP 3.12 + ScrollTrigger, Lenis 1.1 — see `CREDITS.md`.
