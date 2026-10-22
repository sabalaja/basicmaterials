const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = [...document.querySelectorAll('main > section[id]')];

// Keep the active menu item in sync with the section in view.
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
  if (!visible.length) return;
  const activeId = visible[0].target.id;
  navLinks.forEach(link => {
    if (link.getAttribute('href') === `#${activeId}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}, { threshold: [0.25, 0.5, 0.75] });
sections.forEach(section => observer.observe(section));

const copyButton = document.querySelector('[data-copy-email]');
const copyStatus = document.querySelector('.copy-status');
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyButton.dataset.copyEmail);
    copyStatus.textContent = 'Email copied to clipboard.';
  } catch {
    copyStatus.textContent = 'Could not copy. Please use the email link above.';
  }
});
const header = document.querySelector('.site-header');
const products = document.querySelector('#products');

const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      header.classList.add('show-logo');
    } else if (entry.boundingClientRect.top > 0) {
      header.classList.remove('show-logo');
    }
  },
  {
    threshold: 0,
    rootMargin: '-72px 0px 0px 0px'
  }
);

observer.observe(products);