import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Przesunięcia poszczególnych części Rhino w stanie rozłożonym (w jednostkach modelu).
const EXPLODED_Z = {
  Obiekt_1: -96, // przednia pokrywa, najbliżej kamery
  Obiekt_10: 93, // tylna obudowa
  Obiekt_3: -7,
  Obiekt_4: -7,
  Obiekt_5: -5,
  Obiekt_6: -5,
  Obiekt_7: 7,
  Obiekt_8: 7,
  Obiekt_9: 0,
};

// Domyślnie model jest w tym samym folderze, co product-3d.js.
const DEFAULT_MODEL_URL = new URL("./model.glb", import.meta.url).href;
const instances = new Map();

function initOne(root) {
  if (instances.has(root)) return;

  root.innerHTML = `
    <div class="product-3d__stage" tabindex="0"
      aria-label="Interaktywny model produktu. Najedź kursorem, aby rozłożyć części, lub użyj przycisku poniżej.">
      <div class="product-3d__loading" role="status">Wczytywanie modelu 3D…</div>
      <div class="product-3d__message" role="status" hidden></div>
    </div>
    <div class="product-3d__footer">
      <button class="product-3d__button" type="button" aria-pressed="false">Rozłóż model</button>
    </div>
  `;

  const stage = root.querySelector(".product-3d__stage");
  const button = root.querySelector(".product-3d__button");
  const loading = root.querySelector(".product-3d__loading");
  const message = root.querySelector(".product-3d__message");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "default",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.insertBefore(renderer.domElement, stage.firstChild);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-180, 180, 130, -130, 1, 2000);
  camera.position.set(260, 155, -330); // widok od strony PRZEDNIEJ pokrywy
  camera.lookAt(0, 13, 0);
  const model = new THREE.Group();
  model.position.y = 3;
  scene.add(model);

  const parts = [];
  let ready = false,
    hovered = false,
    pinned = false,
    visible = false;
  let progress = 0,
    pointerX = 0,
    pointerY = 0,
    hitBounds = null;
  let boundingBox = null,
    frame = 0,
    lastFrameTime = 0,
    destroyed = false;
  let importedScene = null;

  function updateState() {
    const open = hovered || pinned;
    button.textContent = pinned ? "Złóż model" : "Rozłóż model";
    button.setAttribute("aria-pressed", String(pinned));
  }

  function setHover(next) {
    hovered = next;
    if (!next) pointerX = pointerY = 0;
    updateState();
  }

  function computeHitBounds() {
    if (!boundingBox) return;
    const { min, max } = boundingBox;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const x of [min.x, max.x])
      for (const y of [min.y, max.y])
        for (const z of [min.z, max.z]) {
          const p = new THREE.Vector3(x, y, z).project(camera);
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
    hitBounds = { minX, maxX, minY, maxY };
  }

  function fitCamera() {
    const { width, height } = stage.getBoundingClientRect();
    // Element bywa niewidoczny (display:none) w zamkniętym product details.
    if (width < 1 || height < 1) return;
    const viewHeight = Math.max(250, 420 / (width / height));
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.left = (-viewHeight * width) / height / 2;
    camera.right = (viewHeight * width) / height / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    computeHitBounds();
  }

  const resizeObserver = new ResizeObserver(fitCamera);
  resizeObserver.observe(stage);
  fitCamera();

  stage.addEventListener("pointerleave", () => setHover(false));
  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const rect = stage.getBoundingClientRect();
    pointerX = THREE.MathUtils.clamp(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -1,
      1,
    );
    pointerY = THREE.MathUtils.clamp(
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
      -1,
      1,
    );
    if (!hovered && ready && !pinned && hitBounds) {
      const pad = 0.045;
      if (
        pointerX >= hitBounds.minX - pad &&
        pointerX <= hitBounds.maxX + pad &&
        -pointerY >= hitBounds.minY - pad &&
        -pointerY <= hitBounds.maxY + pad
      ) {
        setHover(true);
      }
    }
  });
  stage.addEventListener("click", (event) => {
    if (event.pointerType === "touch" || matchMedia("(hover: none)").matches) {
      pinned = !pinned;
      updateState();
    }
  });
  stage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pinned = !pinned;
      updateState();
    } else if (event.key === "Escape") {
      pinned = false;
      setHover(false);
    }
  });
  button.addEventListener("click", () => {
    pinned = !pinned;
    updateState();
  });

  const loader = new GLTFLoader();
  loader.load(
    root.dataset.modelUrl || DEFAULT_MODEL_URL,
    (gltf) => {
      if (destroyed) return;
      importedScene = gltf.scene;
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((obj) => {
        if (!obj.isMesh) return;
        const part = new THREE.Group();
        part.name = obj.name;
        part.position.copy(obj.position);
        part.quaternion.copy(obj.quaternion);
        part.scale.copy(obj.scale);
        part.userData.baseZ = obj.position.z;
        part.userData.explodedZ = EXPLODED_Z[obj.name] ?? 0;
        part.userData.isFront = obj.name === "Obiekt_1";

        // Linie cienkie, techniczne: ten sam wygląd, co w poprzednim prototypie.
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(obj.geometry, 9),
          new THREE.LineBasicMaterial({
            color: 0x61635f,
            opacity: part.userData.isFront ? 0.53 : 0.12,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          }),
        );
        const fineWire = new THREE.LineSegments(
          new THREE.WireframeGeometry(obj.geometry),
          new THREE.LineBasicMaterial({
            color: 0x7c807a,
            opacity: part.userData.isFront ? 0.065 : 0.008,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          }),
        );
        part.add(fineWire, edges);
        part.userData.edges = edges;
        part.userData.fineWire = fineWire;
        model.add(part);
        parts.push(part);
      });
      boundingBox = new THREE.Box3().setFromObject(model);
      ready = true;
      loading.hidden = true;
      fitCamera();
    },
    undefined,
    (error) => {
      if (destroyed) return;
      console.error("Nie udało się wczytać model.glb", error);
      loading.hidden = true;
      message.hidden = false;
      message.textContent =
        "Nie udało się załadować modelu 3D. Sprawdź ścieżkę do model.glb i konsolę przeglądarki.";
    },
  );

  function renderFrame(time) {
    frame = 0;
    if (destroyed || !visible) return;
    const dt = Math.min((time - (lastFrameTime || time)) / 1000, 0.05);
    lastFrameTime = time;
    const target = hovered || pinned ? 1 : 0;
    progress = reduceMotion.matches
      ? target
      : THREE.MathUtils.damp(progress, target, 3.9, dt);
    if (ready) {
      for (const part of parts) {
        part.position.z =
          part.userData.baseZ + part.userData.explodedZ * progress;
        const front = part.userData.isFront;
        part.userData.edges.material.opacity = THREE.MathUtils.lerp(
          front ? 0.53 : 0.12,
          front ? 0.53 : 0.47,
          progress,
        );
        part.userData.fineWire.material.opacity = THREE.MathUtils.lerp(
          front ? 0.065 : 0.008,
          0.065,
          progress,
        );
      }
    }
    model.rotation.y = THREE.MathUtils.damp(
      model.rotation.y,
      pointerX * 0.065,
      2.6,
      dt,
    );
    model.rotation.x = THREE.MathUtils.damp(
      model.rotation.x,
      pointerY * 0.035,
      2.6,
      dt,
    );
    renderer.render(scene, camera);
    frame = requestAnimationFrame(renderFrame);
  }

  // Nie renderujemy nieustannie ukrytego modala ani produktu poza ekranem.
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      if (visible) {
        fitCamera();
        if (!frame) {
          lastFrameTime = 0;
          frame = requestAnimationFrame(renderFrame);
        }
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
        hovered = false;
        updateState();
      }
    },
    { threshold: 0 },
  );
  intersectionObserver.observe(root);

  instances.set(root, () => {
    destroyed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    for (const part of parts)
      for (const child of part.children) {
        child.geometry.dispose();
        child.material.dispose();
      }
    importedScene?.traverse((obj) => {
      if (obj.isMesh) obj.geometry.dispose();
    });
    renderer.dispose();
  });
}

function refresh() {
  document.querySelectorAll("[data-product-3d]").forEach(initOne);
  for (const [root, dispose] of instances)
    if (!root.isConnected) {
      dispose();
      instances.delete(root);
    }
}

// Działa także wtedy, gdy product details jest dodawany dynamicznie do DOM.
refresh();
const domObserver = new MutationObserver(refresh);
domObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Opcjonalnie dostępne, jeśli ręcznie chcesz zainicjować model po otwarciu details.
window.initProduct3D = refresh;
