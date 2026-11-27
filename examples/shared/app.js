(() => {
  "use strict";

  const root = document.documentElement;
  const STORE = "kbl-theme";

  /* ---------------- theme ---------------- */
  const themeButtons = Array.from(document.querySelectorAll("[data-theme-toggle]"));

  function paintTheme(theme) {
    const dark = theme === "dark";
    root.dataset.theme = theme;
    themeButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.title = dark ? "Light mode" : "Dark mode";
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0b0f12" : "#fbfaf7");
  }

  const saved = (() => {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  })();
  const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  paintTheme(saved || (systemDark ? "dark" : "light"));

  themeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      paintTheme(next);
      try { localStorage.setItem(STORE, next); } catch (e) { /* ignore */ }
    });
  });

  /* ---------------- lightbox ---------------- */
  const links = Array.from(document.querySelectorAll("a[data-lightbox]"));
  if (links.length) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image viewer");
    overlay.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close image viewer">&times;</button>' +
      '<figure class="lightbox__figure"><img alt=""><figcaption class="lightbox__caption"></figcaption></figure>';
    document.body.appendChild(overlay);

    const img = overlay.querySelector("img");
    const cap = overlay.querySelector(".lightbox__caption");
    let lastFocus = null;

    function open(link) {
      lastFocus = document.activeElement;
      const inner = link.querySelector("img");
      img.src = link.getAttribute("href");
      img.alt = inner ? inner.alt : "";
      cap.textContent = inner ? inner.alt : "";
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
      overlay.querySelector(".lightbox__close").focus();
    }

    function close() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
      img.src = "";
      if (lastFocus) lastFocus.focus();
    }

    links.forEach((link) => {
      link.addEventListener("click", (ev) => {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
        ev.preventDefault();
        open(link);
      });
    });

    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay || ev.target.closest(".lightbox__close")) close();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  /* ---------------- search + label filter ---------------- */
  const search = document.querySelector("[data-search]");
  const cards = Array.from(document.querySelectorAll("[data-post-card]"));
  const chips = Array.from(document.querySelectorAll("[data-chip]"));
  const count = document.querySelector("[data-result-count]");
  const empty = document.querySelector("[data-empty]");

  if (search || chips.length) {
    let activeLabel = "all";
    const params = new URLSearchParams(location.search);
    if (params.get("label")) activeLabel = params.get("label");

    chips.forEach((chip) => {
      const label = chip.dataset.chip;
      chip.classList.toggle("is-active", label === activeLabel);
      chip.setAttribute("aria-pressed", String(label === activeLabel));
      chip.addEventListener("click", (ev) => {
        ev.preventDefault();
        activeLabel = label;
        chips.forEach((c) => {
          const on = c.dataset.chip === label;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", String(on));
        });
        apply();
        syncUrl();
      });
    });

    const normalize = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

    function apply() {
      const q = normalize(search ? search.value.trim() : "");
      let visible = 0;
      cards.forEach((card) => {
        const labels = (card.dataset.labels || "").split(/\s+/);
        const hay = normalize(card.dataset.title + " " + (card.dataset.text || ""));
        const okLabel = activeLabel === "all" || labels.includes(activeLabel);
        const okQuery = !q || hay.includes(q);
        const show = okLabel && okQuery;
        card.hidden = !show;
        if (show) visible++;
      });
      if (count) count.innerHTML = "<strong>" + visible + "</strong> " + (visible === 1 ? "note" : "notes");
      if (empty) empty.hidden = visible !== 0;
    }

    function syncUrl() {
      const url = new URL(location.href);
      if (activeLabel === "all") url.searchParams.delete("label");
      else url.searchParams.set("label", activeLabel);
      const q = search ? search.value.trim() : "";
      if (q) url.searchParams.set("q", q);
      else url.searchParams.delete("q");
      history.replaceState(null, "", url);
    }

    if (search) {
      const initialQ = params.get("q");
      if (initialQ) search.value = initialQ;
      search.addEventListener("input", () => { apply(); syncUrl(); });
      document.addEventListener("keydown", (ev) => {
        if (ev.key === "/" && document.activeElement !== search && !/input|textarea|select/i.test(document.activeElement.tagName)) {
          ev.preventDefault();
          search.focus();
        }
      });
    }
    apply();
  }

  /* ---------------- concept dock ---------------- */
  const dockEl = document.querySelector("[data-dock]");
  if (dockEl) {
    const dockBtn = dockEl.querySelector("[data-dock-toggle]");
    const setOpen = (open) => {
      dockEl.dataset.open = String(open);
      dockBtn.setAttribute("aria-expanded", String(open));
    };
    dockBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      setOpen(dockEl.dataset.open !== "true");
    });
    document.addEventListener("click", (ev) => {
      if (dockEl.dataset.open === "true" && !dockEl.contains(ev.target)) setOpen(false);
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && dockEl.dataset.open === "true") {
        setOpen(false);
        dockBtn.focus();
      }
    });
  }

  /* ---------------- reading progress ---------------- */
  const bar = document.querySelector("[data-progress]");
  const article = document.querySelector("[data-article]");
  if (bar && article) {
    const update = () => {
      const start = article.offsetTop - 100;
      const total = article.offsetHeight;
      const pct = Math.min(100, Math.max(0, ((window.scrollY - start) / total) * 100));
      bar.style.width = pct + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------------- reveal on scroll ---------------- */
  const reveals = Array.from(document.querySelectorAll("[data-reveal]"));
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }
})();
