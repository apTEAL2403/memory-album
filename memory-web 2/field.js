// ============================================================
// field.js — 「野原」テーマの演出
// ・風に飛んでくる葉っぱ
// ・空を飛ぶ鳥
// ・葉っぱ型のカーソル
// ============================================================
window.FieldFX = (function () {
  let running = false;
  let leafTimer = null;
  let birdTimer = null;
  let cursorHandler = null;
  const LEAF_SVG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4,20 C2,10 10,2 20,4 C18,14 10,20 4,20 Z' fill='%237ea34c'/><path d='M5,19 C7,12 12,7 18,5' stroke='%235a7d3a' stroke-width='1' fill='none'/></svg>";

  function spawnLeaf() {
    const host = document.getElementById("decor-field");
    if (!host) return;
    const p = document.createElement("div");
    p.className = "field-petal";
    p.style.backgroundImage = `url("${LEAF_SVG}")`;
    p.style.top = -5 - Math.random() * 10 + "%";
    p.style.left = Math.random() * 100 + "%";
    const duration = 9 + Math.random() * 7;
    p.style.animationDuration = duration + "s";
    host.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000);
  }

  function spawnBird() {
    const host = document.getElementById("decor-field");
    if (!host) return;
    const wrap = document.createElement("div");
    wrap.className = "field-bird" + (Math.random() < 0.5 ? " reverse" : "");
    wrap.style.top = 8 + Math.random() * 20 + "%";
    const duration = 14 + Math.random() * 8;
    wrap.style.animationDuration = duration + "s";
    const inner = document.createElement("div");
    inner.className = "field-bird-inner";
    wrap.appendChild(inner);
    host.appendChild(wrap);
    setTimeout(() => wrap.remove(), duration * 1000);
  }

  function setupCursor() {
    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;
    cursor.innerHTML = `<div class="field-cursor-leaf"></div>`;
    document.body.classList.add("has-custom-cursor");
    cursorHandler = (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    };
    window.addEventListener("mousemove", cursorHandler);
  }

  function start() {
    if (running) return;
    running = true;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      leafTimer = setInterval(spawnLeaf, 1400);
      birdTimer = setInterval(spawnBird, 11000);
      for (let i = 0; i < 3; i++) setTimeout(spawnLeaf, i * 500);
      setTimeout(spawnBird, 2000);
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (leafTimer) clearInterval(leafTimer);
    if (birdTimer) clearInterval(birdTimer);
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    const host = document.getElementById("decor-field");
    if (host) host.querySelectorAll(".field-petal, .field-bird").forEach((el) => el.remove());
  }

  return { start, stop };
})();
