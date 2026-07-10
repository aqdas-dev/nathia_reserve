// The Nathia Reserve — interactions
// (Animations will be added in a later phase per the client's guidelines.)
(function () {
  "use strict";

  // ---------- Waitlist form -> Google Sheet (Apps Script Web App) ----------
  var FORM_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzYcYqBJr9nGtFVQ-e8t2EelsHtoGsoeEpelXKYDZqIzw4M2R6tZbwb7CjRjw-yzJLBaw/exec";

  function initForm() {
    var form = document.getElementById("waitlist-form");
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

      var label = button ? button.textContent : "";
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      setStatus("", "");

      // URLSearchParams => x-www-form-urlencoded (simple request, no CORS preflight).
      fetch(FORM_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(new FormData(form)),
      })
        .then(function () {
          form.reset();
          setStatus("Thank you — you're on the waitlist. We'll be in touch.", "#15803d");
        })
        .catch(function () {
          setStatus("Something went wrong. Please try again.", "#b91c1c");
        })
        .then(function () {
          if (button) { button.disabled = false; button.textContent = label; }
        });
    });
  }

  // ---------- Intro video ----------
  // The reveal morph is pure CSS (:hover on desktop). The <video> is muted +
  // autoplay + loop + playsinline, so it plays on touch (where it's always
  // visible). BUT Safari / Chrome power-saving often refuse to autoplay a video
  // that's hidden (opacity:0 until hover) — so on hover we also call play() to
  // guarantee it's running when revealed. We only ever play() (never pause), so
  // touch devices are unaffected.
  function initIntroVideo() {
    var inner = document.querySelector("#intro .intro-inner");
    if (!inner) return;
    var video = inner.querySelector("video");
    if (!video) return;
    function play() {
      try { var p = video.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
    inner.addEventListener("mouseenter", play);
    inner.addEventListener("pointerenter", play);
  }

  function boot() {
    try { initForm(); } catch (err) { /* form is a progressive enhancement */ }
    try { initIntroVideo(); } catch (err) { /* intro video is a progressive enhancement */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
