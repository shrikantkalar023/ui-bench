(() => {
"use strict";

const G = window.GALLERY;
const SKINS = G.skins;
const byId = new Map(SKINS.map(s => [s.id, s]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const DEFAULTS = { q: "", appearance: "all", motion: "all", css: "all", source: "all", tag: "all", sort: "newest", view: "auto" };
const FILTER_KEYS = ["appearance", "motion", "css", "source", "tag"];
const MAX_COMPARE = 4;
const TAG_SKIP = new Set(["t3-code", "t3code", "t3-theme", "dark-theme", "light-theme"]);
const BADGE_TAGS = new Set([...TAG_SKIP, "custom-css", "animated", "dark", "light", "preview-only"]);
const PALETTE_ORDER = ["canvas", "sidebar", "surface", "accent", "text", "border"];
const LABELS = {
  appearance: { dark: "Dark", light: "Light", dual: "Dark + light" },
  motion: { animated: "Animated", static: "Static" },
  css: { css: "Custom CSS", palette: "Palette only" },
  source: { "t3skins.dev": "t3skins.dev", GitHub: "GitHub", X: "X only" },
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  ...DEFAULTS,
  compare: [],
  density: store.get("t3sg-density") === "compact" ? "compact" : "comfy",
  playMotion: store.get("t3sg-motion") ? store.get("t3sg-motion") === "on" : !reducedMotion.matches,
};
const cardMode = new Map();
const cards = new Map();
let currentList = [];
let openId = null;
let lastFocus = null;

const ICON = {
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  plus: '<svg class="off-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg class="on-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  dl: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
};

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const modesOf = s => (s.modes && s.modes.length ? s.modes : [s.appearance || "dark"]);
const isDual = s => { const m = modesOf(s); return m.includes("dark") && m.includes("light"); };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const fmtDate = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? (iso || "") : dateFmt.format(d); };
const fmtNum = n => new Intl.NumberFormat("en-IN").format(n);

function effMode(s) {
  const modes = modesOf(s);
  const own = cardMode.get(s.id);
  if (own && modes.includes(own)) return own;
  if (state.view !== "auto" && modes.includes(state.view)) return state.view;
  return modes[0];
}

function paletteOf(s, mode) {
  const p = s.palettes && s.palettes[mode];
  if (p) {
    const list = PALETTE_ORDER.filter(k => p[k]).map(k => ({ label: k, color: p[k] }));
    if (list.length) return list;
  }
  return s.swatches || [];
}

function popularity(s) {
  const bits = [];
  if (s.installCount != null) bits.push(`${fmtNum(s.installCount)} install${s.installCount === 1 ? "" : "s"}`);
  if (s.likeCount) bits.push(`${fmtNum(s.likeCount)} like${s.likeCount === 1 ? "" : "s"}`);
  return bits;
}

function haystack(s) {
  return (s._hay ||= [s.name, s.author, s.description, (s.tags || []).join(" "), s.source].join(" ").toLowerCase());
}
function matches(s) {
  if (state.q && !state.q.split(/\s+/).every(t => haystack(s).includes(t))) return false;
  const m = modesOf(s);
  if (state.appearance === "dark" && !m.includes("dark")) return false;
  if (state.appearance === "light" && !m.includes("light")) return false;
  if (state.appearance === "dual" && !isDual(s)) return false;
  if (state.motion === "animated" && !s.animated) return false;
  if (state.motion === "static" && s.animated) return false;
  if (state.css === "css" && !s.hasCss) return false;
  if (state.css === "palette" && s.hasCss) return false;
  if (state.source !== "all" && s.source !== state.source) return false;
  if (state.tag !== "all" && !(s.tags || []).includes(state.tag)) return false;
  return true;
}
const byName = (a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" });
const SORTS = {
  newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || byName(a, b),
  name: byName,
  installs: (a, b) => (b.installCount ?? -1) - (a.installCount ?? -1) || byName(a, b),
  likes: (a, b) => (b.likeCount ?? -1) - (a.likeCount ?? -1) || (b.installCount ?? -1) - (a.installCount ?? -1) || byName(a, b),
  animated: (a, b) => (b.animated - a.animated) || byName(a, b),
};
function filtered() { return SKINS.filter(matches).sort(SORTS[state.sort] || SORTS.newest); }

function stageHTML(s, mode, imgIndex = 0) {
  if (s.previews && s.previews[mode]) {
    return `<iframe title="${esc(s.name)} in ${mode} mode, live mock of T3 Code" src="${esc(s.previews[mode])}"></iframe>`;
  }
  const img = s.images && (s.images[imgIndex] || s.images[0]);
  if (img) return `<img src="${esc(img.src)}" alt="${esc(img.alt || s.name)}" loading="lazy" decoding="async"/>`;
  return `<div class="placeholder">No preview</div>`;
}
function stagePlaceholder(s, mode) {
  const pal = paletteOf(s, mode);
  if (!pal.length) return "";
  return `<div class="loading" aria-hidden="true">${pal.map(p => `<i style="background:${esc(p.color)}"></i>`).join("")}</div>`;
}
function mountStage(stage, s, mode, imgIndex) {
  stage.innerHTML = stageHTML(s, mode, imgIndex);
  const iframe = stage.querySelector("iframe");
  if (iframe) iframe.addEventListener("load", () => applyMotion(iframe));
}
function applyMotion(iframe) {
  try {
    const doc = iframe.contentDocument;
    if (!doc || !doc.head) return;
    let st = doc.getElementById("sg-pause");
    if (!state.playMotion && !st) {
      st = doc.createElement("style");
      st.id = "sg-pause";
      st.textContent = "*,*::before,*::after{animation-play-state:paused!important;transition:none!important}";
      doc.head.appendChild(st);
    } else if (state.playMotion && st) st.remove();
  } catch {}
}

function modeButtons(s, current, scope) {
  const modes = modesOf(s);
  return ["dark", "light"].map(m => {
    const has = modes.includes(m);
    const label = has ? `Preview ${s.name} in ${m} mode` : `${s.name} has no ${m} version`;
    return `<button type="button" data-mode="${m}" data-scope="${scope}" aria-pressed="${m === current}" ${has ? "" : "disabled"} aria-label="${esc(label)}" title="${has ? cap(m) : "No " + m + " version"}">${m === "dark" ? ICON.moon : ICON.sun}</button>`;
  }).join("");
}

function badges(s) {
  const out = [];
  if (s.hasCss) out.push("Custom CSS");
  else if (s.jsonFile) out.push("Palette only");
  const m = modesOf(s);
  out.push(isDual(s) ? "Dark + light" : cap(m[0]));
  out.push(s.source);
  return out.map(b => `<span class="chip">${esc(b)}</span>`).join("");
}

function paletteStrip(s, mode) {
  const pal = paletteOf(s, mode);
  if (!pal.length) return `<div class="palette none" aria-hidden="true"></div>`;
  return `<div class="palette" aria-hidden="true">${pal.map(p => `<i style="background:${esc(p.color)}"></i>`).join("")}</div>`;
}

function cardHTML(s) {
  const mode = effMode(s);
  const tags = (s.tags || []).filter(t => !BADGE_TAGS.has(t)).slice(0, 4).map(t => `<span class="chip tag">#${esc(t)}</span>`).join("");
  const by = [`<span class="who">${esc(s.author)}</span>`, `<span>${fmtDate(s.createdAt)}</span>`, ...popularity(s).map(p => `<span>${p}</span>`)].join("");
  const dl = s.jsonFile
    ? `<a class="btn btn-sm btn-primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json" aria-label="Download ${esc(s.name)} JSON">${ICON.dl}JSON</a>`
    : `<span class="btn btn-sm" aria-disabled="true" title="No public theme file">No file</span>`;
  return `<article class="card" data-id="${esc(s.id)}" aria-labelledby="t-${esc(s.id)}">
    <div class="frame" style="background:${esc(paletteOf(s, mode)[0]?.color || "")}">
      <div class="frame-inner" data-stage inert>${stagePlaceholder(s, mode)}</div>
      <div class="frame-hit" data-open="${esc(s.id)}" aria-hidden="true"><span>View details</span></div>
      <div class="flags">${s.animated ? `<span class="flag"><span class="dot"></span>Animated</span>` : ""}${s.jsonFile ? "" : `<span class="flag warn">Preview only</span>`}</div>
    </div>
    <div data-palette>${paletteStrip(s, mode)}</div>
    <div class="card-body">
      <div class="card-head">
        <div style="min-width:0">
          <h3 class="card-title" id="t-${esc(s.id)}">${esc(s.name)}</h3>
          <p class="byline">${by}</p>
        </div>
        <div class="modes" role="group" aria-label="Preview mode">${modeButtons(s, mode, "card")}</div>
      </div>
      <p class="desc">${esc(s.description)}</p>
      <div class="chips">${badges(s)}</div>
      ${tags ? `<div class="chips tags">${tags}</div>` : ""}
      <div class="card-actions">
        ${dl}
        <button class="btn btn-sm" type="button" data-open="${esc(s.id)}" aria-label="Details for ${esc(s.name)}">Details</button>
        <span class="spacer"></span>
        <button class="btn btn-sm cmp-btn" type="button" data-compare="${esc(s.id)}" aria-pressed="false" aria-label="Add ${esc(s.name)} to compare">${ICON.plus}${ICON.check}Compare</button>
        ${s.sourceUrl ? `<a class="icon-btn src-link" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener" aria-label="${esc(s.name)} source (opens new tab)" title="Source">${ICON.ext}</a>` : ""}
      </div>
    </div>
  </article>`;
}

const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const id = e.target.dataset.id;
    io.unobserve(e.target);
    const c = cards.get(id);
    c.seen = true;
    refreshCard(id);
  }
}, { rootMargin: "500px 0px" }) : null;

function buildCards() {
  const grid = $("#grid");
  grid.innerHTML = SKINS.map(cardHTML).join("");
  for (const el of grid.children) {
    const id = el.dataset.id;
    cards.set(id, { el, mode: null, seen: !io });
    if (io) io.observe(el); else refreshCard(id);
  }
}

function refreshCard(id) {
  const c = cards.get(id);
  const s = byId.get(id);
  const mode = effMode(s);
  $$("[data-mode]", c.el).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  if (c.mode !== mode) {
    $("[data-palette]", c.el).innerHTML = paletteStrip(s, mode);
  }
  if (c.seen && c.mode !== mode) {
    mountStage($("[data-stage]", c.el), s, mode);
    c.mode = mode;
  }
}

function syncCompareButtons() {
  for (const [id, c] of cards) {
    const on = state.compare.includes(id);
    const b = $("[data-compare]", c.el);
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", `${on ? "Remove" : "Add"} ${byId.get(id).name} ${on ? "from" : "to"} compare`);
  }
}

function render() {
  currentList = filtered();
  const grid = $("#grid");
  const visible = new Set(currentList.map(s => s.id));
  const domOrder = [...grid.children].filter(el => visible.has(el.dataset.id)).map(el => el.dataset.id);
  const wantOrder = currentList.map(s => s.id);
  if (domOrder.join() !== wantOrder.join()) {
    const frag = document.createDocumentFragment();
    wantOrder.forEach(id => frag.appendChild(cards.get(id).el));
    SKINS.forEach(s => { if (!visible.has(s.id)) frag.appendChild(cards.get(s.id).el); });
    for (const [, c] of cards) { if (c.mode) { c.mode = null; c.seen = false; if (io) io.observe(c.el); } }
    grid.appendChild(frag);
  }
  for (const [id, c] of cards) c.el.hidden = !visible.has(id);
  grid.classList.toggle("compact", state.density === "compact");
  $("#empty").hidden = currentList.length > 0;
  $("#stickyCount").textContent = `${currentList.length}/${SKINS.length}`;
  $("#status").innerHTML = currentList.length === SKINS.length
    ? `<b>${SKINS.length}</b> skins`
    : `<b>${currentList.length}</b> of ${SKINS.length} skins`;
  renderActiveFilters();
  writeHash();
}

function renderActiveFilters() {
  const pills = [];
  if (state.q) pills.push(["q", `“${state.q}”`]);
  for (const k of FILTER_KEYS) {
    if (state[k] === "all") continue;
    pills.push([k, k === "tag" ? `#${state.tag}` : LABELS[k][state[k]]]);
  }
  const box = $("#activeFilters");
  box.innerHTML = pills.map(([k, label]) => `<button class="pill" type="button" data-clear="${k}" aria-label="Remove filter ${esc(label)}">${esc(label)}${ICON.x}</button>`).join("")
    + (pills.length > 1 ? `<button class="link-btn" type="button" data-reset>Clear all</button>` : "");
  const n = FILTER_KEYS.filter(k => state[k] !== "all").length;
  const fc = $("#filterCount");
  fc.hidden = !n;
  fc.textContent = n;
}

function syncControls() {
  const search = $("#search");
  if (search.value.trim().toLowerCase() !== state.q) search.value = state.q;
  for (const k of ["appearance", "motion", "css", "view"]) {
    const r = $(`input[name="${k}"][value="${CSS.escape(state[k])}"]`);
    if (r) r.checked = true;
  }
  ensureTagOption(state.tag);
  $("#source").value = state.source;
  $("#tag").value = state.tag;
  $("#sort").value = state.sort;
  $(`input[name="density"][value="${state.density}"]`).checked = true;
  $("#motionToggle").checked = state.playMotion;
  document.body.classList.toggle("paused", !state.playMotion);
}

function setState(patch) {
  Object.assign(state, patch);
  syncControls();
  render();
}

let hashQueued = false;
function writeHash() {
  if (hashQueued) return;
  hashQueued = true;
  queueMicrotask(() => {
    hashQueued = false;
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(DEFAULTS)) if (state[k] !== v) p.set(k, state[k]);
    if (state.compare.length) p.set("compare", state.compare.join(","));
    if (openId) p.set("skin", openId);
    const str = p.toString();
    const url = str ? `#${str}` : location.pathname + location.search;
    if (url === location.hash || (!str && !location.hash)) return;
    try { history.replaceState(null, "", url); } catch {}
  });
}
function readHash() {
  const raw = location.hash.slice(1);
  if (!raw.includes("=")) return null;
  const p = new URLSearchParams(raw);
  const next = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) if (p.has(k)) next[k] = p.get(k);
  next.q = next.q.trim().toLowerCase();
  if (!SORTS[next.sort]) next.sort = "newest";
  if (!["auto", "dark", "light"].includes(next.view)) next.view = "auto";
  next.compare = (p.get("compare") || "").split(",").filter(id => byId.has(id)).slice(0, MAX_COMPARE);
  return { state: next, skin: p.get("skin") };
}

function buildTagOptions() {
  const counts = {};
  SKINS.forEach(s => (s.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  const sel = $("#tag");
  Object.entries(counts)
    .filter(([t, n]) => n >= 2 && !TAG_SKIP.has(t))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([t, n]) => sel.add(new Option(`${t} (${n})`, t)));
  sel._counts = counts;
}
function ensureTagOption(t) {
  const sel = $("#tag");
  if (t === "all" || [...sel.options].some(o => o.value === t)) return;
  sel.add(new Option(`${t} (${sel._counts[t] || 0})`, t));
}

const dlg = $("#details");

function detailsHTML(s) {
  const mode = effMode(s);
  const idx = currentList.findIndex(x => x.id === s.id);
  const pos = idx >= 0 ? `Skin ${idx + 1} of ${currentList.length}` : "Skin";
  const tags = (s.tags || []).map(t => `<button class="chip tag tag-btn" type="button" data-tagfilter="${esc(t)}" aria-label="Show skins tagged ${esc(t)}">#${esc(t)}</button>`).join("");
  const links = (s.links || []).map(l => `<a class="btn btn-sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${ICON.ext}</a>`).join("");
  const file = `${s.id}.json`;
  const install = s.jsonFile
    ? `<div class="install-box">
        <p class="section-label">Install in T3 Code</p>
        <ol>
          <li>Download <code>${esc(file)}</code>.</li>
          <li>Open <b>Settings → Appearance</b>, press <b>Add</b>, and drop the file in.</li>
          <li>Or on the server:</li>
        </ol>
        <div class="cmd"><code>t3 theme set ${esc(file)}</code><button class="copy-btn" type="button" data-copy="t3 theme set ${esc(file)}">Copy</button></div>
        <a class="btn btn-primary" href="${esc(s.jsonFile)}" download="${esc(file)}">${ICON.dl}Download ${esc(file)}</a>
      </div>`
    : `<div class="install-box"><p class="section-label">Install</p><p class="d" style="margin:0;color:var(--muted)">No public theme file was found for this one. Use the source link for the original post.</p></div>`;
  const thumbs = (s.images || []).length > 1 && !(s.previews && s.previews[mode])
    ? `<div class="thumbs" role="group" aria-label="Screenshots">${s.images.map((im, i) => `<button type="button" data-img="${i}" aria-pressed="${i === 0}" aria-label="Screenshot ${i + 1}"><img src="${esc(im.src)}" alt=""/></button>`).join("")}</div>` : "";
  const note = s.previews && s.previews[mode] ? `Live mock · ${mode}` : (s.images || []).length ? "Screenshot from the author’s post" : "";
  const inCompare = state.compare.includes(s.id);
  return `
  <div class="sheet-bar">
    <span class="crumb">${pos} · ${esc(s.source)}</span>
    <button class="icon-btn" type="button" data-nav="-1" aria-label="Previous skin" title="Previous (←)">${ICON.left}</button>
    <button class="icon-btn" type="button" data-nav="1" aria-label="Next skin" title="Next (→)">${ICON.right}</button>
    <button class="icon-btn" type="button" data-close aria-label="Close details" title="Close (Esc)">${ICON.x}</button>
  </div>
  <div class="sheet-scroll">
    <div class="detail">
      <div class="detail-stage">
        <div class="stage-bar">
          <div class="modes" role="group" aria-label="Preview mode">${modeButtons(s, mode, "detail")}</div>
          <p class="stage-note">${note}</p>
        </div>
        <div class="frame">
          <div class="frame-inner" data-stage></div>
          <div class="flags">${s.animated ? `<span class="flag"><span class="dot"></span>Animated</span>` : ""}</div>
        </div>
        ${thumbs}
      </div>
      <div class="detail-info">
        <div>
          <h2 id="dTitle">${esc(s.name)}</h2>
          <p class="byline"><span class="who">by ${esc(s.author)}</span><span>${esc(s.source)}</span><span>${fmtDate(s.createdAt)}</span>${popularity(s).map(p => `<span>${p}</span>`).join("")}</p>
        </div>
        <p class="d">${esc(s.description)}</p>
        <div class="chips">${s.animated ? `<span class="chip">Animated</span>` : `<span class="chip">Static</span>`}${badges(s)}</div>
        <div data-swatches>${swatchBlock(s, mode)}</div>
        ${tags ? `<div><p class="section-label">Tags</p><div class="chips">${tags}</div></div>` : ""}
        ${install}
        <div>
          <p class="section-label">Links</p>
          <div class="links">${links}
            <button class="btn btn-sm cmp-btn" type="button" data-compare="${esc(s.id)}" aria-pressed="${inCompare}">${ICON.plus}${ICON.check}Compare</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function swatchBlock(s, mode) {
  const pal = paletteOf(s, mode);
  if (!pal.length) return "";
  return `<p class="section-label">Palette${s.palettes && s.palettes[mode] ? ` · ${mode}` : ""} <span style="text-transform:none;letter-spacing:0">(click to copy)</span></p>
    <div class="swatches">${pal.map(p => `<button class="swatch" type="button" data-copy="${esc(p.color)}" aria-label="Copy ${esc(p.label)} colour ${esc(p.color)}"><i style="background:${esc(p.color)}"></i><span>${esc(p.label)}<b>${esc(p.color)}</b></span></button>`).join("")}</div>`;
}

function openDetails(id, { keepFocus } = {}) {
  const s = byId.get(id);
  if (!s) return;
  if (!keepFocus && !dlg.open) lastFocus = document.activeElement;
  openId = id;
  dlg.innerHTML = detailsHTML(s);
  mountStage($("[data-stage]", dlg), s, effMode(s));
  if (!dlg.open) dlg.showModal();
  if (keepFocus) {
    const target = $(`[data-nav="${keepFocus}"]`, dlg);
    target && target.focus();
  } else {
    $("[data-close]", dlg).focus();
  }
  writeHash();
}

function navDetails(step) {
  if (!openId) return;
  const list = currentList.length ? currentList : SKINS;
  let i = list.findIndex(s => s.id === openId);
  i = i < 0 ? 0 : (i + step + list.length) % list.length;
  openDetails(list[i].id, { keepFocus: String(step) });
}

dlg.addEventListener("close", () => {
  const id = openId;
  openId = null;
  dlg.innerHTML = "";
  writeHash();
  const card = id && cards.get(id);
  const back = (lastFocus && lastFocus !== document.body && document.contains(lastFocus)) ? lastFocus
    : card && !card.el.hidden ? $("[data-open]:not(.frame-hit)", card.el) : null;
  if (back) back.focus({ preventScroll: false });
  lastFocus = null;
});

const cmp = $("#compare");
let compareView = "auto";

function toggleCompare(id) {
  const i = state.compare.indexOf(id);
  if (i >= 0) state.compare.splice(i, 1);
  else {
    if (state.compare.length >= MAX_COMPARE) { toast(`Compare holds ${MAX_COMPARE} skins. Remove one first.`); return; }
    state.compare.push(id);
  }
  syncCompare();
}

function syncCompare() {
  syncCompareButtons();
  $$("#details [data-compare]").forEach(b => b.setAttribute("aria-pressed", String(state.compare.includes(b.dataset.compare))));
  const tray = $("#tray");
  tray.hidden = state.compare.length === 0;
  $("#trayCount").textContent = state.compare.length;
  $("#trayList").innerHTML = state.compare.map(id => {
    const s = byId.get(id);
    return `<li><button class="pill" type="button" data-compare="${esc(id)}" aria-label="Remove ${esc(s.name)} from compare">${esc(s.name)}${ICON.x}</button></li>`;
  }).join("");
  const btn = $("#trayCompare");
  btn.disabled = state.compare.length < 2;
  btn.title = state.compare.length < 2 ? "Pick at least 2 skins" : "";
  btn.textContent = state.compare.length < 2 ? "Pick one more" : `Compare ${state.compare.length}`;
  if (cmp.open) {
    if (state.compare.length) renderCompare(); else cmp.close();
  }
  writeHash();
}

function compareMode(s) {
  const m = modesOf(s);
  return compareView !== "auto" && m.includes(compareView) ? compareView : m[0];
}

function renderCompare() {
  const list = state.compare.map(id => byId.get(id));
  cmp.innerHTML = `
    <div class="sheet-bar">
      <h2 id="cTitle" class="crumb" style="margin-right:0">Compare ${list.length} skins</h2>
      <fieldset class="seg" style="margin-left:auto">
        <legend class="sr-only">Preview as</legend>
        <div class="seg-track">
          ${["auto", "dark", "light"].map(v => `<label><input type="radio" name="cview" value="${v}" ${v === compareView ? "checked" : ""}/><span>${v === "auto" ? "Default" : cap(v)}</span></label>`).join("")}
        </div>
      </fieldset>
      <button class="icon-btn" type="button" data-close aria-label="Close compare">${ICON.x}</button>
    </div>
    <div class="sheet-scroll">
      <div class="compare-grid" style="--n:${list.length}">
        ${list.map(s => {
          const mode = compareMode(s);
          const pal = paletteOf(s, mode);
          return `<section class="compare-col" aria-label="${esc(s.name)}">
            <div class="frame"><div class="frame-inner" data-cstage="${esc(s.id)}" inert></div></div>
            <div>
              <h3>${esc(s.name)}</h3>
              <p class="byline"><span class="who">${esc(s.author)}</span><span>${mode}${modesOf(s).includes(compareView) || compareView === "auto" ? "" : ` (no ${compareView})`}</span></p>
            </div>
            ${pal.length ? `<div class="swatches">${pal.map(p => `<button class="swatch" type="button" data-copy="${esc(p.color)}" aria-label="Copy ${esc(p.label)} colour ${esc(p.color)}"><i style="background:${esc(p.color)}"></i><span>${esc(p.label)}<b>${esc(p.color)}</b></span></button>`).join("")}</div>` : `<p class="stage-note">No palette data</p>`}
            <dl>
              <dt>Modes</dt><dd>${modesOf(s).map(cap).join(" + ")}</dd>
              <dt>Motion</dt><dd>${s.animated ? "Animated" : "Static"}</dd>
              <dt>Styling</dt><dd>${s.hasCss ? "Custom CSS" : s.jsonFile ? "Palette only" : "No file"}</dd>
              <dt>Source</dt><dd>${esc(s.source)}</dd>
              <dt>Added</dt><dd>${fmtDate(s.createdAt)}</dd>
              ${popularity(s).length ? `<dt>Reach</dt><dd>${popularity(s).join(" · ")}</dd>` : ""}
            </dl>
            <div class="col-actions">
              ${s.jsonFile ? `<a class="btn btn-sm btn-primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">${ICON.dl}JSON</a>` : ""}
              <button class="btn btn-sm" type="button" data-open-from-compare="${esc(s.id)}">Details</button>
              <button class="btn btn-sm btn-ghost" type="button" data-compare="${esc(s.id)}">Remove</button>
            </div>
          </section>`;
        }).join("")}
      </div>
    </div>`;
  list.forEach(s => mountStage($(`[data-cstage="${CSS.escape(s.id)}"]`, cmp), s, compareMode(s)));
}

function openCompare() {
  if (state.compare.length < 2) return;
  lastFocus = document.activeElement;
  renderCompare();
  cmp.showModal();
  $("[data-close]", cmp).focus();
}
cmp.addEventListener("close", () => {
  cmp.innerHTML = "";
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  lastFocus = null;
});
cmp.addEventListener("change", e => {
  if (e.target.name === "cview") { compareView = e.target.value; renderCompare(); $(`input[name="cview"][value="${compareView}"]`, cmp).focus(); }
});

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    ta.remove();
  }
  toast(`Copied ${text}`);
}

function renderStats() {
  const c = {
    total: SKINS.length,
    animated: SKINS.filter(s => s.animated).length,
    css: SKINS.filter(s => s.hasCss).length,
    json: SKINS.filter(s => s.jsonFile).length,
  };
  const src = ["t3skins.dev", "GitHub", "X"].map(k => [k, SKINS.filter(s => s.source === k).length]);
  $("#stats").innerHTML = `
    <div class="stat"><dt>Skins</dt><dd>${c.total}</dd></div>
    <div class="stat"><dt>Animated</dt><dd>${c.animated}</dd></div>
    <div class="stat"><dt>Custom CSS</dt><dd>${c.css}</dd></div>
    <div class="stat"><dt>With JSON</dt><dd>${c.json}</dd></div>
    <div class="stat wide"><dt>By source</dt><dd>${src.map(([k, n]) => `<span>${esc(k)} <b>${n}</b></span>`).join("")}</dd></div>`;
}

function applyTheme(t) {
  const root = document.documentElement;
  root.dataset.theme = t;
  store.set("t3sg-theme", t);
  $("#themeToggle").setAttribute("aria-label", `Switch to ${t === "dark" ? "light" : "dark"} page theme`);
}
function currentTheme() {
  return document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

function syncFiltersExpanded() {
  const visible = getComputedStyle($("#filterPanel")).display !== "none";
  $("#filtersToggle").setAttribute("aria-expanded", String(visible));
}

function bind() {
  let qTimer;
  $("#search").addEventListener("input", e => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); render(); }, 90);
  });
  $$('#browse input[type="radio"]').forEach(r => r.addEventListener("change", () => {
    if (r.name === "density") { state.density = r.value; store.set("t3sg-density", r.value); render(); return; }
    state[r.name] = r.value;
    if (r.name === "view") { cardMode.clear(); for (const id of cards.keys()) refreshCard(id); writeHash(); return; }
    render();
  }));
  for (const id of ["source", "tag", "sort"]) $(`#${id}`).addEventListener("change", e => { state[id] = e.target.value; render(); });
  $("#motionToggle").addEventListener("change", e => {
    state.playMotion = e.target.checked;
    store.set("t3sg-motion", state.playMotion ? "on" : "off");
    document.body.classList.toggle("paused", !state.playMotion);
    $$("iframe").forEach(applyMotion);
  });
  $("#filtersToggle").addEventListener("click", () => {
    const browse = $("#browse");
    const panel = $("#filterPanel");
    const stuck = $("#toolbar").classList.contains("stuck");
    if (stuck) {
      browse.classList.add("expanded");
      panel.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
      const first = $("input:checked", panel);
      first && first.focus({ preventScroll: true });
    } else {
      browse.classList.toggle("expanded");
    }
    syncFiltersExpanded();
  });
  if ("IntersectionObserver" in window) {
    const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--top"), 10) || 56;
    new IntersectionObserver(([e]) => {
      $("#toolbar").classList.toggle("stuck", !e.isIntersecting && e.boundingClientRect.top < top);
    }, { rootMargin: `-${top}px 0px 0px 0px` }).observe($("#toolbarSentinel"));
  }
  matchMedia("(max-width: 860px)").addEventListener("change", syncFiltersExpanded);
  syncFiltersExpanded();
  $("#themeToggle").addEventListener("click", () => applyTheme(currentTheme() === "dark" ? "light" : "dark"));
  $("#randomBtn").addEventListener("click", () => {
    const pool = currentList.length ? currentList : SKINS;
    openDetails(pool[Math.floor(Math.random() * pool.length)].id);
  });
  $("#trayClear").addEventListener("click", () => { state.compare = []; syncCompare(); });
  $("#trayCompare").addEventListener("click", openCompare);

  document.addEventListener("click", e => {
    const t = e.target;
    const dlLink = location.protocol === "file:" && t.closest("a[download]");
    if (dlLink) {
      e.preventDefault();
      window.open(dlLink.href, "_blank", "noopener");
      toast("Opened the JSON in a new tab. Save it with Ctrl/Cmd+S.");
      return;
    }
    const modeBtn = t.closest("[data-mode]");
    if (modeBtn && !modeBtn.disabled) {
      const mode = modeBtn.dataset.mode;
      if (modeBtn.dataset.scope === "detail") {
        cardMode.set(openId, mode);
        const s = byId.get(openId);
        $$("[data-mode]", dlg).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
        mountStage($("[data-stage]", dlg), s, mode);
        $("[data-swatches]", dlg).innerHTML = swatchBlock(s, mode);
        $(".stage-note", dlg).textContent = `Live mock · ${mode}`;
        refreshCard(openId);
      } else {
        const id = modeBtn.closest(".card").dataset.id;
        cardMode.set(id, mode);
        refreshCard(id);
      }
      return;
    }
    const cmpBtn = t.closest("[data-compare]");
    if (cmpBtn) { toggleCompare(cmpBtn.dataset.compare); return; }
    const fromCmp = t.closest("[data-open-from-compare]");
    if (fromCmp) { const id = fromCmp.dataset.openFromCompare; cmp.close(); openDetails(id); return; }
    const open = t.closest("[data-open]");
    if (open) { openDetails(open.dataset.open); return; }
    const nav = t.closest("[data-nav]");
    if (nav) { navDetails(Number(nav.dataset.nav)); return; }
    const img = t.closest("[data-img]");
    if (img) {
      const s = byId.get(openId);
      $$("[data-img]", dlg).forEach(b => b.setAttribute("aria-pressed", String(b === img)));
      mountStage($("[data-stage]", dlg), s, effMode(s), Number(img.dataset.img));
      return;
    }
    const cp = t.closest("[data-copy]");
    if (cp) { copy(cp.dataset.copy); return; }
    const tagBtn = t.closest("[data-tagfilter]");
    if (tagBtn) {
      dlg.close();
      setState({ tag: tagBtn.dataset.tagfilter });
      $("#gallery").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
      return;
    }
    const clr = t.closest("[data-clear]");
    if (clr) { const k = clr.dataset.clear; setState({ [k]: DEFAULTS[k] }); $("#search").focus(); return; }
    if (t.closest("[data-reset]")) {
      const p = {}; for (const k of ["q", ...FILTER_KEYS]) p[k] = DEFAULTS[k];
      setState(p); $("#search").focus(); return;
    }
    if (t.closest("[data-close]")) { t.closest("dialog").close(); return; }
    if (t.tagName === "DIALOG") t.close();
  });

  document.addEventListener("keydown", e => {
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== "radio" && e.target.type !== "checkbox";
    if (dlg.open && !typing && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.target.closest(".seg,.modes")) {
      e.preventDefault();
      navDetails(e.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (e.key === "/" && !typing && !dlg.open && !cmp.open && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const s = $("#search");
      s.focus(); s.select();
    }
    if (e.key === "Escape" && e.target.id === "search" && e.target.value) {
      e.target.value = ""; state.q = ""; render();
    }
  });

  window.addEventListener("hashchange", () => {
    const h = readHash();
    if (!h) return;
    Object.assign(state, h.state);
    syncControls();
    render();
    syncCompare();
    if (h.skin && byId.has(h.skin) && h.skin !== openId) openDetails(h.skin);
  });
}

function boot() {
  const h = readHash();
  if (h) Object.assign(state, h.state);
  buildTagOptions();
  renderStats();
  buildCards();
  bind();
  syncControls();
  render();
  syncCompare();
  $("#themeToggle").setAttribute("aria-label", `Switch to ${currentTheme() === "dark" ? "light" : "dark"} page theme`);
  if (h && h.skin && byId.has(h.skin)) openDetails(h.skin);
}
boot();
})();
