const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll("main > section[id]")];
const header = document.querySelector(".small");

// Observe sections and update navigation + logo visibility
const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (!visible.length) return;

    const activeId = visible[0].target.id;

    // Update active navigation link
    navLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${activeId}`) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
    const products = document.querySelector("#products");

    function updateLogoVisibility() {
      if (!products || !header) return;

      const productsTop = products.getBoundingClientRect().top;
      const triggerPoint = window.innerHeight * 0.5;

      header.classList.toggle("show-logo", productsTop <= triggerPoint);
    }

    window.addEventListener("scroll", updateLogoVisibility, { passive: true });
    window.addEventListener("resize", updateLogoVisibility);

    updateLogoVisibility();
  },
  {
    threshold: [0, 0.25, 0.5, 0.75],
  },
);

sections.forEach((section) => observer.observe(section));

// Copy email
const copyButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector(".copy-status");

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(copyButton.dataset.copyEmail);
    if (copyStatus) {
      copyStatus.textContent = "Email copied to clipboard.";
    }
  } catch {
    if (copyStatus) {
      copyStatus.textContent =
        "Could not copy. Please use the email link above.";
    }
  }
});
