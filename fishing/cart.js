/* TAWEENA cart — priced products only (checkout_ready in data/products.json).
   Unpriced products keep the ASK-on-WhatsApp flow in app.js. */
(function () {
  "use strict";
  var KEY = "taweena_cart_v1", cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { cart = {}; }
  var catalog = {};   /* sku -> product, filled by app.js via TaweenaCart.register */
  var payment = null, whatsapp = "201227347737";

  var drawer, listEl, totalEl, countEls, payNote;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function items() {
    return Object.keys(cart).filter(function (sku) { return catalog[sku] && cart[sku] > 0; })
      .map(function (sku) {
        var p = catalog[sku];
        return { sku: sku, name: p.name, qty: cart[sku], unit_price_egp: p.price_egp };
      });
  }
  function total() { return items().reduce(function (s, i) { return s + i.qty * i.unit_price_egp; }, 0); }
  function count() { return items().reduce(function (s, i) { return s + i.qty; }, 0); }

  function render() {
    var its = items();
    countEls.forEach(function (el) { el.textContent = String(count()); el.style.display = count() ? "inline-block" : "none"; });
    if (!its.length) {
      listEl.innerHTML = '<p class="cart-empty">Your cart is empty — priced items can be added from the marketplace.</p>';
    } else {
      listEl.innerHTML = its.map(function (i) {
        return '<div class="cline"><div class="cinfo"><b>' + i.name + '</b><span>EGP ' + i.unit_price_egp.toLocaleString() + '</span></div>' +
          '<div class="cqty"><button data-dec="' + i.sku + '" aria-label="decrease">−</button><span>' + i.qty + '</span>' +
          '<button data-inc="' + i.sku + '" aria-label="increase">+</button></div>' +
          '<div class="csum">EGP ' + (i.qty * i.unit_price_egp).toLocaleString() + '</div></div>';
      }).join("");
    }
    totalEl.textContent = "EGP " + total().toLocaleString();
    payNote.textContent = (payment && payment.checkout_enabled && payment.provider)
      ? "Secure checkout via " + payment.provider.toUpperCase()
      : "Digital payment coming soon — checkout opens WhatsApp with your order ready to send.";
    save();
  }

  function open() { drawer.classList.add("open"); render(); }
  function close() { drawer.classList.remove("open"); }

  document.addEventListener("DOMContentLoaded", function () {
    drawer = document.getElementById("cartDrawer");
    listEl = document.getElementById("cartItems");
    totalEl = document.getElementById("cartTotal");
    payNote = document.getElementById("payNote");
    countEls = Array.prototype.slice.call(document.querySelectorAll(".cart-count"));
    document.querySelectorAll("[data-cart-open]").forEach(function (b) { b.addEventListener("click", open); });
    document.querySelectorAll("[data-cart-close]").forEach(function (b) { b.addEventListener("click", close); });
    listEl.addEventListener("click", function (e) {
      var inc = e.target.getAttribute("data-inc"), dec = e.target.getAttribute("data-dec");
      if (inc) cart[inc]++;
      if (dec) { cart[dec]--; if (cart[dec] <= 0) delete cart[dec]; }
      if (inc || dec) render();
    });
    document.getElementById("checkoutBtn").addEventListener("click", function () {
      var its = items();
      if (!its.length) return;
      var order = { items: its, total_egp: total(), currency: (payment && payment.currency) || "EGP" };
      window.TaweenaCheckout.checkout(order, payment, whatsapp).then(function (r) {
        if (r.mode === "whatsapp") { cart = {}; render(); }
      }).catch(function () { alert("Checkout could not start — please order on WhatsApp instead."); });
    });
    render();
  });

  /* Click delegation for ADD buttons rendered by app.js */
  document.addEventListener("click", function (e) {
    var sku = e.target.getAttribute && e.target.getAttribute("data-add");
    if (!sku) return;
    cart[sku] = (cart[sku] || 0) + 1;
    if (drawer) { render(); open(); } else { save(); }
  });

  window.TaweenaCart = {
    register: function (products, pay, wa) {
      products.forEach(function (p) { if (p.checkout_ready) catalog[p.sku] = p; });
      payment = pay || payment; if (wa) whatsapp = wa;
      if (listEl) render();
    }
  };
})();
