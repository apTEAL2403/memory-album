// ============================================================
// home.js — 「ホーム」テーマの演出
// ・木漏れ日のような光に浮かぶ、あたたかい塵
// ・やわらかな灯りのカーソル
// ============================================================
window.HomeFX = (function () {
  let running = false;
  let spawnTimer = null;
  let cursorHandler = null;

  function spawnMote() {
    const host = document.getElementById("decor-home");
    if (!host) return;
    const m = document.createElement("div");
    m.className = "home-mote";
    m.style.left = Math.random() * 100 + "%";
    const duration = 10 + Math.random() * 8;
    m.style.animationDuration = duration + "s";
    host.appendChild(m);
    setTimeout(() => m.remove(), duration * 1000);
  }

  function setupCursor() {
    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;
    cursor.innerHTML = `<div class="home-cursor-glow"></div>`;
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
      spawnTimer = setInterval(spawnMote, 1100);
      for (let i = 0; i < 4; i++) setTimeout(spawnMote, i * 400);
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (spawnTimer) clearInterval(spawnTimer);
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    const host = document.getElementById("decor-home");
    if (host) host.querySelectorAll(".home-mote").forEach((el) => el.remove());
  }

  return { start, stop };
})();
