#!/usr/bin/env python3
"""
Taweena marketplace pipeline.

Source of truth : data/source_products.csv   (one row per product, edited by hand
                                              or exported from a Facebook scrape)
Generated output: data/products.json         (what the website reads — never edit by hand)

Usage:
    python3 pipeline/sync_products.py           # validate + regenerate products.json
    python3 pipeline/sync_products.py --check   # validate only (used by CI)

Rules enforced:
  * sku is required, unique, and stable (it is the key the cart + future payment
    provider use — never rename a sku, add a new one instead).
  * price_egp is either empty (price on request -> WhatsApp flow) or a positive number.
    A priced product MUST carry price_source saying where the price was published.
  * currency is fixed to EGP in the store config.

Payment readiness:
  Every priced product is emitted with  "checkout_ready": true . When a digital
  payment provider is configured in the store block of products.json
  (payment.provider, e.g. "paymob" / "stripe"), the site checkout can charge
  exactly the checkout_ready items with no further data work. See pipeline/README.md.
"""
import csv, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "source_products.csv"
OUT = ROOT / "data" / "products.json"

STORE = {
    "name": "Taweena Fishing Tackles",
    "page": "https://www.facebook.com/Taweenafishing",
    "whatsapp": "201227347737",
    "email": "info@taweena.com",
    "branches": [
        {"name": "Nasr City", "detail": "6 Nagati Serag, behind El Serag Mall, Cairo 11717", "phone": "01226575854"},
        {"name": "El Tagamoa (New Cairo)", "detail": "Branch listed by the page — details on WhatsApp", "phone": "01227347737"},
        {"name": "6th of October", "detail": "El Israa Plaza Mall, Central Axis", "phone": "01283620001"},
    ],
}

# Payment is intentionally OFF until Taweena adds a digital payment method.
# To enable: set "provider" to the provider id and "checkout_enabled" to true,
# then implement the matching adapter in fishing/checkout.js (interface documented there).
PAYMENT = {
    "provider": None,
    "currency": "EGP",
    "checkout_enabled": False,
    "note": "No digital payment method yet. Checkout falls back to a WhatsApp order. "
            "Priced products are checkout_ready and need no data changes when a provider is added.",
}


def load_and_validate():
    errors, products, seen = [], [], set()
    with SRC.open(newline="", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f), start=2):
            sku = (row.get("sku") or "").strip()
            name = (row.get("name") or "").strip()
            price_raw = (row.get("price_egp") or "").strip()
            if not sku:
                errors.append(f"line {i}: missing sku"); continue
            if sku in seen:
                errors.append(f"line {i}: duplicate sku {sku}"); continue
            seen.add(sku)
            if not name:
                errors.append(f"line {i} ({sku}): missing name"); continue
            price = None
            if price_raw:
                try:
                    price = float(price_raw)
                    if price == int(price):
                        price = int(price)
                    if price <= 0:
                        raise ValueError
                except ValueError:
                    errors.append(f"line {i} ({sku}): price_egp '{price_raw}' is not a positive number"); continue
                if not (row.get("price_source") or "").strip():
                    errors.append(f"line {i} ({sku}): priced product needs price_source"); continue
            products.append({
                "sku": sku,
                "name": name,
                "category": (row.get("category") or "GEAR").strip(),
                "spec": (row.get("spec") or "").strip(),
                "price_egp": price,
                "price_display": (f"EGP {price:,}" if price is not None else None),
                "price_source": (row.get("price_source") or "").strip() or None,
                "fb_url": (row.get("fb_url") or "").strip() or None,
                "in_stock": (row.get("in_stock") or "yes").strip().lower() == "yes",
                "checkout_ready": price is not None,
            })
    return products, errors


def main():
    products, errors = load_and_validate()
    if errors:
        print("PIPELINE FAILED:")
        for e in errors:
            print(" -", e)
        return 1
    priced = sum(1 for p in products if p["checkout_ready"])
    print(f"OK: {len(products)} products, {priced} priced / checkout-ready, {len(products) - priced} price-on-request")
    if "--check" in sys.argv:
        print("check only — products.json not written")
        return 0
    doc = {
        "schema": 2,
        "generated_from": "data/source_products.csv by pipeline/sync_products.py — do not edit by hand",
        "source": "Taweena fishing tackles — Facebook page scrape, 26 Nov 2026 (public posts/reels + page replies in comments). "
                  "Prices appear ONLY where the page itself published them.",
        "store": STORE,
        "payment": PAYMENT,
        "products": products,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
