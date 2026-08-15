// ============================================================
// cinema.js — 「映画」テーマの演出
// ・映写機の光に舞う塵
// ・時折走るフィルムの傷（スクラッチ）
// ・カメラのビューファインダー風カーソル
// ============================================================
window.CinemaFX = (function () {
  let running = false;
  let motesTimer = null;
  let scratchTimer = null;
  let cursorHandler = null;

  function spawnDustMote() {
    const host = document.getElementById("decor-cinema");
    if (!host) return;
    const m = document.createElement("div");
    m.className = "cinema-dust";
    m.style.left = Math.random() * 100 + "%";
    const duration = 6 + Math.random() * 6;
    m.style.animationDuration = duration + "s";
    host.appendChild(m);
    setTimeout(() => m.remove(), duration * 1000);
  }

  function spawnScratch() {
    const host = document.getElementById("decor-cinema");
    if (!host) return;
    const s = document.createElement("div");
    s.className = "cinema-scratch";
    s.style.left = Math.random() * 100 + "%";
    host.appendChild(s);
    setTimeout(() => s.remove(), 500);
  }

  function setupCursor() {
    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;
    cursor.innerHTML = `<div class="cinema-cursor-ring"></div>`;
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
      motesTimer = setInterval(spawnDustMote, 900);
      scratchTimer = setInterval(() => { if (Math.random() < 0.4) spawnScratch(); }, 5000);
      for (let i = 0; i < 6; i++) setTimeout(spawnDustMote, i * 300);
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (motesTimer) clearInterval(motesTimer);
    if (scratchTimer) clearInterval(scratchTimer);
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    const host = document.getElementById("decor-cinema");
    if (host) host.querySelectorAll(".cinema-dust, .cinema-scratch").forEach((el) => el.remove());
  }

  return { start, stop };
})();
