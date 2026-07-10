// The Nathia Reserve — interactions
// (Animations will be added in a later phase per the client's guidelines.)
(function () {
  "use strict";

  // ---------- Waitlist form -> Google Sheet (Apps Script Web App) ----------
  var FORM_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbz1_nzCJzvip2FtYKLF1Nzd6-28NkojeenEXiTlGM6N6faDUeeQxQ1qG7prDyAmfZphvw/exec";

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

  // ---------- Intro: play the reception video only while hovered ----------
  // The centred-heading -> [heading | video] morph is pure CSS (:hover). JS just
  // plays the muted video on hover and pauses it on leave (saves it running
  // off-screen / before the user ever interacts).
  function initIntroVideo() {
    var inner = document.querySelector("#intro .intro-inner");
    if (!inner) return;
    var video = inner.querySelector("video");
    if (!video) return;

    inner.addEventListener("mouseenter", function () {
      try { var p = video.play(); if (p) p.catch(function () {}); } catch (e) {}
    });
    inner.addEventListener("mouseleave", function () {
      try { video.pause(); } catch (e) {}
    });
  }

  function boot() {
    try { initForm(); } catch (err) { /* form is a progressive enhancement */ }
    try { initIntroVideo(); } catch (err) { /* intro video is optional */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
