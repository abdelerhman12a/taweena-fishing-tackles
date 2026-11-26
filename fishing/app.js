/* TAWEENA — fishing/index app
   Scroll-scrubbed hero (WebP frame sequence on <canvas>, GSAP ScrollTrigger + Lenis),
   with an all-keyframe MP4 scrub fallback if the frames are not present.
   Plus: rod ferrule reveal, depth-zone explorer, product grid, FAQ, WhatsApp form. */
(function () {
  "use strict";
  var WA = "201227347737";

  /* ---------- smooth scroll (Lenis) + GSAP ---------- */
  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis !== "undefined") {
      var lenis = new Lenis({ lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- header light/dark ---------- */
  var hdr = document.getElementById("hdr");
  function hdrCheck() {
    var light = false;
    document.querySelectorAll(".intro,.gallery,.collection,.faq,.ask").forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.top <= 40 && r.bottom > 40) light = true;
    });
    hdr.classList.toggle("light", light);
  }
  addEventListener("scroll", hdrCheck, { passive: true }); hdrCheck();

  /* ---------- hero: WebP sequence scrub ---------- */
  var FRAME_COUNT = 257, frames = [], framesReady = false, curFrame = -1;
  var canvas = document.getElementById("heroCanvas"), ctx = canvas.getContext("2d");
  var video = document.getElementById("heroVideo"), prog = document.getElementById("heroProg"), ui = document.getElementById("heroUi");
  var framePath = function (i) { return "../assets/hero/frames/frame_" + String(i + 1).padStart(4, "0") + ".webp"; };

  function draw(img) {
    var cw = canvas.width, ch = canvas.height, ir = img.width / img.height, cr = cw / ch, w, h, x, y;
    if (ir > cr) { h = ch; w = ch * ir; } else { w = cw; h = cw / ir; }
    x = (cw - w) / 2; y = (ch - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }
  function showFrame(i) {
    i = Math.max(0, Math.min(FRAME_COUNT - 1, i));
    if (i === curFrame) return;
    var img = frames[i];
    if (img && img.complete && img.naturalWidth) { curFrame = i; draw(img); }
  }
  function preload() {
    var first = new Image();
    first.onload = function () { framesReady = true; frames[0] = first; showFrame(0); };
    first.onerror = function () { /* frames missing -> video fallback */ video.style.display = "block"; canvas.style.display = "none"; framesReady = false; startVideoScrub(); };
    first.src = framePath(0);
    for (var i = 0; i < FRAME_COUNT; i++) {
      if (i === 0) continue;
      var im = new Image();
      im.src = framePath(i);           /* first ~30 paint fast (browser priority), rest stream in */
      frames[i] = im;
      if (i > 60) im.loading = "lazy";
    }
  }

  var heroState = { p: 0 };
  function heroApply() {
    var p = heroState.p;
    prog.style.width = (p * 100).toFixed(2) + "%";
    ui.style.opacity = String(1 - Math.min(1, p * 2.4));
    ui.style.transform = "translateY(" + (-p * 60) + "px)";
    if (framesReady) showFrame(Math.round(p * (FRAME_COUNT - 1)));
  }
  function startVideoScrub() {
    var apply = function () { if (video.duration) { try { video.currentTime = heroState.p * video.duration; } catch (e) {} } };
    if (hasGsap) gsap.ticker.add(apply);
  }

  if (hasGsap) {
    gsap.to(heroState, {
      p: 1, ease: "none",
      scrollTrigger: { trigger: "#heroScroll", start: "top top", end: "bottom bottom", scrub: 0.35, onUpdate: heroApply }
    });
  } else {
    addEventListener("scroll", function () {
      var el = document.getElementById("heroScroll"), r = el.getBoundingClientRect();
      heroState.p = Math.max(0, Math.min(1, -r.top / (el.offsetHeight - innerHeight)));
      heroApply();
    }, { passive: true });
  }
  preload();

  /* ---------- rod ferrule reveal ---------- */
  var rodState = { gap: 2 };
  var rodEl = document.getElementById("rod"), rodStateEl = document.getElementById("rodState");
  function rodApply() {
    rodEl.style.setProperty("--gap", rodState.gap.toFixed(1) + "px");
    rodStateEl.textContent = rodState.gap > 20 ? "FERRULE — OPEN · CHECK THE SEAT" : "FERRULE — SEATED";
  }
  if (hasGsap) {
    gsap.to(rodState, {
      gap: 46, ease: "none", onUpdate: rodApply,
      scrollTrigger: { trigger: ".rod-stage", start: "top 85%", end: "bottom 30%", scrub: 0.4 }
    });
    gsap.to(rodState, {
      gap: 2, ease: "none", onUpdate: rodApply,
      scrollTrigger: { trigger: ".rod-stage", start: "bottom 30%", end: "bottom -10%", scrub: 0.4 }
    });
  }

  /* ---------- depth-zone explorer ---------- */
  var stages = Array.prototype.slice.call(document.querySelectorAll(".dstage"));
  var jig = document.getElementById("jig"), dNow = document.getElementById("dNow"), depthPin = document.getElementById("depthPin");
  var depthState = { p: 0 };
  function depthApply() {
    var p = depthState.p;
    var idx = Math.min(2, Math.floor(p * 3));
    stages.forEach(function (s, i) { s.style.opacity = i === idx ? "1" : "0"; });
    jig.style.top = (14 + p * 62) + "%";
    jig.style.transform = "rotate(" + (p * 300) + "deg)";
    depthPin.style.background = "linear-gradient(180deg," +
      "rgb(" + Math.round(72 - p * 62) + "," + Math.round(214 - p * 165) + "," + Math.round(244 - p * 90) + ") 0%," +
      "rgb(" + Math.round(20 - p * 10) + "," + Math.round(147 - p * 98) + "," + Math.round(224 - p * 145) + ") 55%," +
      "#041e4d 100%)";
    dNow.textContent = "DEPTH " + Math.round(p * 55) + " M";
  }
  depthApply();
  if (hasGsap) {
    gsap.to(depthState, {
      p: 1, ease: "none", onUpdate: depthApply,
      scrollTrigger: { trigger: "#depths", start: "top top", end: "bottom bottom", scrub: 0.4 }
    });
  }

  /* ---------- products + branches (real page data) ---------- */
  function waLink(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }
  fetch("../data/products.json").then(function (r) { return r.json(); }).then(function (d) {
    WA = d.whatsapp || WA;
    document.getElementById("pgrid").innerHTML = d.products.map(function (p) {
      return '<article class="pcard"><div class="tag">' + p.tag + '</div><h3>' + p.name + '</h3><p>' + p.spec + '</p>' +
        '<div class="row"><span class="price">' + (p.price ? p.price : "PRICE ON WHATSAPP") + '</span>' +
        '<a class="ask" target="_blank" rel="noopener" href="' + waLink("Hi Taweena — what is the price of: " + p.name + "?") + '">ASK ↗</a></div></article>';
    }).join("");
    document.getElementById("srcnote").textContent = "Source: " + d.source;
    document.getElementById("branchGrid").innerHTML = d.branches.map(function (b) {
      return '<div class="branch"><b>' + b.name.toUpperCase() + '</b><p>' + b.detail + '<br><a href="tel:+20' + b.phone.slice(1) + '">' +
        b.phone.replace(/(\d{4})(\d{4})(\d{3})/, "$1 $2 $3") + '</a> · <a target="_blank" rel="noopener" href="' +
        waLink("Hi Taweena " + b.name + " — I have a question about fishing tackle.") + '">WHATSAPP ↗</a></p></div>';
    }).join("");
  }).catch(function () {
    document.getElementById("srcnote").textContent = "Product data could not be loaded — see the Taweena Facebook page for the latest stock.";
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".fitem button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.parentElement, ans = item.querySelector(".ans"), open = item.classList.contains("open");
      document.querySelectorAll(".fitem.open").forEach(function (o) { o.classList.remove("open"); o.querySelector(".ans").style.maxHeight = "0"; });
      if (!open) { item.classList.add("open"); ans.style.maxHeight = ans.scrollHeight + "px"; }
    });
  });

  /* ---------- consultation form -> WhatsApp ---------- */
  document.getElementById("askForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("fName").value.trim(),
        water = document.getElementById("fWater").value,
        msg = document.getElementById("fMsg").value.trim();
    var text = "Hi Taweena — " + (name ? "I am " + name + ". " : "") +
      (water ? "I fish: " + water + ". " : "") + (msg || "What gear do you recommend?");
    window.open(waLink(text), "_blank", "noopener");
  });
})();
