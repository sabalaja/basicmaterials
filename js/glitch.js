const glitchBlocks = document.querySelectorAll(".component-block");
const reducedAnimationsMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

let glitchTimeout;
console.log("GLITCH JS LOADED");
function triggerGlitch(block) {
  if (reducedAnimationsMotion.matches) return;

  block.classList.remove("is-glitching");
  void block.offsetWidth;
  block.classList.add("is-glitching");

  setTimeout(() => {
    block.classList.remove("is-glitching");
  }, 550);
}

function scheduleGlitch() {
  const delay = 1000 + Math.random() * 1500;
  console.log("GLITCH JS LOADED", glitchBlocks);
  glitchTimeout = setTimeout(() => {
    if (!document.hidden && glitchBlocks.length) {
      const block =
        glitchBlocks[Math.floor(Math.random() * glitchBlocks.length)];

      triggerGlitch(block);
    }

    scheduleGlitch();
  }, delay);
}

glitchBlocks.forEach((block) => {
  block.addEventListener("mouseenter", () => {
    triggerGlitch(block);
  });
});

scheduleGlitch();
