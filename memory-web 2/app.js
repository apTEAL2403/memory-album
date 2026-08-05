// ============================================================
// app.js — 3つのコミュニティページ共通のロジック（v3）
// window.APP_CONFIG = { community, password, title } を
// 各ページの index.html で先に定義しておく前提です。
// ============================================================

const { community, password, title } = window.APP_CONFIG;
const GATE_KEY = `unlocked_${community}`;
const TEMPLATE_DIR = "../shared/templates/";
const TEMPLATE_KEY = `memoryAlbumTemplate_${community}`; // ページごとに別々に記憶する
const TEMPLATES = ["star", "cinema", "field", "home", "towel"];

let STATE = {
  years: [],
  currentYear: null,
  items: [],          // 選択中の年の 写真+文言 を日付順に並べたもの
  audio: new Audio(),
  queue: [],
  queueIndex: 0
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("app-title").textContent = title;
  setupTemplateSwitcher();
  setupScrollProgress();
  if (sessionStorage.getItem(GATE_KEY) === "yes") {
    unlockApp();
  } else {
    showGate();
  }
});

// ------------------------------------------------------------
// 合言葉ゲート
// ------------------------------------------------------------
function showGate() {
  document.getElementById("gate-screen").style.display = "flex";
  document.getElementById("main-app").style.display = "none";
  const form = document.getElementById("gate-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = document.getElementById("gate-input").value;
    if (val === password) {
      sessionStorage.setItem(GATE_KEY, "yes");
      unlockApp();
    } else {
      document.getElementById("gate-error").textContent = "合言葉が違います";
      document.getElementById("gate-input").value = "";
    }
  });
}

function unlockApp() {
  document.getElementById("gate-screen").style.display = "none";
  document.getElementById("main-app").style.display = "block";
  setupHeader();
  setupLightbox();
  setupAdminPanel();
  loadYears();
}

// ------------------------------------------------------------
// スクロール量をCSS変数として発信（各テンプレートの背景演出が利用）
// ------------------------------------------------------------
function setupScrollProgress() {
  let ticking = false;
  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    document.documentElement.style.setProperty("--scroll", progress.toFixed(4));
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  });
  update();
}

// ------------------------------------------------------------
// テンプレート切替（このページ専用に記憶される）
// ------------------------------------------------------------
function templateModule(key) {
  return {
    star: window.StarField,
    cinema: window.CinemaFX,
    field: window.FieldFX,
    home: window.HomeFX,
    towel: window.TowelFX
  }[key];
}

function setupTemplateSwitcher() {
  const saved = localStorage.getItem(TEMPLATE_KEY) || "home";
  applyTemplate(saved);

  document.getElementById("template-toggle").addEventListener("click", () => {
    document.getElementById("template-menu").classList.toggle("open");
  });
  document.querySelectorAll("#template-menu button").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTemplate(btn.dataset.template);
      document.getElementById("template-menu").classList.remove("open");
    });
  });
  document.addEventListener("click", (e) => {
    const menu = document.getElementById("template-menu");
    const toggle = document.getElementById("template-toggle");
    if (!menu.contains(e.target) && e.target !== toggle) menu.classList.remove("open");
  });
}

function applyTemplate(key) {
  if (!TEMPLATES.includes(key)) key = "home";
  document.getElementById("template-css").href = `${TEMPLATE_DIR}${key}.css`;
  document.body.dataset.template = key;
  localStorage.setItem(TEMPLATE_KEY, key);

  document.querySelectorAll("#template-menu button").forEach((b) => {
    b.classList.toggle("active", b.dataset.template === key);
  });

  TEMPLATES.forEach((t) => { const m = templateModule(t); if (m && t !== key) m.stop(); });
  const active = templateModule(key);
  if (active) active.start();
}

// ------------------------------------------------------------
// ヘッダー
// ------------------------------------------------------------
function setupHeader() {
  document.getElementById("music-toggle").addEventListener("click", () => {
    const btn = document.getElementById("music-toggle");
    if (STATE.audio.paused) {
      STATE.audio.play().catch(() => {});
      btn.classList.add("on");
    } else {
      STATE.audio.pause();
      btn.classList.remove("on");
    }
  });
  document.getElementById("admin-open").addEventListener("click", () => {
    document.getElementById("admin-panel").classList.add("open");
  });
  STATE.audio.addEventListener("ended", playNextTrack);
}

// ------------------------------------------------------------
// 年の一覧を取得
// ------------------------------------------------------------
async function loadYears() {
  let photoYears, noteYears, playlistYears;
  try {
    const results = await Promise.all([
      supabaseClient.from("photos").select("year").eq("community", community),
      supabaseClient.from("notes").select("year").eq("community", community),
      supabaseClient.from("playlist_tracks").select("year").eq("community", community)
    ]);
    if (results[0].error) console.error("photos年一覧の取得エラー:", results[0].error);
    if (results[1].error) console.error("notes年一覧の取得エラー:", results[1].error);
    if (results[2].error) console.error("playlist_tracks年一覧の取得エラー:", results[2].error);
    photoYears = results[0].data;
    noteYears = results[1].data;
    playlistYears = results[2].data;
  } catch (e) {
    console.error("年一覧の読み込みに失敗しました:", e);
    document.getElementById("gallery").innerHTML =
      `<div class="empty-note">読み込み中にエラーが発生しました。ブラウザの検証ツール(コンソール)でエラー内容を確認してください。<br>データが消えたわけではない可能性が高いです。バックアップ機能で確認できます。</div>`;
    return;
  }

  const set = new Set();
  (photoYears || []).forEach((r) => set.add(r.year));
  (noteYears || []).forEach((r) => set.add(r.year));
  (playlistYears || []).forEach((r) => set.add(r.year));

  STATE.years = Array.from(set).sort((a, b) => a - b);
  renderYearTabs();

  if (STATE.years.length) {
    selectYear(STATE.years[STATE.years.length - 1]); // 一番新しい年を最初に表示
  } else {
    renderGallery();
  }
}

function renderYearTabs() {
  const wrap = document.getElementById("year-tabs");
  wrap.innerHTML = "";
  STATE.years.forEach((y) => {
    const btn = document.createElement("button");
    btn.className = "year-tab" + (y === STATE.currentYear ? " active" : "");
    btn.textContent = y;
    btn.addEventListener("click", () => selectYear(y));
    wrap.appendChild(btn);
  });
}

// ------------------------------------------------------------
// 年を選択 → 写真＋文言を読み込み、プレイリストを切り替える
// ------------------------------------------------------------
async function selectYear(year) {
  STATE.currentYear = year;
  document.querySelectorAll(".year-tab").forEach((b) => {
    b.classList.toggle("active", b.textContent == String(year));
  });

  try {
    const [{ data: photos, error: pErr }, { data: notes, error: nErr }] = await Promise.all([
      supabaseClient.from("photos").select("*").eq("community", community).eq("year", year).order("photo_date", { ascending: true }),
      supabaseClient.from("notes").select("*").eq("community", community).eq("year", year).order("note_date", { ascending: true })
    ]);
    if (pErr) console.error(`${year}年の写真取得エラー:`, pErr);
    if (nErr) console.error(`${year}年の文言取得エラー:`, nErr);

    const items = [
      ...(photos || []).map((p) => ({ type: "photo", date: p.photo_date || "", data: p })),
      ...(notes || []).map((n) => ({ type: "note", date: n.note_date || "", data: n }))
    ];
    items.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
    STATE.items = items;

    renderGallery();
  } catch (e) {
    console.error(`${year}年の表示中にエラーが発生しました:`, e);
    document.getElementById("gallery").innerHTML =
      `<div class="empty-note">${year}年の表示中にエラーが発生しました。データが消えたわけではない可能性が高いです。ブラウザの検証ツール(コンソール)でエラー内容を確認してください。</div>`;
  }

  // ギャラリーの表示に失敗しても、プレイリストや管理パネルの初期値は必ず動くようにする
  loadPlaylist(year);
  populateThemeAwareDefaults();
}

// ------------------------------------------------------------
// ギャラリー描画（同じ日付の写真はまとめてグリッド表示）
// ------------------------------------------------------------
const SIZE_WEIGHTS = [["small", 0.4], ["medium", 0.35], ["large", 0.25]];
function pickRandomSize() {
  const r = Math.random();
  let acc = 0;
  for (const [size, weight] of SIZE_WEIGHTS) {
    acc += weight;
    if (r <= acc) return size;
  }
  return "medium";
}

function renderGallery() {
  const wrap = document.getElementById("gallery");
  wrap.innerHTML = "";

  if (!STATE.items.length) {
    wrap.innerHTML = `<div class="empty-note">まだ何もありません。右下の＋から最初の1枚を追加してみてください。</div>`;
    return;
  }

  let buffer = [];
  const flushBuffer = () => {
    if (buffer.length) wrap.appendChild(buildPhotoWall(buffer));
    buffer = [];
  };

  STATE.items.forEach((item) => {
    try {
      if (item.type === "photo") {
        buffer.push(item.data);
      } else {
        flushBuffer();
        wrap.appendChild(buildNoteBlock(item.data));
      }
    } catch (e) {
      console.error("この項目の表示に失敗したためスキップしました:", item, e);
    }
  });
  flushBuffer();

  observeGalleryItems();
}

function buildPhotoWall(photos) {
  const el = document.createElement("div");
  el.className = "gallery-item photo-wall";
  photos.forEach((photo) => {
    try {
      el.appendChild(buildPhotoTile(photo));
    } catch (e) {
      console.error("この写真の表示に失敗したためスキップしました:", photo, e);
    }
  });
  return el;
}

function formatShortDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const mi = parseInt(parts[1], 10);
  const di = parseInt(parts[2], 10);
  if (Number.isNaN(mi) || Number.isNaN(di)) return dateStr;
  return `${mi}/${di}`;
}

function buildPhotoTile(photo) {
  const size = photo.size && photo.size !== "random" ? photo.size : pickRandomSize();
  const tile = document.createElement("div");
  tile.className = `photo-tile size-${size}`;
  if (photo.url) {
    tile.innerHTML = photo.media_type === "video"
      ? `<video src="${photo.url}" muted></video>`
      : `<img src="${photo.url}" alt="" loading="lazy">`;
  } else {
    tile.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:12px;">画像なし</div>`;
  }
  const dateBadge = document.createElement("div");
  dateBadge.className = "tile-date-badge";
  dateBadge.textContent = formatShortDate(photo.photo_date);
  tile.appendChild(dateBadge);
  if (photo.caption) {
    const cap = document.createElement("div");
    cap.className = "tile-caption";
    cap.textContent = photo.caption;
    tile.appendChild(cap);
  }
  tile.addEventListener("click", () => openLightbox(photo));
  return tile;
}

function buildNoteBlock(note) {
  const el = document.createElement("div");
  el.className = "gallery-item note-block";
  el.innerHTML = `
    <button class="note-edit-btn" data-note-id="${note.id}">✎ 編集</button>
    <div class="note-date">${note.note_date}</div>
    <div class="note-body" id="note-body-${note.id}">${escapeHtml(note.body)}</div>
  `;
  el.querySelector(".note-edit-btn").addEventListener("click", () => startNoteEdit(el, note));
  return el;
}

function startNoteEdit(container, note) {
  const bodyEl = container.querySelector(`#note-body-${note.id}`);
  const original = note.body;
  bodyEl.outerHTML = `
    <textarea class="note-edit-area" id="note-body-${note.id}">${escapeHtml(original)}</textarea>
    <div class="note-edit-actions">
      <button class="note-save-btn" data-save="${note.id}">保存</button>
      <button class="note-cancel-btn" data-cancel="${note.id}">やめる</button>
    </div>
  `;
  container.querySelector(`[data-save="${note.id}"]`).addEventListener("click", async () => {
    const newBody = container.querySelector(`#note-body-${note.id}`).value;
    const { error } = await supabaseClient.from("notes").update({ body: newBody, updated_at: new Date().toISOString() }).eq("id", note.id);
    if (error) { showToast("保存に失敗しました"); console.error(error); return; }
    note.body = newBody;
    showToast("文言を更新しました");
    selectYear(STATE.currentYear);
  });
  container.querySelector(`[data-cancel="${note.id}"]`).addEventListener("click", () => selectYear(STATE.currentYear));
}

function observeGalleryItems() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); });
  }, { threshold: 0.08 });
  document.querySelectorAll(".gallery-item").forEach((i) => io.observe(i));
}

// ------------------------------------------------------------
// コメント（ライトボックス内）
// ------------------------------------------------------------
async function fetchComments(photoId) {
  const { data } = await supabaseClient.from("comments").select("*")
    .eq("community", community).eq("target_type", "photo").eq("target_id", photoId)
    .order("created_at", { ascending: true });
  return data || [];
}

async function mountCommentUI(box, photoId) {
  const comments = await fetchComments(photoId);
  box.innerHTML = `
    <div class="comment-list">${
      comments.length
        ? comments.map((c) => `
          <div class="comment-item">${escapeHtml(c.body)}
            <div class="c-meta">${escapeHtml(c.author_name || "匿名")} ・ ${new Date(c.created_at).toLocaleString("ja-JP")}</div>
          </div>`).join("")
        : `<div style="font-size:12px;color:var(--text-dim);">まだコメントはありません</div>`
    }</div>
    <form class="comment-form">
      <input type="text" class="name-input" placeholder="名前">
      <input type="text" class="body-input" placeholder="ひとこと残す...">
      <button type="submit">送信</button>
    </form>
  `;
  box.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = box.querySelector(".name-input").value.trim();
    const bodyText = box.querySelector(".body-input").value.trim();
    if (!bodyText) return;
    const { error } = await supabaseClient.from("comments").insert({
      community, target_type: "photo", target_id: photoId, author_name: name || "匿名", body: bodyText
    });
    if (error) { showToast("コメントの保存に失敗しました"); console.error(error); return; }
    showToast("コメントしました");
    mountCommentUI(box, photoId);
  });
}

// ------------------------------------------------------------
// ライトボックス（写真拡大表示＋コメント）
// ------------------------------------------------------------
function setupLightbox() {
  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-overlay").addEventListener("click", (e) => {
    if (e.target.id === "lightbox-overlay") closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });
}
function openLightbox(photo) {
  document.getElementById("lightbox-stage").innerHTML = photo.media_type === "video"
    ? `<video src="${photo.url}" controls autoplay></video>`
    : `<img src="${photo.url}" alt="">`;
  document.getElementById("lightbox-meta").innerHTML = `
    <div class="lightbox-actions">
      <button class="delete-photo-btn" id="lightbox-delete-btn">🗑 この写真を削除</button>
    </div>
    <div class="photo-date">${photo.photo_date}</div>
    ${photo.caption ? `<div class="photo-caption">${escapeHtml(photo.caption)}</div>` : ""}
    <div class="comment-block">
      <h4>コメント</h4>
      <div id="lightbox-comments"></div>
    </div>
  `;
  document.getElementById("lightbox-delete-btn").addEventListener("click", () => deletePhoto(photo));
  mountCommentUI(document.getElementById("lightbox-comments"), photo.id);
  document.getElementById("lightbox-overlay").classList.add("open");
}
function closeLightbox() {
  document.getElementById("lightbox-overlay").classList.remove("open");
  document.getElementById("lightbox-stage").innerHTML = "";
}

// ------------------------------------------------------------
// 写真の削除（クリックした「その1枚」だけを、2段階の確認を経て削除する）
// ------------------------------------------------------------
async function deletePhoto(photo) {
  const comments = await fetchComments(photo.id);

  const firstMessage = comments.length
    ? `この写真には${comments.length}件のコメントが付いています。写真を削除すると、そのコメントも一緒に削除されます。\n\nこの写真を削除しますか？`
    : "この写真を削除しますか？";
  if (!confirm(firstMessage)) return;
  if (!confirm("本当によろしいですか？この操作は取り消せません。")) return;

  if (comments.length) {
    await supabaseClient.from("comments").delete().eq("target_type", "photo").eq("target_id", photo.id);
  }
  const { error } = await supabaseClient.from("photos").delete().eq("id", photo.id);
  if (error) { showToast("削除に失敗しました"); console.error(error); return; }

  // ストレージ本体の削除は失敗しても致命的ではないので、うまくいかなくても続行する
  try {
    const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
    const idx = photo.url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(photo.url.slice(idx + marker.length));
      await supabaseClient.storage.from(MEDIA_BUCKET).remove([path]);
    }
  } catch (e) {
    console.warn("storage cleanup failed", e);
  }

  closeLightbox();
  showToast("写真を削除しました");
  await selectYear(STATE.currentYear);
}

// ------------------------------------------------------------
// 年ごとのプレイリスト（ランダム再生）
// ------------------------------------------------------------
async function loadPlaylist(year) {
  const { data: tracks } = await supabaseClient.from("playlist_tracks")
    .select("*").eq("community", community).eq("year", year).order("sort_order", { ascending: true });

  STATE.audio.pause();
  const btn = document.getElementById("music-toggle");

  if (!tracks || !tracks.length) {
    STATE.queue = [];
    btn.style.opacity = "0.35";
    btn.classList.remove("on");
    return;
  }
  btn.style.opacity = "1";
  STATE.queue = shuffle(tracks.map((t) => t.url));
  STATE.queueIndex = 0;
  STATE.audio.src = STATE.queue[0];
  STATE.audio.play().then(() => btn.classList.add("on")).catch(() => btn.classList.remove("on"));
}

function playNextTrack() {
  if (!STATE.queue.length) return;
  STATE.queueIndex = (STATE.queueIndex + 1) % STATE.queue.length;
  if (STATE.queueIndex === 0) STATE.queue = shuffle(STATE.queue);
  STATE.audio.src = STATE.queue[STATE.queueIndex];
  STATE.audio.play().catch(() => {});
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ------------------------------------------------------------
// 管理パネル（ノーコード編集）
// ------------------------------------------------------------
function setupAdminPanel() {
  document.getElementById("admin-close").addEventListener("click", () => {
    document.getElementById("admin-panel").classList.remove("open");
  });
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
      if (tab.dataset.target === "tab-playlist") refreshPlaylistManageList();
      if (tab.dataset.target === "tab-note") refreshNoteManageList();
    });
  });

  document.getElementById("backup-download-btn").addEventListener("click", downloadBackup);
  document.getElementById("backup-restore-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) restoreBackup(file);
  });

  // 写真追加
  document.getElementById("form-new-photo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const dateVal = f.photo_date.value;
    const files = Array.from(f.photos.files || []);
    if (!dateVal || !files.length) { showToast("日付と写真を選んでください"); return; }
    const year = parseInt(dateVal.split("-")[0], 10);
    const caption = f.caption.value.trim();
    const size = f.size ? f.size.value : "random";

    for (const file of files) {
      const url = await uploadFile(file, "photos");
      if (!url) continue;
      await supabaseClient.from("photos").insert({
        community, photo_date: dateVal, year, url,
        media_type: file.type.startsWith("video") ? "video" : "image",
        caption: caption || null,
        size
      });
    }
    showToast("写真を追加しました");
    f.reset();
    await loadYears();
    if (STATE.years.includes(year)) selectYear(year);
  });

  // 文言追加
  document.getElementById("form-new-note").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const dateVal = f.note_date.value;
    const bodyVal = f.body.value.trim();
    if (!dateVal || !bodyVal) { showToast("日付と文言を入力してください"); return; }
    const year = parseInt(dateVal.split("-")[0], 10);
    const { error } = await supabaseClient.from("notes").insert({ community, note_date: dateVal, year, body: bodyVal });
    if (error) { showToast("保存に失敗しました"); console.error(error); return; }
    showToast("文言を追加しました");
    f.reset();
    await loadYears();
    if (STATE.years.includes(year)) selectYear(year);
    refreshNoteManageList();
  });

  // プレイリスト追加
  document.getElementById("form-new-track").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    const year = parseInt(f.playlist_year.value, 10);
    const files = Array.from(f.tracks.files || []);
    if (!year || !files.length) { showToast("年と曲を選んでください"); return; }
    for (const file of files) {
      const url = await uploadFile(file, "music");
      if (!url) continue;
      await supabaseClient.from("playlist_tracks").insert({ community, year, url, title: file.name });
    }
    showToast("プレイリストに追加しました");
    f.reset();
    await loadYears();
    refreshPlaylistManageList();
    if (STATE.currentYear === year) loadPlaylist(year);
  });

  document.querySelector('#form-new-track input[name="playlist_year"]').addEventListener("change", refreshPlaylistManageList);
}

function populateThemeAwareDefaults() {
  const dateInputs = document.querySelectorAll('input[name="photo_date"], input[name="note_date"]');
  dateInputs.forEach((input) => {
    if (!input.value && STATE.currentYear) input.value = `${STATE.currentYear}-01-01`;
  });
  const yearInput = document.querySelector('input[name="playlist_year"]');
  if (yearInput && !yearInput.value) yearInput.value = STATE.currentYear || new Date().getFullYear();
}

async function refreshNoteManageList() {
  const host = document.getElementById("note-manage-list");
  if (!host || !STATE.currentYear) return;
  const { data: notes } = await supabaseClient.from("notes").select("*")
    .eq("community", community).eq("year", STATE.currentYear).order("note_date", { ascending: true });
  host.innerHTML = (notes || []).map((n) => `
    <div class="manage-item">
      <span class="m-label">${n.note_date} — ${escapeHtml(n.body.slice(0, 18))}</span>
      <button data-del-note="${n.id}">削除</button>
    </div>`).join("") || `<div style="font-size:12px;color:var(--text-dim);">今年の文言はまだありません</div>`;
  host.querySelectorAll("[data-del-note]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("この文言を削除しますか？")) return;
      await supabaseClient.from("notes").delete().eq("id", btn.dataset.delNote);
      showToast("削除しました");
      selectYear(STATE.currentYear);
      refreshNoteManageList();
    });
  });
}

async function refreshPlaylistManageList() {
  const host = document.getElementById("playlist-manage-list");
  const yearInput = document.querySelector('input[name="playlist_year"]');
  if (!host || !yearInput) return;
  const year = parseInt(yearInput.value, 10) || STATE.currentYear;
  if (!year) return;
  const { data: tracks } = await supabaseClient.from("playlist_tracks").select("*")
    .eq("community", community).eq("year", year).order("sort_order", { ascending: true });
  host.innerHTML = (tracks || []).map((t) => `
    <div class="manage-item">
      <span class="m-label">${escapeHtml(t.title || t.url)}</span>
      <button data-del-track="${t.id}">削除</button>
    </div>`).join("") || `<div style="font-size:12px;color:var(--text-dim);">この年の曲はまだありません</div>`;
  host.querySelectorAll("[data-del-track]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await supabaseClient.from("playlist_tracks").delete().eq("id", btn.dataset.delTrack);
      showToast("削除しました");
      refreshPlaylistManageList();
      if (STATE.currentYear === year) loadPlaylist(year);
    });
  });
}

// ------------------------------------------------------------
// バックアップ（データベースの記録をJSONで書き出し／読み込み）
// 写真本体はSupabase Storageに残るため対象外。日付・キャプション・
// 文言・コメントなど「記録」だけをこのファイルに保存する。
// ------------------------------------------------------------
async function downloadBackup() {
  const status = document.getElementById("backup-status");
  status.textContent = "書き出し中...";

  const [{ data: photos }, { data: notes }, { data: playlist_tracks }, { data: comments }] = await Promise.all([
    supabaseClient.from("photos").select("*").eq("community", community),
    supabaseClient.from("notes").select("*").eq("community", community),
    supabaseClient.from("playlist_tracks").select("*").eq("community", community),
    supabaseClient.from("comments").select("*").eq("community", community)
  ]);

  const backup = {
    community,
    exported_at: new Date().toISOString(),
    photos: photos || [],
    notes: notes || [],
    playlist_tracks: playlist_tracks || [],
    comments: comments || []
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `memory-backup-${community}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  const yearCounts = {};
  (photos || []).forEach((p) => { yearCounts[p.year] = (yearCounts[p.year] || 0) + 1; });
  const yearSummary = Object.keys(yearCounts).sort().map((y) => `${y}年:${yearCounts[y]}枚`).join(" / ");

  status.textContent = "ダウンロードしました";
  showToast(`バックアップ完了（写真${(photos || []).length}件・文言${(notes || []).length}件）`);
  if (yearSummary) {
    status.innerHTML = `ダウンロードしました。年ごとの写真件数：<br>${yearSummary}`;
  }
}

async function restoreBackup(file) {
  const status = document.getElementById("backup-status");
  status.textContent = "読み込み中...";
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch (err) {
    status.textContent = "ファイルを読み取れませんでした";
    return;
  }
  if (backup.community && backup.community !== community) {
    if (!confirm(`このバックアップは「${backup.community}」のものです。このページ（${community}）に復元しますか？`)) {
      status.textContent = "復元を中止しました";
      return;
    }
  }

  const tables = ["photos", "notes", "playlist_tracks", "comments"];
  for (const t of tables) {
    const rows = backup[t];
    if (!rows || !rows.length) continue;
    const { error } = await supabaseClient.from(t).upsert(rows, { onConflict: "id" });
    if (error) { console.error(`restore ${t} error:`, error); status.textContent = `${t} の復元でエラーが発生しました`; return; }
  }

  status.textContent = "復元しました";
  showToast("バックアップから復元しました");
  await loadYears();
}

// ------------------------------------------------------------
// アップロード
// ------------------------------------------------------------
async function uploadFile(file, folder) {
  const safeName = file.name.normalize("NFKD").replace(/[^\w.\-]/g, "_");
  const path = `${community}/${folder}/${Date.now()}_${safeName}`;

  const { error } = await supabaseClient.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined
  });
  if (error) {
    showToast(`アップロード失敗: ${error.message || error}`);
    console.error("uploadFile error:", error);
    return null;
  }
  const { data } = supabaseClient.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ------------------------------------------------------------
// ユーティリティ
// ------------------------------------------------------------
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
