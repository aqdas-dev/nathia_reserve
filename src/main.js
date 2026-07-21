// The Nathia Reserve — interactions
// Ported from the reference design and rebuilt for our stack. All effects are
// progressive enhancements: with JS off, `html.no-js` rules reveal everything
// and the page is fully readable.
(function () {
  "use strict";

  // ---------- CONFIG ----------
  // Lead backend: our Google Apps Script web app (see google-apps-script.gs).
  // It reads x-www-form-urlencoded params, so we post with URLSearchParams and
  // mode:'no-cors' (a JSON body / custom headers would trigger a CORS preflight
  // that Apps Script rejects). The response is opaque, so we treat a resolved
  // fetch as success and only surface an error on a hard network failure.
  var FORM_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzYcYqBJr9nGtFVQ-e8t2EelsHtoGsoeEpelXKYDZqIzw4M2R6tZbwb7CjRjw-yzJLBaw/exec";

  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return [].slice.call((ctx || document).querySelectorAll(sel)); }

  // ---------- preloader ----------
  // Storage access is wrapped: in-app browsers (WhatsApp/Instagram) can block it.
  (function () {
    var l = document.getElementById("loader");
    if (!l) return;
    var seen = false;
    try { seen = !!sessionStorage.getItem("nr_seen"); sessionStorage.setItem("nr_seen", "1"); } catch (e) {}
    if (reduceMotion || seen) { l.style.display = "none"; return; }
    var done = function () { l.classList.add("done"); };
    window.addEventListener("load", function () { setTimeout(done, 400); });
    setTimeout(done, 1900); // hard cap even if `load` never fires
  })();

  // ---------- reveal on scroll ----------
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  $all(".reveal, .reveal-clip, .lines").forEach(function (el) { io.observe(el); });

  // ---------- number count-up ----------
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, target = +el.getAttribute("data-count"), t0 = null;
      if (reduceMotion) { el.textContent = target.toLocaleString("en"); return; }
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1400);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * p).toLocaleString("en");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $all("[data-count]").forEach(function (el) { cio.observe(el); });

  // ---------- band / chapter videos: native autoplay + loop, for everyone ----------
  // Looping is owned by the HTML `autoplay muted loop playsinline` attributes so
  // it is bulletproof across browsers. JS only (a) resumes if something external
  // ever pauses the clip (tab switch, OS media key) so it always loops while the
  // user is on the page, and (b) fades each clip in once it's actually playing.
  var bandVids = $all("video.bandvid");
  function kick(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  bandVids.forEach(function (v) {
    kick(v);
    v.addEventListener("loadeddata", function () { kick(v); });
    v.addEventListener("canplay", function () { kick(v); });
    // native `loop` never fires pause on its own — a pause here is external
    // (tab switch, OS media key), so resume unless the tab is actually hidden.
    v.addEventListener("pause", function () { if (!document.hidden) kick(v); });
    // fade in only once real frames are decoding (not just loaded)
    v.addEventListener("playing", function () { v.classList.add("playing"); });
  });
  // Some browsers only allow muted autoplay once the element is in the viewport.
  if ("IntersectionObserver" in window) {
    var pvo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) kick(e.target); });
    }, { threshold: 0.05 });
    bandVids.forEach(function (v) { pvo.observe(v); });
  }
  // First user gesture unlocks any gesture-gated autoplay policy.
  var unlock = function () { bandVids.forEach(kick); };
  ["pointerdown", "touchstart", "scroll", "keydown"].forEach(function (e) {
    window.addEventListener(e, unlock, { once: true, passive: true });
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) bandVids.forEach(kick); });

  // hero video pause offscreen too
  (function () {
    var hv = document.getElementById("heroVideo");
    if (!hv) return;
    hv.addEventListener("playing", function () { hv.classList.add("playing"); });
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { hv.play().catch(function () {}); } else { hv.pause(); }
    }, { threshold: 0.05 }).observe(hv);
  })();

  // ---------- sticky mobile CTA: show after hero, hide at form ----------
  (function () {
    var sticky = document.getElementById("stickyCta");
    var hero = $(".hero");
    var reg = document.getElementById("register");
    if (!sticky || !hero || !reg) return;
    var pastHero = false, atForm = false;
    function sync() { sticky.classList.toggle("show", pastHero && !atForm); }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; sync(); }, { threshold: 0.05 }).observe(hero);
    new IntersectionObserver(function (es) { atForm = es[0].isIntersecting; sync(); }, { threshold: 0.12 }).observe(reg);
  })();

  // ---------- mobile menu ----------
  (function () {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;
    function setOpen(open) {
      toggle.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    }
    toggle.addEventListener("click", function () { setOpen(!menu.classList.contains("open")); });
    // any link tap closes the menu (and lets the anchor jump run)
    $all("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) setOpen(false);
    });
  })();

  // ---------- lightbox (rail images) ----------
  (function () {
    var lb = document.getElementById("lb"), lbImg = document.getElementById("lbImg");
    if (!lb || !lbImg) return;
    $all(".rail .ri img").forEach(function (im) {
      im.parentElement.addEventListener("click", function () { lbImg.src = im.src; lb.classList.add("show"); });
    });
    lb.addEventListener("click", function () { lb.classList.remove("show"); lbImg.src = ""; });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("show")) { lb.classList.remove("show"); lbImg.src = ""; }
    });
  })();

  // ---------- pause the gallery marquee only while the pointer is over the
  // image row itself (not the heading / surrounding whitespace) ----------
  (function () {
    var rail = document.getElementById("rail");
    if (!rail) return;
    rail.addEventListener("mouseenter", function () { rail.classList.add("is-paused"); });
    rail.addEventListener("mouseleave", function () { rail.classList.remove("is-paused"); });
  })();

  // ---------- SCROLL ENGINE: progress bar, nav, parallax ----------
  // (The gallery rail now runs as a pure-CSS marquee and the journey is a
  //  self-driven carousel — neither is scroll-linked any more.)
  (function () {
    var nav = document.getElementById("nav");
    var progressBar = $("#progress i");
    var plxEls = $all("[data-plx]");
    var vh = innerHeight, docH = 1;

    function measure() { vh = innerHeight; docH = document.documentElement.scrollHeight - vh; }
    measure();
    addEventListener("resize", measure);

    function frame() {
      var y = scrollY;
      if (progressBar) progressBar.style.transform = "scaleX(" + clamp(y / docH, 0, 1) + ")";
      if (nav) nav.classList.toggle("scrolled", y > 40);

      if (!reduceMotion) {
        for (var i = 0; i < plxEls.length; i++) {
          var el = plxEls[i], r = el.parentElement.getBoundingClientRect();
          if (r.bottom < -80 || r.top > vh + 80) continue;
          var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
          el.style.transform = "translateY(" + (-p * parseFloat(el.getAttribute("data-plx")) * 100) + "px)";
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  // ---------- journey carousel (auto-advancing; dot + arrow controls) ----------
  (function () {
    var journey = document.getElementById("journey");
    if (!journey) return;
    var slides = $all(".jslide", journey);
    var caps = $all(".jcap", journey);
    var dots = $all("[data-jd]", journey);
    var arrows = $all("[data-jarrow]", journey);
    if (slides.length < 2) return;
    var n = slides.length, idx = 0, timer = null;

    function paint() {
      slides.forEach(function (s, k) { s.classList.toggle("on", k === idx); });
      caps.forEach(function (c, k) { c.classList.toggle("on", k === idx); });
      dots.forEach(function (d, k) { d.classList.toggle("on", k === idx); });
    }
    function go(i) { idx = (i % n + n) % n; paint(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { if (reduceMotion) return; stop(); timer = setInterval(function () { go(idx + 1); }, 5000); }
    function nudge(i) { go(i); start(); }

    dots.forEach(function (d, k) { d.addEventListener("click", function () { nudge(k); }); });
    arrows.forEach(function (a) { a.addEventListener("click", function () { nudge(idx + (+a.getAttribute("data-jarrow") || 1)); }); });
    // Pause only when the pointer is over the controls, so the auto-advance
    // keeps running while the (full-screen) image is hovered.
    $all(".jdots, .jarrow", journey).forEach(function (el) {
      el.addEventListener("mouseenter", stop);
      el.addEventListener("mouseleave", start);
    });
    // Pause while the tab is hidden; resume on return.
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

    go(0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.25 }).observe(journey);
    } else { start(); }
  })();

  // ---------- register form -> Google Sheet ----------
  (function () {
    var form = document.getElementById("regForm");
    if (!form) return;
    var btn = document.getElementById("submitBtn");
    var err = document.getElementById("formError");

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (err) err.classList.remove("show");

      var name = form.name.value.trim();
      var phone = form.whatsapp.value.trim();
      var email = form.email.value.trim();
      var city = form.city.value.trim();

      if (!name) { form.name.focus(); return; }
      if (!phone || phone.replace(/\D/g, "").length < 9) { form.whatsapp.focus(); return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { form.email.focus(); return; }
      if (!city) { form.city.focus(); return; }
      if (!form.interested_in.value) { form.interested_in.focus(); return; }
      if (form._honey.value) { return; } // honeypot tripped — silently drop

      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      // Map to the field names our deployed Apps Script reads.
      var body = new URLSearchParams();
      body.set("FirstName", name);
      body.set("LastName", "");
      body.set("Phone", phone);
      body.set("Email", email);
      body.set("City", city);
      body.set("Category", form.interested_in.value);
      body.set("Message", "Source: thenathiareserve.com · Page: " + location.href);

      fetch(FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: body })
        .then(function () {
          var fb = document.getElementById("formBlock");
          var sb = document.getElementById("successBlock");
          if (fb) fb.style.display = "none";
          if (sb) sb.classList.add("show");
        })
        .catch(function () {
          if (err) err.classList.add("show");
          if (btn) { btn.disabled = false; btn.textContent = "Register Interest"; }
        });
    });
  })();
})();
