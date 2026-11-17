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