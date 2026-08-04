// ============================================================
// towel.js — 「海原」テーマの演出（旧タオル。中身を海仕様に一新）
// ・波間から立ちのぼる泡
// ・水滴のようなカーソル
// ============================================================
window.TowelFX = (function () {
  let running = false;
  let spawnTimer = null;
  let cursorHandler = null;

  function spawnBubble() {
    const host = document.getElementById("decor-towel");
    if (!host) return;
    const b = document.createElement("div");
    b.className = "ocean-bubble";
    const size = 6 + Math.random() * 10;
    b.style.width = size + "px";
    b.style.height = size + "px";
    b.style.left = Math.random() * 100 + "%";
    const duration = 8 + Math.random() * 6;
    b.style.animationDuration = duration + "s";
    host.appendChild(b);
    setTimeout(() => b.remove(), duration * 1000);
  }

  function setupCursor() {
    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;
    cursor.innerHTML = `<div class="ocean-cursor-drop"></div>`;
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
      spawnTimer = setInterval(spawnBubble, 1400);
      for (let i = 0; i < 3; i++) setTimeout(spawnBubble, i * 500);
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (spawnTimer) clearInterval(spawnTimer);
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    const host = document.getElementById("decor-towel");
    if (host) host.querySelectorAll(".ocean-bubble").forEach((el) => el.remove());
  }

  return { start, stop };
})();
