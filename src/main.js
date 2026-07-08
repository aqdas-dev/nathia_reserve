// The Nathia Reserve — scroll interactions
// - Lenis smooth scrolling (Locomotive-style momentum)
// - IntersectionObserver reveal-on-scroll with stagger
// - Subtle hero parallax
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Split headings into line-mask spans ----------
  function initSplitHeadings() {
    document.querySelectorAll("[data-split]").forEach(function (el) {
      var base = parseInt(el.getAttribute("data-reveal-delay"), 10) || 0;
      var lines = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = "";
      lines.forEach(function (line, i) {
        var mask = document.createElement("span");
        mask.className = "line-mask";
        var inner = document.createElement("span");
        inner.className = "line-inner";
        inner.innerHTML = line.trim();
        inner.style.setProperty("--line-delay", base + i * 90 + "ms");
        mask.appendChild(inner);
        el.appendChild(mask);
      });
    });
  }

  // ---------- Reveal on scroll ----------
  function initReveals() {
    var els = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal], [data-split], [data-wipe]")
    );

    // Stagger: children of a [data-reveal-stagger] group get incremental delays.
    document.querySelectorAll("[data-reveal-stagger]").forEach(function (group) {
      var step = parseInt(group.getAttribute("data-reveal-stagger"), 10) || 90;
      group.querySelectorAll("[data-reveal]").forEach(function (el, i) {
        el.style.setProperty("--reveal-delay", i * step + "ms");
      });
    });

    // Explicit per-element delays.
    els.forEach(function (el) {
      var d = el.getAttribute("data-reveal-delay");
      if (d) el.style.setProperty("--reveal-delay", d + "ms");
    });

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    els.forEach(function (el) { io.observe(el); });
  }

  // ---------- Smooth scroll + parallax ----------
  function initSmooth() {
    if (reduceMotion || typeof window.Lenis === "undefined") return;

    var lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Hero parallax: image zooms slightly, content drifts up and fades.
    var heroImg = document.querySelector("[data-parallax-hero]");
    var heroContent = document.querySelector("[data-parallax-content]");
    lenis.on("scroll", function (e) {
      var h = window.innerHeight || 1;
      var p = Math.min(e.scroll / h, 1);
      if (heroImg) heroImg.style.transform = "scale(" + (1 + p * 0.12) + ")";
      if (heroContent) {
        heroContent.style.transform = "translate3d(0," + p * 40 + "px,0)";
        heroContent.style.opacity = String(1 - p * 0.55);
      }
    });

    // In-page anchor links scroll smoothly (ignore bare "#").
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href");
      if (id && id.length > 1) {
        a.addEventListener("click", function (ev) {
          ev.preventDefault();
          lenis.scrollTo(id, { offset: 0 });
        });
      }
    });
  }

  // ---------- Contact form → Google Sheet (Apps Script Web App) ----------
  // Paste the deployed Web App URL here (see google-apps-script.gs for setup).
  var FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbz1_nzCJzvip2FtYKLF1Nzd6-28NkojeenEXiTlGM6N6faDUeeQxQ1qG7prDyAmfZphvw/exec";

  function initForm() {
    var form = document.getElementById("lets-talk-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var button = form.querySelector('button[type="submit"]');

    function setStatus(msg, color) {
      if (!status) return;
      status.textContent = msg;
      status.style.color = color || "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (FORM_ENDPOINT.indexOf("http") !== 0) {
        setStatus("Form endpoint not configured yet.", "#b91c1c");
        return;
      }

      var label = button ? button.textContent : "";
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      setStatus("", "");

      // URLSearchParams => application/x-www-form-urlencoded (a "simple" request,
      // so no CORS preflight). Apps Script reads these via e.parameter.
      fetch(FORM_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(new FormData(form)),
      })
        .then(function () {
          form.reset();
          setStatus("Thank you — we'll be in touch shortly.", "#15803d");
        })
        .catch(function () {
          setStatus("Something went wrong. Please try again.", "#b91c1c");
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = label; }
        });
    });
  }

  // ---------- Scroll-driven FX: progress bar + image parallax ----------
  function initScrollFX() {
    var bar = document.getElementById("scroll-progress");
    var parallax = reduceMotion
      ? []
      : Array.prototype.slice.call(document.querySelectorAll("[data-parallax-img]"));
    if (!bar && !parallax.length) return;

    var vh = window.innerHeight || 1;
    var ticking = false;

    function update() {
      ticking = false;

      if (bar) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var p = max > 0 ? doc.scrollTop / max : 0;
        bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      }

      for (var i = 0; i < parallax.length; i++) {
        var el = parallax[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue; // skip offscreen
        var delta = (r.top + r.height / 2 - vh / 2) / vh; // ~ -0.5 .. 0.5
        var y = (delta * 48).toFixed(2); // px of drift
        el.style.transform = "translate3d(0," + y + "px,0) scale(1.14)";
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      vh = window.innerHeight || 1;
      update();
    });
    update();
  }

  function boot() {
    try {
      initForm();
    } catch (err) {
      /* form enhancement is optional */
    }
    try {
      initSplitHeadings();
    } catch (err) {
      /* headings stay as-is if splitting fails */
    }
    try {
      initReveals();
    } catch (err) {
      // Failsafe: never leave content hidden.
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
    try {
      initSmooth();
    } catch (err) {
      /* smooth scroll is a progressive enhancement — ignore */
    }
    try {
      initScrollFX();
    } catch (err) {
      /* progress bar / parallax are progressive enhancements — ignore */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
