
(() => {
  const overlays = document.querySelectorAll(".legal-overlay");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let previousFocus = null;
  let activeOverlay = null;
  let closeTimer;

  function openLegalPanel(id) {
    const overlay = document.getElementById(`${id}-overlay`);
    if (!overlay) return;

    clearTimeout(closeTimer);

    previousFocus = document.activeElement;
    activeOverlay = overlay;

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    document.body.classList.add("overlay-open");

    overlay.querySelector(".legal-panel__close")?.focus();
  }

  function closeLegalPanel() {
    if (!activeOverlay) return;

    const overlay = activeOverlay;
    activeOverlay = null;

    overlay.classList.remove("is-open");

    const duration = reducedMotion.matches ? 0 : 700;

    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (overlay.classList.contains("is-open")) return;

      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("overlay-open");

      previousFocus?.focus();
    }, duration);
  }

  document.querySelectorAll("[data-legal]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openLegalPanel(trigger.dataset.legal);
    });
  });

  overlays.forEach((overlay) => {
    overlay.querySelector(".legal-panel__close")
      ?.addEventListener("click", closeLegalPanel);

    overlay.querySelector(".legal-overlay__backdrop")
      ?.addEventListener("click", closeLegalPanel);
  });

  document.addEventListener("keydown", (event) => {
    if (!activeOverlay) return;

    if (event.key === "Escape") {
      closeLegalPanel();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = [
      ...activeOverlay.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex="0"]'
      ),
    ];

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
