const productData = {
  "product-01": {
    title: "BASIC 001",
    description: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model t",
    images: [
      "../assets/products/basic_001/1.jpg",
      "../assets/products/basic_001/2.jpg",
      "../assets/products/basic_001/3.jpg",
      "../assets/products/basic_001/4.jpg",
      "../assets/products/basic_001/5.jpg",
      "../assets/products/basic_001/6.jpg",
    ],
    sku: "BM-001",
    material: "LIMITED",
    dimensions: "40 × 60 × 20 CM",
    origin: "01.2027",
    price: "COMING SOON",
    reference: "001 / 2026",
  },

  "product-02": {
    title: "BASIC 002",
    description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software like Aldus PageMaker and Microsoft Word including versions of Lorem Ipsum.",
    images: [
      "../assets/products/basic_002/1.jpg",
      "../assets/products/basic_002/2.jpg",
      "../assets/products/basic_002/3.jpg",
      "../assets/products/basic_002/4.jpg",
      "../assets/products/basic_002/5.jpg",
      "../assets/products/basic_002/6.jpg",
    ],
    sku: "BM-002",
    material: "NORMAL",
    dimensions: "30 × 45 × 15 CM",
    origin: "01.2027",
    price: "COMING SOON",
    reference: "002 / 2026",
  },
};

const overlay = document.querySelector("#product-overlay");
const detailPanel = overlay?.querySelector(".product-detail");
const closeButton = overlay?.querySelector(".product-detail__close");
const backdrop = overlay?.querySelector(".product-overlay__backdrop");

const backgroundElements = [
  document.querySelector(".site-header"),
  document.querySelector("main"),
].filter(Boolean);

let previousFocus = null;
let closeTimer;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setProductField(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function openProduct(id) {
  const product = productData[id];
  if (!product || !overlay) return;

  clearTimeout(closeTimer);
  previousFocus = document.activeElement;

  setProductField("product-title", product.title);
  setProductField("product-description", product.description);
  setProductField("product-sku", product.sku);
  setProductField("product-material", product.material);
  setProductField("product-dimensions", product.dimensions);
  setProductField("product-origin", product.origin);
  setProductField("product-price", product.price);
  setProductField("product-reference", product.reference);

  setProductImages(product.images);
  const enquiry = document.querySelector("#product-enquiry");

  if (enquiry) {
    const subject = encodeURIComponent(`Enquiry about ${product.title}`);

    enquiry.href = `mailto:contact@basicmaterials.studio?subject=${subject}`;
  }

  overlay.setAttribute("aria-hidden", "false");
  overlay.classList.add("is-open");
  document.body.classList.add("overlay-open");

  backgroundElements.forEach((el) => (el.inert = true));
  closeButton?.focus();
}

function closeProduct() {
  if (!overlay?.classList.contains("is-open")) return;

  overlay.classList.remove("is-open");
  document.body.classList.remove("overlay-open");

  const duration = reducedMotion.matches ? 0 : 700;

  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    if (overlay.classList.contains("is-open")) return;

    overlay.setAttribute("aria-hidden", "true");
    backgroundElements.forEach((el) => (el.inert = false));
    previousFocus?.focus();
  }, duration);
}

// Product cards
document.querySelectorAll("[data-product]").forEach((card) => {
  const open = () => openProduct(card.dataset.product);

  card.addEventListener("click", open);

  // For article elements with role="button"
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });
});

// Close overlay
closeButton?.addEventListener("click", closeProduct);
backdrop?.addEventListener("click", closeProduct);

// Keyboard navigation
document.addEventListener("keydown", (event) => {
  if (!overlay?.classList.contains("is-open")) return;

  if (event.key === "Escape") {
    closeProduct();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = [
    ...detailPanel.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex="0"]',
    ),
  ];

  if (!focusable.length) {
    event.preventDefault();
    detailPanel.focus();
    return;
  }

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

const galleryImage = document.querySelector("#product-image");
const galleryCurrent = document.querySelector("#gallery-current");
const galleryTotal = document.querySelector("#gallery-total");

const prevButton = document.querySelector(".product-gallery__arrow--prev");
const nextButton = document.querySelector(".product-gallery__arrow--next");

let currentImages = [];
let currentImageIndex = 0;
let galleryTimer;

function formatImageNumber(number) {
  return String(number).padStart(2, "0");
}

function renderGalleryImage() {
  if (!currentImages.length || !galleryImage) return;

  clearTimeout(galleryTimer);

  const imageIndex = currentImageIndex;
  galleryImage.classList.add("is-changing");

  galleryTimer = setTimeout(() => {
    // Ignore images that are no longer selected
    if (imageIndex !== currentImageIndex) return;

    galleryImage.src = currentImages[imageIndex];
    galleryImage.alt = `Product image ${imageIndex + 1} of ${currentImages.length}`;

    galleryCurrent.textContent = formatImageNumber(imageIndex + 1);

    galleryTotal.textContent = formatImageNumber(currentImages.length);

    // Preload and fade in when the image is ready
    if (galleryImage.complete) {
      galleryImage.classList.remove("is-changing");
    } else {
      galleryImage.onload = () => {
        galleryImage.classList.remove("is-changing");
      };
    }
  }, 250);
}

function setProductImages(images) {
  currentImages = images;
  currentImageIndex = 0;

  renderGalleryImage();

  const showControls = images.length > 1;

  prevButton.hidden = !showControls;
  nextButton.hidden = !showControls;
}

function changeGalleryImage(direction) {
  if (currentImages.length < 2) return;

  currentImageIndex =
    (currentImageIndex + direction + currentImages.length) %
    currentImages.length;

  renderGalleryImage();
}

prevButton?.addEventListener("click", () => {
  changeGalleryImage(-1);
});

nextButton?.addEventListener("click", () => {
  changeGalleryImage(1);
});

document.addEventListener("keydown", (event) => {
  if (
    !document.querySelector("#product-overlay")?.classList.contains("is-open")
  )
    return;

  if (event.key === "ArrowLeft") {
    changeGalleryImage(-1);
  }

  if (event.key === "ArrowRight") {
    changeGalleryImage(1);
  }
});
const contactBtn = document.querySelector("#product-contact-btn");
const contactSection = document.querySelector("#contact");

contactBtn?.addEventListener("click", (event) => {
  event.preventDefault();

  closeProduct();

  const duration = reducedMotion.matches ? 0 : 700;

  setTimeout(() => {
    contactSection?.scrollIntoView({
      behavior: reducedMotion.matches ? "instant" : "smooth",
      block: "start",
    });
  }, duration);
});