// ============================================================
// towel.js — 「海原」テーマの演出
// ・波間から立ちのぼる泡
// ・4隻目のヨットのようなカーソル
// ・スクロール中だけ、蟹と魚1種類の動きが約1.75倍速になる
//   （なめらかに変化する）
// ============================================================
window.TowelFX = (function () {
  let running = false;
  let spawnTimer = null;
  let cursorHandler = null;
  let scrollHandler = null;
  let scrollIdleTimer = null;
  let rafId = null;
  let isScrolling = false;
  let currentRate = 1;

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

  // スクロール中は蟹と魚(種類A)の速度が約1.75倍に、なめらかに変化する
  function speedBoostLoop() {
    const target = isScrolling ? 1.75 : 1;
    currentRate += (target - currentRate) * 0.07;
    const host = document.getElementById("decor-towel");
    if (host) {
      host.querySelectorAll(".ocean-crab, .fish-a").forEach((el) => {
        el.getAnimations().forEach((anim) => { anim.playbackRate = currentRate; });
      });
    }
    rafId = requestAnimationFrame(speedBoostLoop);
  }

  function setupScrollBoost() {
    scrollHandler = () => {
      isScrolling = true;
      clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => { isScrolling = false; }, 250);
    };
    window.addEventListener("scroll", scrollHandler);
    rafId = requestAnimationFrame(speedBoostLoop);
  }

  function start() {
    if (running) return;
    running = true;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      spawnTimer = setInterval(spawnBubble, 1400);
      for (let i = 0; i < 3; i++) setTimeout(spawnBubble, i * 500);
      setupScrollBoost();
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (spawnTimer) clearInterval(spawnTimer);
    if (rafId) cancelAnimationFrame(rafId);
    if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
    clearTimeout(scrollIdleTimer);
    isScrolling = false;
    currentRate = 1;
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    const host = document.getElementById("decor-towel");
    if (host) {
      host.querySelectorAll(".ocean-bubble").forEach((el) => el.remove());
      host.querySelectorAll(".ocean-crab, .fish-a").forEach((el) => {
        el.getAnimations().forEach((anim) => { anim.playbackRate = 1; });
      });
    }
  }

  return { start, stop };
})();
