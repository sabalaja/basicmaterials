
const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...document.querySelectorAll("main > section[id]")];
const header = document.querySelector(".small");
const products = document.querySelector("#products");

// Update active navigation and logo visibility
function updateOnScroll() {
  // Active navigation
  const viewportCenter = window.innerHeight * 0.5;

  const activeSection = sections.find((section) => {
    const rect = section.getBoundingClientRect();

    return rect.top <= viewportCenter &&
           rect.bottom > viewportCenter;
  });

  if (activeSection) {
    navLinks.forEach((link) => {
      const isActive =
        link.getAttribute("href") === `#${activeSection.id}`;

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // Logo visibility
  if (products && header) {
    const productsTop = products.getBoundingClientRect().top;
    const triggerPoint = window.innerHeight * 0.5;

    header.classList.toggle(
      "show-logo",
      productsTop <= triggerPoint
    );
  }
}

// One scroll handler for both features
window.addEventListener("scroll", updateOnScroll, {
  passive: true,
});

window.addEventListener("resize", updateOnScroll);

// Initialize on page load
updateOnScroll();


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
