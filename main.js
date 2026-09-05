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

  /* ── Conway's Game of Life ─────────────────────────────────────────────
     Seeded at random, stepped every 180ms. Reseeds when the board settles
     into still lifes and blinkers, which it always eventually does.
     ------------------------------------------------------------------- */
  var canvas = document.getElementById("life");
  if (!canvas || !canvas.getContext) { return; }
  var ctx = canvas.getContext("2d");

  var CELL = 14, STEP = 190, DENSITY = 0.22, MAX_GEN = 600, STALE = 14;
  var W = 0, H = 0, cols = 0, rows = 0;
  var board = [], gen = 0, lastStep = 0, sums = [], stale = 0;
  var still = null;

  function token(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  function seed() {
    board = new Array(cols * rows);
    for (var i = 0; i < board.length; i++) { board[i] = Math.random() < DENSITY ? 1 : 0; }
    gen = 0; sums = []; stale = 0;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var nc = Math.max(12, Math.floor(W / CELL));
    var nr = Math.max(6, Math.floor((H - 22) / CELL));
    if (nc !== cols || nr !== rows) { cols = nc; rows = nr; seed(); }
  }

  /* one generation, wrapping at the edges so gliders leave and come back */
  function step() {
    var next = new Array(cols * rows), sum = 0;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var n = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) { continue; }
            n += board[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)];
          }
        }
        var alive = board[y * cols + x];
        var live = (alive && (n === 2 || n === 3)) || (!alive && n === 3) ? 1 : 0;
        next[y * cols + x] = live;
        if (live) { sum += (x * 7 + y * 13 + 1); }
      }
    }
    board = next; gen++;

    /* a repeated checksum means still lifes and blinkers — time to reseed */
    stale = sums.indexOf(sum) !== -1 ? stale + 1 : 0;
    sums.push(sum);
    if (sums.length > 6) { sums.shift(); }
    if (stale > STALE || gen > MAX_GEN) { seed(); }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var pad = Math.max(0, (W - cols * CELL) / 2);
    ctx.fillStyle = token("--accent");
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        if (board[y * cols + x]) {
          ctx.fillRect(pad + x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }
    ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = token("--muted");
    var g = String(gen); while (g.length < 3) { g = "0" + g; }
    ctx.fillText("generation " + g, pad + 1, H - 8);
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  still = function () { resize(); draw(); };

  function loop(now) {
    if (now - lastStep > STEP) { lastStep = now; step(); draw(); }
    requestAnimationFrame(loop);
  }

  function start() {
    resize();
    if (reduced.matches) { for (var i = 0; i < 4; i++) { step(); } draw(); }
    else { requestAnimationFrame(loop); }
  }

  window.addEventListener("resize", function () {
    resize();
    if (reduced.matches) { draw(); }
  });

  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start); } else { start(); }
})();
