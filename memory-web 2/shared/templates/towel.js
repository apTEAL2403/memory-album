// ============================================================
// towel.js — 「タオル」テーマの演出
// ・ふわふわ漂う綿毛
// ・むにっと動くもこもこカーソル
// ============================================================
window.TowelFX = (function () {
  let running = false;
  let spawnTimer = null;
  let cursorHandler = null;

  function spawnFluff() {
    const host = document.getElementById("decor-towel");
    if (!host) return;
    const f = document.createElement("div");
    f.className = "towel-fluff";
    f.style.left = Math.random() * 100 + "%";
    const duration = 12 + Math.random() * 8;
    f.style.animationDuration = duration + "s";
    host.appendChild(f);
    setTimeout(() => f.remove(), duration * 1000);
  }

  function setupCursor() {
    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;
    cursor.innerHTML = `<div class="towel-cursor-blob"></div>`;
    document.body.classList.add("has-custom-cursor");
    cursorHandler = (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      const blob = cursor.querySelector(".towel-cursor-blob");
      if (blob) {
        blob.style.transform = "scale(0.85)";
        clearTimeout(blob._t);
        blob._t = setTimeout(() => { blob.style.transform = "scale(1)"; }, 150);
      }
    };
    window.addEventListener("mousemove", cursorHandler);
  }

  function start() {
    if (running) return;
    running = true;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      spawnTimer = setInterval(spawnFluff, 1600);
      for (let i = 0; i < 3; i++) setTimeout(spawnFluff, i * 600);
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (spawnTimer) clearInterval(spawnTimer);
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    const host = document.getElementById("decor-towel");
    if (host) host.querySelectorAll(".towel-fluff").forEach((el) => el.remove());
  }

  return { start, stop };
})();
