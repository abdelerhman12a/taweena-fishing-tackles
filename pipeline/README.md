# Marketplace pipeline

```
Facebook page ──scrape──▶ data/source_products.csv ──sync_products.py──▶ data/products.json ──▶ website marketplace + cart
                                                                                    │
                                              payment.provider (null today) ────────┘
                                              when Taweena adds digital payment,
                                              checkout.js charges checkout_ready items
```

## Day-to-day

1. New product posted on the Facebook page, or a price published in a post/comment?
   Add/edit one row in `data/source_products.csv` (keep the `sku` stable).
2. Run `python3 pipeline/sync_products.py` — it validates and regenerates
   `data/products.json`. Commit both files.
3. The website updates itself: prices, ASK buttons and cart all read the JSON.

In GitHub, `.github/workflows/sync-products.yml` does step 2 automatically on
every push that touches the CSV, and commits the regenerated JSON.

## Adding a digital payment method later (the whole point of the schema)

1. In `pipeline/sync_products.py`, set in `PAYMENT`:
   `"provider": "paymob"` (or `"stripe"` / `"fawry"`) and `"checkout_enabled": true`.
2. Re-run the pipeline.
3. In `fishing/checkout.js`, fill in that provider's adapter — the interface is
   `createSession(order) -> {redirect_url}` where `order` is
   `{items: [{sku, qty, unit_price_egp}], total_egp, currency: "EGP"}`.
   API keys must come from environment/server config, never from this repo.
4. Nothing else changes: every product with a price is already `checkout_ready`,
   and unpriced products keep flowing to WhatsApp.

## Price honesty rule

A price enters the CSV only when Taweena published it (post caption or a page
reply in comments), and `price_source` must say where. The validator rejects a
priced row without a source. Everything else stays price-on-request.
