// ============================================================
// field.js — 「野原」テーマの演出
// ・風に飛んでくる花びらや葉っぱ
// ・葉っぱ型のカーソル
// ============================================================
window.FieldFX = (function () {
  let running = false;
  let spawnTimer = null;
  let cursorHandler = null;
  const PETAL_SVGS = [
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4,20 C2,10 10,2 20,4 C18,14 10,20 4,20 Z' fill='%237ea34c'/><path d='M5,19 C7,12 12,7 18,5' stroke='%235a7d3a' stroke-width='1' fill='none'/></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g transform='translate(12,12)'><ellipse rx='5' ry='8' fill='%23e79ab5'/><ellipse rx='5' ry='8' fill='%23e79ab5' transform='rotate(72)'/><ellipse rx='5' ry='8' fill='%23e79ab5' transform='rotate(144)'/><ellipse rx='5' ry='8' fill='%23e79ab5' transform='rotate(216)'/><ellipse rx='5' ry='8' fill='%23e79ab5' transform='rotate(288)'/><circle r='3' fill='%23f5d76e'/></g></svg>"
  ];

  function spawnPetal() {
    const host = document.getElementById("decor-field");
    if (!host) return;
    const p = document.createElement("div");
    p.className = "field-petal";
    p.style.backgroundImage = `url("${PETAL_SVGS[Math.floor(Math.random() * PETAL_SVGS.length)]}")`;
    p.style.top = -5 - Math.random() * 10 + "%";
    p.style.left = Math.random() * 100 + "%";
    const duration = 9 + Math.random() * 7;
    p.style.animationDuration = duration + "s";
    host.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000);
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
      spawnTimer = setInterval(spawnPetal, 1400);
      for (let i = 0; i < 3; i++) setTimeout(spawnPetal, i * 500);
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (spawnTimer) clearInterval(spawnTimer);
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    const host = document.getElementById("decor-field");
    if (host) host.querySelectorAll(".field-petal").forEach((el) => el.remove());
  }

  return { start, stop };
})();
