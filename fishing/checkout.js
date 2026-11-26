/* TAWEENA checkout — payment-provider adapter layer.
 *
 * Today: payment.provider is null in data/products.json, so checkout builds the
 * order and hands it to WhatsApp (the shop's working sales channel).
 *
 * When Taweena adds a digital payment method:
 *   1. Set payment.provider + payment.checkout_enabled in pipeline/sync_products.py
 *      and re-run the pipeline.
 *   2. Implement the matching adapter below. Interface:
 *        createSession(order) -> Promise<{ redirect_url }>
 *      order = { items: [{ sku, name, qty, unit_price_egp }], total_egp, currency: "EGP" }
 *      The adapter should POST the order to YOUR server endpoint, which holds the
 *      provider API keys (keys never live in this static site) and returns the
 *      provider checkout URL to redirect to.
 *   Nothing else in the site changes — priced products are already checkout_ready.
 */
(function () {
  "use strict";

  var adapters = {
    paymob: {
      createSession: function (order) {
        return fetch("/api/checkout/paymob", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }).then(function (r) { return r.json(); });
      }
    },
    stripe: {
      createSession: function (order) {
        return fetch("/api/checkout/stripe", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }).then(function (r) { return r.json(); });
      }
    },
    fawry: {
      createSession: function (order) {
        return fetch("/api/checkout/fawry", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order)
        }).then(function (r) { return r.json(); });
      }
    }
  };

  function checkout(order, payment, whatsapp) {
    if (payment && payment.checkout_enabled && payment.provider && adapters[payment.provider]) {
      return adapters[payment.provider].createSession(order).then(function (s) {
        if (s && s.redirect_url) { location.href = s.redirect_url; return { mode: "payment", provider: payment.provider }; }
        throw new Error("no redirect_url from checkout endpoint");
      });
    }
    /* Fallback (today): itemised WhatsApp order to the shop. */
    var lines = order.items.map(function (i) {
      return "• " + i.name + " (" + i.sku + ") x" + i.qty + " — EGP " + (i.unit_price_egp * i.qty).toLocaleString();
    });
    var text = "Hi Taweena — I would like to order:\n" + lines.join("\n") +
      "\nTotal: EGP " + order.total_egp.toLocaleString() + "\nName: \nBranch / delivery: ";
    window.open("https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    return Promise.resolve({ mode: "whatsapp" });
  }

  window.TaweenaCheckout = { checkout: checkout, adapters: Object.keys(adapters) };
})();
