(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#site-menu");
  const links = menu ? [...menu.querySelectorAll('a[href^="#"]')] : [];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const themeColors = {
    dark: "#0b0f19",
    light: "#f4f7fb",
  };

  const getTheme = () =>
    root.getAttribute("data-theme") === "light" ? "light" : "dark";

  const applyTheme = (theme) => {
    const next = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    try {
      localStorage.setItem("gpa-theme", next);
    } catch (_) {
      /* ignore */
    }
    if (themeMeta) themeMeta.setAttribute("content", themeColors[next]);
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        next === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  };

  applyTheme(getTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      applyTheme(getTheme() === "dark" ? "light" : "dark");
    });
  }

  const closeMenu = () => {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };

  const openMenu = () => {
    if (!menu || !toggle) return;
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      if (menu.classList.contains("is-open")) closeMenu();
      else openMenu();
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!menu.classList.contains("is-open")) return;
      if (
        menu.contains(event.target) ||
        toggle.contains(event.target) ||
        (themeToggle && themeToggle.contains(event.target))
      ) {
        return;
      }
      closeMenu();
    });
  }

  const setActive = () => {
    const offset = 96;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top - offset <= 0) current = section;
    }
    links.forEach((link) => {
      const match = current && link.getAttribute("href") === `#${current.id}`;
      link.classList.toggle("is-active", Boolean(match));
    });
  };

  window.addEventListener("scroll", setActive, { passive: true });
  setActive();

  const tip = document.querySelector("#badge-tooltip");
  const hits = [...document.querySelectorAll(".badge-hit")];
  let pinned = null;
  let current = null;

  const tipStatus = tip && tip.querySelector(".badge-tooltip__status");
  const tipTitle = tip && tip.querySelector(".badge-tooltip__title");
  const tipBody = tip && tip.querySelector(".badge-tooltip__body");

  const placeTip = (button) => {
    if (!tip) return;
    const rect = button.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const gap = 12;
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    let top = rect.top - tipRect.height - gap;
    const below = top < 80;
    if (below) top = rect.bottom + gap;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.setProperty("--arrow", `${rect.left + rect.width / 2 - left}px`);
    tip.classList.toggle("is-below", below);
  };

  const openTip = (button) => {
    if (!tip || !tipStatus || !tipTitle || !tipBody) return;
    current = button;
    tipStatus.textContent = button.dataset.tipStatus || "";
    tipStatus.className = `badge-tooltip__status pill pill-${button.dataset.tipKind || "active"}`;
    tipTitle.textContent = button.dataset.tipTitle || "";
    tipBody.textContent = button.dataset.tipBody || "";
    tip.hidden = false;
    placeTip(button);
    hits.forEach((hit) => {
      hit.classList.toggle("is-active", hit === button);
      hit.setAttribute("aria-expanded", hit === button ? "true" : "false");
    });
  };

  const closeTip = () => {
    if (!tip || pinned) return;
    tip.hidden = true;
    current = null;
    hits.forEach((hit) => {
      hit.classList.remove("is-active");
      hit.setAttribute("aria-expanded", "false");
    });
  };

  const clearPin = () => {
    if (pinned) pinned.classList.remove("is-pinned");
    pinned = null;
  };

  if (tip && hits.length) {
    hits.forEach((button) => {
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-describedby", "badge-tooltip");

      button.addEventListener("pointerenter", () => openTip(button));
      button.addEventListener("pointerleave", () => {
        if (pinned && pinned !== button) openTip(pinned);
        else closeTip();
      });
      button.addEventListener("focus", () => openTip(button));
      button.addEventListener("blur", () => {
        if (!pinned) closeTip();
      });
      button.addEventListener("click", () => {
        if (pinned === button) {
          clearPin();
          closeTip();
          return;
        }
        clearPin();
        pinned = button;
        button.classList.add("is-pinned");
        openTip(button);
      });
    });

    document.addEventListener("click", (event) => {
      if (!pinned) return;
      if (event.target instanceof Element && event.target.closest(".badge-hit")) return;
      clearPin();
      closeTip();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || (!current && !pinned)) return;
      clearPin();
      closeTip();
    });

    window.addEventListener("scroll", () => {
      if (current) placeTip(current);
    }, { passive: true });
    window.addEventListener("resize", () => {
      if (current) placeTip(current);
    });
  }
})();
