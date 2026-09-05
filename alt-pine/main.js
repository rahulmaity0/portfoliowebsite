/* Current year in the footer, and a nav link that tracks the section in view. */
(function () {
  "use strict";

  var year = document.getElementById("year");
  if (year) { year.textContent = String(new Date().getFullYear()); }

  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute("href")); })
    .filter(Boolean);

  if (!sections.length || !("IntersectionObserver" in window)) { return; }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) { return; }
      links.forEach(function (link) {
        link.classList.toggle("is-current", link.getAttribute("href") === "#" + entry.target.id);
      });
    });
  }, { rootMargin: "-25% 0px -65% 0px" });

  sections.forEach(function (section) { observer.observe(section); });
})();
