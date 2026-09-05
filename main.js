/* Theme toggle, footer year, nav highlighting, and the hero stream plot. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ── theme ─────────────────────────────────────────────────────────── */
  var btn = document.getElementById("theme");
  var glyph = btn ? btn.querySelector(".theme-glyph") : null;

  function readStored() { try { return localStorage.getItem("theme"); } catch (e) { return null; } }
  function writeStored(v) { try { localStorage.setItem("theme", v); } catch (e) { /* private mode */ } }
  function isLight() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") { return set === "light"; }
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  }
  function paintToggle() {
    if (!btn || !glyph) { return; }
    var light = isLight();
    glyph.textContent = light ? "☾" : "☀";
    btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    btn.setAttribute("aria-pressed", String(!light));
  }

  var stored = readStored();
  if (stored === "light" || stored === "dark") { root.setAttribute("data-theme", stored); }
  paintToggle();

  if (btn) {
    btn.addEventListener("click", function () {
      var next = isLight() ? "dark" : "light";
      root.setAttribute("data-theme", next);
      writeStored(next);
      paintToggle();
      if (still) { still(); }
    });
  }

  /* ── year + nav ────────────────────────────────────────────────────── */
  var year = document.getElementById("year");
  if (year) { year.textContent = String(new Date().getFullYear()); }

  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var targets = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if (targets.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (a) {
          a.classList.toggle("is-current", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-25% 0px -65% 0px" });
    targets.forEach(function (el) { spy.observe(el); });
  }

  /* ── stream plot ───────────────────────────────────────────────────────
     One topic, three partitions, events travelling producer → consumer.
     12s loop, deterministic from the clock so it never drifts.
     ------------------------------------------------------------------- */
  var canvas = document.getElementById("stream");
  if (!canvas || !canvas.getContext) { return; }
  var ctx = canvas.getContext("2d");

  var PERIOD = 12000, TRAVEL = 4200, SPACING = 800, LANES = 3;
  var COUNT = Math.round(PERIOD / SPACING);
  var W = 0, H = 0;
  var still = null;

  function token(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function laneY(i) { return H * 0.28 + i * (H * 0.22); }
  function geom() {
    return { x0: W * 0.13, xs: W * 0.50, x1: W * 0.87, ym: H * 0.50 };
  }

  function pointAt(u, lane) {
    var g = geom();
    if (u < 0.45) {
      return { x: g.x0 + (g.xs - g.x0) * (u / 0.45), y: g.ym };
    }
    var t = (u - 0.45) / 0.55;
    var fan = Math.min(1, t / 0.35);
    var ease = fan * fan * (3 - 2 * fan);
    return { x: g.xs + (g.x1 - g.xs) * t, y: g.ym + (laneY(lane) - g.ym) * ease };
  }

  function draw(t) {
    var g = geom();
    var cGrid = token("--grid"), cLine = token("--line-2");
    var cAccent = token("--accent"), cMuted = token("--muted");

    ctx.clearRect(0, 0, W, H);

    /* blueprint grid */
    ctx.strokeStyle = cGrid; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= W; x += 32) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (var y = 0; y <= H; y += 32) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();

    /* topic spine and partition lanes */
    ctx.strokeStyle = cLine; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.x0, g.ym); ctx.lineTo(g.xs, g.ym);
    ctx.stroke();

    for (var i = 0; i < LANES; i++) {
      var ly = laneY(i);
      ctx.beginPath();
      ctx.moveTo(g.xs, g.ym);
      ctx.bezierCurveTo(g.xs + (g.x1 - g.xs) * .35, g.ym, g.xs + (g.x1 - g.xs) * .35, ly, g.x1, ly);
      ctx.stroke();
      /* consumer bar */
      ctx.fillStyle = cLine;
      ctx.fillRect(g.x1, ly - 7, 2, 14);
    }

    /* producer block */
    ctx.fillStyle = cAccent;
    ctx.fillRect(g.x0 - 5, g.ym - 5, 10, 10);

    /* events in flight */
    for (var e = 0; e < COUNT; e++) {
      var age = ((t - e * SPACING) % PERIOD + PERIOD) % PERIOD;
      if (age > TRAVEL) { continue; }
      var u = age / TRAVEL;
      var p = pointAt(u, e % LANES);
      var fade = u > 0.92 ? (1 - u) / 0.08 : 1;
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = cAccent;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      ctx.globalAlpha = 1;
    }

    /* labels */
    ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = cMuted;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("producer", g.x0 - 5, g.ym - 14);
    ctx.fillText("topic", g.x0 + (g.xs - g.x0) / 2 - 14, g.ym - 14);
    for (var k = 0; k < LANES; k++) {
      ctx.fillText("p" + k, g.x1 + 8, laneY(k) + 3);
    }
    var offset = String(Math.floor(t / SPACING));
    while (offset.length < 3) { offset = "0" + offset; }
    ctx.fillText("committed offset " + offset, g.x0 - 5, H - 10);
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  still = function () { resize(); draw(PERIOD * 0.55); };

  function loop(now) {
    draw(now % PERIOD);
    requestAnimationFrame(loop);
  }

  function start() {
    resize();
    if (reduced.matches) { draw(PERIOD * 0.55); }
    else { requestAnimationFrame(loop); }
  }

  window.addEventListener("resize", function () {
    resize();
    if (reduced.matches) { draw(PERIOD * 0.55); }
  });

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start); } else { start(); }
})();
