// ============================================================
// star.js — 「星」テーマの演出
// ・瞬く星空（Canvas）
// ・時折流れる流れ星
// ・キラキラした彗星風のカーソル
// ============================================================
window.StarField = (function () {
  let canvas, ctx, stars = [], w, h, raf = null, running = false;
  let shootingTimer = null;
  let cursorHandler = null;

  function ensureCanvas() {
    const host = document.getElementById("decor-star");
    if (!host) return false;
    canvas = host.querySelector("canvas#star-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "star-canvas";
      host.appendChild(canvas);
    }
    ctx = canvas.getContext("2d");
    return true;
  }

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.floor((w * h) / 5000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.5,
      twinkle: Math.random() * Math.PI * 2
    }));
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    stars.forEach((s) => {
      s.twinkle += 0.025;
      const alpha = 0.5 + Math.sin(s.twinkle) * 0.5;
      ctx.beginPath();
      ctx.shadowBlur = 6 + alpha * 6;
      ctx.shadowColor = "rgba(255,255,255,0.95)";
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    raf = requestAnimationFrame(frame);
  }

  function spawnShootingStar() {
    const host = document.getElementById("decor-star");
    if (!host) return;
    const star = document.createElement("div");
    star.className = "shooting-star";
    star.style.top = Math.random() * 40 + "%";
    star.style.left = Math.random() * 60 + "%";
    host.appendChild(star);
    setTimeout(() => star.remove(), 1400);
  }

  function scheduleShootingStars() {
    shootingTimer = setInterval(() => {
      if (Math.random() < 0.7) spawnShootingStar();
    }, 4500);
  }

  function setupCursor() {
    const cursor = document.getElementById("custom-cursor");
    if (!cursor) return;
    cursor.innerHTML = `<div class="star-cursor-core"></div>`;
    document.body.classList.add("has-custom-cursor");
    cursorHandler = (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
      if (Math.random() < 0.15) spawnSparkle(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", cursorHandler);
  }
  function spawnSparkle(x, y) {
    const host = document.getElementById("decor-star");
    if (!host) return;
    const s = document.createElement("div");
    s.className = "cursor-sparkle";
    s.style.left = x + "px";
    s.style.top = y + "px";
    host.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }

  function start() {
    if (running) return;
    if (!ensureCanvas()) return;
    running = true;
    resize();
    window.addEventListener("resize", resize);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame();
      scheduleShootingStars();
    } else {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.fillStyle = "rgba(238,233,255,0.5)";
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    setupCursor();
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    if (shootingTimer) clearInterval(shootingTimer);
    window.removeEventListener("resize", resize);
    if (cursorHandler) window.removeEventListener("mousemove", cursorHandler);
    document.body.classList.remove("has-custom-cursor");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    const host = document.getElementById("decor-star");
    if (host) host.querySelectorAll(".shooting-star, .cursor-sparkle").forEach((el) => el.remove());
  }

  return { start, stop };
})();
