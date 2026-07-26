/* ==========================================================================
   Packetcat InfoSec — shared behaviour
   Everything here is optional polish. If JavaScript is off, every page still
   reads and works normally.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Status-line clock
     --------------------------------------------------------------------- */
  var clock = document.querySelector("[data-clock]");
  if (clock) {
    var tick = function () {
      var now = new Date();
      var pad = function (n) { return n < 10 ? "0" + n : String(n); };
      clock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------------
     Hero command typing
     The full command is already in the HTML, so it is readable without JS.
     --------------------------------------------------------------------- */
  var cmd = document.querySelector("[data-type]");
  if (cmd && !reduceMotion) {
    var full = cmd.getAttribute("data-type");
    var out = cmd.querySelector(".text");
    var caret = cmd.querySelector(".caret");
    if (out) {
      out.textContent = "";
      var i = 0;
      var step = function () {
        out.textContent = full.slice(0, i);
        i += 1;
        if (i <= full.length) {
          setTimeout(step, 42);
        } else if (caret) {
          setTimeout(function () { caret.style.display = "none"; }, 900);
        }
      };
      setTimeout(step, 260);
    }
  }

  /* ---------------------------------------------------------------------
     Red team / blue team picker
     --------------------------------------------------------------------- */
  var teams = document.querySelector("[data-teams]");
  if (teams) {
    var copy = {
      red: {
        title: "Red team — the attacker",
        text: "Plays the role of a bad actor, without the malicious intent. Red teamers run simulated attacks against an organisation's systems, find the gaps a real attacker would use, and report exactly how they got in so those gaps can be closed."
      },
      blue: {
        title: "Blue team — the defender",
        text: "Holds the line on confidentiality, integrity and availability. Blue teamers watch the network for suspicious activity, respond when something looks wrong, and keep the organisation compliant with the standards it has to meet."
      }
    };

    var title = teams.querySelector("[data-team-title]");
    var text = teams.querySelector("[data-team-text]");
    var buttons = teams.querySelectorAll(".team-btn");

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-value");

        Array.prototype.forEach.call(buttons, function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });

        teams.setAttribute("data-team", value);
        title.textContent = copy[value].title;
        text.textContent = copy[value].text;
      });
    });
  }
})();
