(() => {
"use strict";

const G = window.GALLERY;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const icon = name => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;

const grid = $("#grid");
if (!G || !Array.isArray(G.skins)) {
  grid.innerHTML = `<p class="empty">The catalogue file <code>data.js</code> did not load. Keep it next to <code>index.html</code>.</p>`;
  return;
}

const skins = G.skins;
const byId = new Map(skins.map(s => [s.id, s]));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const MAX_COMPARE = 3;
const PALETTE_KEYS = ["canvas", "sidebar", "surface", "text", "accent", "border"];
const REDUNDANT_TAGS = new Set(["dark", "light", "custom-css", "animated", "preview-only", "light-and-dark", "t3-code", "t3code", "t3-theme", "dark-theme", "light-theme"]);
const GENERIC_TAGS = new Set(["t3-code", "t3code", "t3-theme", "dark-theme", "light-theme"]);

const store = {
  get(key, fallback) { try { return localStorage.getItem("t3skins:" + key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("t3skins:" + key, value); } catch {} },
};

const DEFAULTS = { q: "", appearance: "all", motion: "all", css: "all", source: "all", tag: "all", sort: "newest" };
const OPTIONS = {
  appearance: ["all", "dark", "light", "dual"],
  motion: ["all", "animated", "static"],
  css: ["all", "css", "palette"],
  source: ["all", "t3skins.dev", "GitHub", "X"],
  sort: ["newest", "name", "installs", "likes", "animated"],
};
const LABELS = {
  appearance: { dark: "Dark", light: "Light", dual: "Dark + light" },
  motion: { animated: "Animated", static: "Static" },
  css: { css: "Custom CSS", palette: "Palette only" },
  source: { "t3skins.dev": "t3skins.dev", GitHub: "GitHub", X: "X only" },
};
const GROUP_NAMES = { appearance: "Mode", motion: "Motion", css: "Styling", source: "Source", tag: "Tag" };

const state = { ...DEFAULTS };
const prefs = {
  density: store.get("density", "comfortable") === "compact" ? "compact" : "comfortable",
  live: store.get("live", "on") !== "off",
};
let rawQuery = "";
let visible = [];
let detailId = null;
const compare = [];
const cards = new Map();

const modesOf = s => (s.modes && s.modes.length ? s.modes : [s.appearance || "dark"]);
const isDual = s => { const m = modesOf(s); return m.includes("dark") && m.includes("light"); };
const hasFile = s => Boolean(s.jsonFile);
const modesLabel = s => isDual(s) ? "Dark + light" : modesOf(s)[0] === "light" ? "Light" : "Dark";
const tagsFor = s => (s.tags || []).filter(t => !REDUNDANT_TAGS.has(t));

const dateFmt = (opts) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Calcutta", ...opts });
const fmtShort = dateFmt({ day: "numeric", month: "short" });
const fmtFull = dateFmt({ day: "numeric", month: "short", year: "numeric" });
const fmtTime = dateFmt({ day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
function fmtDate(iso, fmt = fmtFull) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
}
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const rgbCache = new Map();
function rgbOf(color, mode) {
  const key = mode + "|" + color;
  if (rgbCache.has(key)) return rgbCache.get(key);
  let out = mode === "light" ? [245, 245, 245] : [20, 20, 20];
  if (probe && color) {
    probe.canvas.width = probe.canvas.height = 1;
    probe.fillStyle = mode === "light" ? "#fff" : "#000";
    probe.fillRect(0, 0, 1, 1);
    probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data;
    out = [d[0], d[1], d[2]];
  }
  rgbCache.set(key, out);
  return out;
}
const luminance = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
function hueOf([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 14) return -1;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function paletteOf(s, mode) {
  const raw = s.palettes && (s.palettes[mode] || s.palettes[modesOf(s)[0]]);
  if (!raw) return null;
  const canvas = raw.canvas || (mode === "light" ? "#fafafa" : "#111111");
  const darkCanvas = luminance(rgbOf(canvas, mode)) < 0.45;
  const text = raw.text || (darkCanvas ? "#ececec" : "#1b1b1b");
  return {
    canvas,
    sidebar: raw.sidebar || canvas,
    surface: raw.surface || canvas,
    border: raw.border || (darkCanvas ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.14)"),
    accent: raw.accent || text,
    text,
  };
}
function swatchesOf(s, mode) {
  if (mode === modesOf(s)[0] && s.swatches && s.swatches.length) return s.swatches;
  const raw = s.palettes && s.palettes[mode];
  if (!raw) return s.swatches || [];
  return PALETTE_KEYS.filter(k => raw[k]).map(k => ({ label: k, color: raw[k] }));
}
function posterVars(s, mode) {
  const p = paletteOf(s, mode);
  if (!p) return "";
  return Object.entries(p).map(([k, v]) => `--p-${k}:${v}`).join(";");
}

function textMatch(s, q) {
  if (!q) return true;
  const blob = [s.name, s.author, s.description, (s.tags || []).join(" "), s.source].join(" ").toLowerCase();
  return q.split(/\s+/).every(t => blob.includes(t));
}
function matches(s, st) {
  if (!textMatch(s, st.q)) return false;
  const modes = modesOf(s);
  if (st.appearance === "dark" && !modes.includes("dark")) return false;
  if (st.appearance === "light" && !modes.includes("light")) return false;
  if (st.appearance === "dual" && !isDual(s)) return false;
  if (st.motion === "animated" && !s.animated) return false;
  if (st.motion === "static" && s.animated) return false;
  if (st.css === "css" && !s.hasCss) return false;
  if (st.css === "palette" && s.hasCss) return false;
  if (st.source !== "all" && s.source !== st.source) return false;
  if (st.tag !== "all" && !(s.tags || []).includes(st.tag)) return false;
  return true;
}
function sorted() {
  const time = s => Date.parse(s.createdAt || 0) || 0;
  const name = s => (s.name || "").toLowerCase();
  const byName = (a, b) => name(a).localeCompare(name(b));
  const byNewest = (a, b) => time(b) - time(a) || byName(a, b);
  const compareBy = {
    newest: byNewest,
    name: byName,
    installs: (a, b) => (b.installCount ?? -1) - (a.installCount ?? -1) || byNewest(a, b),
    likes: (a, b) => (b.likeCount ?? -1) - (a.likeCount ?? -1) || byNewest(a, b),
    animated: (a, b) => (a.animated ? 0 : 1) - (b.animated ? 0 : 1) || byName(a, b),
  }[state.sort];
  return [...skins].sort(compareBy);
}

function factsHTML(s) {
  const bits = [];
  if (s.animated) bits.push(`<li class="is-live"><span class="dot" aria-hidden="true"></span>Animated</li>`);
  if (s.hasCss) bits.push(`<li>Custom CSS</li>`);
  else if (hasFile(s)) bits.push(`<li>Palette only</li>`);
  bits.push(`<li>${modesLabel(s)}</li>`);
  if (!hasFile(s)) bits.push(`<li class="is-warn">No file</li>`);
  return `<ul class="facts">${bits.join("")}</ul>`;
}
const tagsHTML = (tags) => tags.length
  ? `<div class="tags">${tags.map(t => `<button class="tag" type="button" data-tag="${esc(t)}" title="Filter by tag ${esc(t)}">${esc(t)}</button>`).join("")}</div>`
  : "";
const stripHTML = (s, mode) => {
  const sw = swatchesOf(s, mode);
  if (!sw.length) return "";
  return `<div class="strip" role="img" aria-label="Palette: ${esc(sw.map(x => `${x.label} ${x.color}`).join(", "))}">${sw.map(x => `<i style="background:${esc(x.color)}"></i>`).join("")}</div>`;
};
const NEW_TAB_ON_FILE = location.protocol === "file:" ? ` target="_blank" rel="noopener"` : "";
const downloadHTML = (s, label = "Download JSON") => hasFile(s)
  ? `<a class="btn btn-primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json"${NEW_TAB_ON_FILE}>${icon("down")}<span>${label}</span></a>`
  : "";

function previewHTML(s, mode, context) {
  const modes = modesOf(s);
  const toggle = modes.length > 1
    ? `<div class="pv-modes" role="group" aria-label="Preview appearance">${modes.map(m => `<button type="button" data-mode="${m}" aria-pressed="${m === mode}">${m}</button>`).join("")}</div>`
    : "";
  const open = context === "card"
    ? `<button class="pv-open" type="button" data-open="${esc(s.id)}" aria-label="Open details for ${esc(s.name)}" tabindex="-1"></button>`
    : "";
  let stage;
  if (s.previews && s.previews[mode]) {
    stage = `<div class="poster" aria-hidden="true"><div class="poster-side"><i></i><b></b><b></b></div><div class="poster-main"><u></u><u></u><u></u></div><div class="poster-comp"><em></em></div></div>
      <button class="pv-play" type="button" data-play hidden>${icon("play")}<span>Play live preview</span></button>`;
  } else if (s.images && s.images[0]) {
    const img = s.images[0];
    stage = `<img src="${esc(img.src)}" alt="${esc(img.alt || s.name)}" loading="lazy" decoding="async"/>`;
  } else {
    stage = `<div class="pv-none">No preview</div>`;
  }
  return `<div class="pv" data-pv="${esc(s.id)}" data-mode="${mode}" data-context="${context}" style="${esc(posterVars(s, mode))}">${stage}${open}${toggle}</div>`;
}

function cardEl(s) {
  const mode = modesOf(s)[0];
  const meta = [s.source, fmtDate(s.createdAt, fmtShort), s.installCount != null ? plural(s.installCount, "install") : ""].filter(Boolean).join(" · ");
  const primary = hasFile(s)
    ? downloadHTML(s)
    : (s.sourceUrl ? `<a class="btn btn-primary" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${icon("out")}<span>View post</span></a>` : "");
  const source = hasFile(s) && s.sourceUrl
    ? `<a class="icon-btn btn-src" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener" aria-label="Source of ${esc(s.name)} on ${esc(s.source)}" title="Source: ${esc(s.source)}">${icon("out")}</a>`
    : "";
  const el = document.createElement("article");
  el.className = "card";
  el.dataset.id = s.id;
  el.innerHTML = `
    ${previewHTML(s, mode, "card")}
    ${stripHTML(s, mode)}
    <div class="card-body">
      <div class="card-head">
        <div class="card-title">
          <h3><button class="card-open" type="button" data-open="${esc(s.id)}">${esc(s.name)}</button></h3>
          <p class="card-by">by ${esc(s.author)}</p>
          <p class="card-meta">${esc(meta)}</p>
        </div>
        <button class="cmp" type="button" data-compare="${esc(s.id)}" aria-pressed="false" aria-label="Compare ${esc(s.name)}">${icon("plus")}<span>Compare</span></button>
      </div>
      ${s.description ? `<p class="card-desc">${esc(s.description)}</p>` : ""}
      ${factsHTML(s)}
      ${tagsHTML(tagsFor(s).slice(0, 4))}
      <div class="card-foot">
        ${primary}
        <button class="btn btn-details" type="button" data-open="${esc(s.id)}">Details</button>
        ${source}
      </div>
    </div>`;
  return el;
}

const scaler = new ResizeObserver(entries => {
  for (const e of entries) {
    const base = Number(getComputedStyle(e.target).getPropertyValue("--vw")) || 600;
    if (e.contentRect.width) e.target.style.setProperty("--s", (e.contentRect.width / base).toFixed(4));
  }
});
const nearView = new IntersectionObserver(entries => {
  for (const e of entries) {
    e.target._near = e.isIntersecting;
    syncFrame(e.target);
  }
}, { rootMargin: "70% 0px" });

function shouldPlay(pv, s) {
  if (pv._forced) return true;
  if (reducedMotion.matches && s.animated) return false;
  return pv.dataset.context === "card" ? prefs.live : true;
}
function syncFrame(pv) {
  const s = byId.get(pv.dataset.pv);
  const src = s && s.previews && s.previews[pv.dataset.mode];
  if (!src) return;
  const play = shouldPlay(pv, s);
  const playBtn = $(".pv-play", pv);
  if (playBtn) playBtn.hidden = play;
  let frame = $("iframe", pv);
  if (!play || !pv._near) {
    if (frame) frame.remove();
    return;
  }
  if (frame && frame.dataset.src === src) return;
  if (frame) frame.remove();
  frame = document.createElement("iframe");
  frame.title = `${s.name} live preview, ${pv.dataset.mode}`;
  frame.dataset.src = src;
  frame.tabIndex = -1;
  frame.addEventListener("load", () => frame.classList.add("is-on"), { once: true });
  frame.src = src;
  pv.insertBefore(frame, $(".poster", pv).nextSibling);
}
function watch(pv, always) {
  scaler.observe(pv);
  if (always) { pv._near = true; syncFrame(pv); }
  else nearView.observe(pv);
}
function unwatch(root) {
  $$(".pv", root).forEach(pv => { scaler.unobserve(pv); nearView.unobserve(pv); });
}
function setMode(pv, mode) {
  const s = byId.get(pv.dataset.pv);
  if (!s || pv.dataset.mode === mode || !modesOf(s).includes(mode)) return;
  pv.dataset.mode = mode;
  pv.setAttribute("style", posterVars(s, mode) + (pv.style.getPropertyValue("--s") ? `;--s:${pv.style.getPropertyValue("--s")}` : ""));
  $$("button[data-mode]", pv).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  syncFrame(pv);
  const card = pv.closest(".card");
  if (card) {
    const strip = $(".strip", card);
    if (strip) strip.outerHTML = stripHTML(s, mode);
  }
  if (pv.dataset.context === "detail") {
    $("#dPalette").innerHTML = paletteSectionHTML(s, mode);
    const full = $("#dFull");
    if (full && s.previews[mode]) full.href = s.previews[mode];
  }
  if (pv.dataset.context === "compare") fillCompareColours(s, mode);
}

const toastEl = $("#toast");
let toastTimer = 0;
function toast(message) {
  const host = $("dialog[open]") || document.body;
  if (toastEl.parentNode !== host) host.appendChild(toastEl);
  toastEl.textContent = message;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
}
async function copyText(text, label) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    ($("dialog[open]") || document.body).appendChild(ta);
    ta.select();
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
  }
  toast(ok ? `Copied ${label || text}` : "Copy failed. Select the text and copy it by hand.");
}

function readHash() {
  const raw = location.hash.slice(1);
  if (!raw.includes("=")) return null;
  const p = new URLSearchParams(raw);
  const next = { ...DEFAULTS };
  next.q = (p.get("q") || "").trim();
  for (const key of ["appearance", "motion", "css", "source", "sort"]) {
    const v = p.get(key === "appearance" ? "mode" : key);
    if (v && OPTIONS[key].includes(v)) next[key] = v;
  }
  const tag = p.get("tag");
  if (tag && skins.some(s => (s.tags || []).includes(tag))) next.tag = tag;
  const skin = p.get("skin");
  return { next, skin: skin && byId.has(skin) ? skin : null };
}
function writeHash() {
  const p = new URLSearchParams();
  if (rawQuery.trim()) p.set("q", rawQuery.trim());
  for (const key of ["appearance", "motion", "css", "source", "tag", "sort"]) {
    if (state[key] !== DEFAULTS[key]) p.set(key === "appearance" ? "mode" : key, state[key]);
  }
  if (detailId) p.set("skin", detailId);
  const hash = p.toString();
  if (!hash && !location.hash.includes("=")) return;
  try { history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search); } catch {}
}

function syncControls() {
  for (const key of ["appearance", "motion", "css"]) {
    const input = $(`input[name="${key}"][value="${CSS.escape(state[key])}"]`);
    if (input) input.checked = true;
  }
  $("#source").value = state.source;
  $("#tag").value = state.tag;
  $("#sort").value = state.sort;
  const search = $("#search");
  if (search.value !== rawQuery) search.value = rawQuery;
  $("#searchClear").hidden = !rawQuery;
  $("#source").classList.toggle("is-set", state.source !== "all");
  $("#tag").classList.toggle("is-set", state.tag !== "all");
}
function updateFacetCounts() {
  const count = patch => { const st = { ...state, ...patch }; return skins.reduce((n, s) => n + (matches(s, st) ? 1 : 0), 0); };
  for (const key of ["appearance", "motion", "css"]) {
    $$(`input[name="${key}"]`).forEach(input => {
      const n = count({ [key]: input.value });
      input.parentElement.classList.toggle("is-zero", n === 0);
      input.parentElement.title = plural(n, "skin");
    });
  }
  for (const key of ["source", "tag"]) {
    $$(`#${key} option`).forEach(opt => { opt.textContent = `${opt.dataset.label} (${count({ [key]: opt.value })})`; });
  }
}
function activeFilters() {
  const list = [];
  if (state.q) list.push({ key: "q", name: "Search", label: `“${rawQuery.trim()}”` });
  for (const key of ["appearance", "motion", "css", "source", "tag"]) {
    if (state[key] !== DEFAULTS[key]) list.push({ key, name: GROUP_NAMES[key], label: key === "tag" ? state.tag : LABELS[key][state[key]] });
  }
  return list;
}
function update({ resort = false } = {}) {
  if (resort) sorted().forEach(s => grid.appendChild(cards.get(s.id)));
  visible = [];
  for (const el of grid.children) {
    const s = byId.get(el.dataset.id);
    const show = matches(s, state);
    if (el.hidden === show) el.hidden = !show;
    if (show) visible.push(s);
  }
  const total = skins.length;
  const active = activeFilters();
  $("#resultsTitle").innerHTML = active.length
    ? `${visible.length} of ${total} skins`
    : `All ${total} skins`;
  $("#countNow").textContent = visible.length;
  $("#countAll").textContent = total;
  $("#chips").innerHTML = active.map(f => `<button class="chip" type="button" data-clear="${f.key}" aria-label="Remove filter ${esc(f.name)}: ${esc(f.label)}"><b>${esc(f.name)}</b>${esc(f.label)}${icon("x")}</button>`).join("");
  $("#resetBtn").hidden = !active.length;
  $("#empty").hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  const n = active.filter(f => f.key !== "q").length;
  $("#filtersN").hidden = !n;
  $("#filtersN").textContent = n;
  $("#filtersDone").textContent = `Show ${plural(visible.length, "skin")}`;
  $("#randomBtn").disabled = visible.length === 0;
  syncControls();
  updateFacetCounts();
  writeHash();
}
function setFilter(key, value) {
  if (state[key] === value) return;
  state[key] = value;
  if (key === "appearance" && (value === "dark" || value === "light")) {
    cards.forEach(el => { const pv = $(".pv", el); if (pv) setMode(pv, value); });
  }
  update({ resort: key === "sort" });
}
function resetFilters() {
  const sort = state.sort;
  Object.assign(state, DEFAULTS, { sort });
  rawQuery = "";
  update();
}

function paletteSectionHTML(s, mode) {
  const sw = swatchesOf(s, mode);
  if (!sw.length) return "";
  return `<h3>Palette <span>${esc(mode)} · click a colour to copy it</span></h3>
    <div class="swatches">${sw.map(x => `<button class="swatch" type="button" data-copy="${esc(x.color)}" style="--c:${esc(x.color)}" aria-label="Copy ${esc(x.label)} colour ${esc(x.color)}"><i></i><span><b>${esc(x.label)}</b><code>${esc(x.color)}</code></span></button>`).join("")}</div>`;
}
function detailHTML(s) {
  const card = cards.get(s.id);
  const mode = (card && $(".pv", card)?.dataset.mode) || modesOf(s)[0];
  const file = `${s.id}.json`;
  const command = `t3 theme set ${file}`;
  const images = s.images || [];
  const previewFile = s.previews && s.previews[mode];
  const stageBar = previewFile
    ? `<span>Mock T3 Code UI running this skin’s colours${s.hasCss ? " and CSS" : ""}.</span><a href="${esc(previewFile)}" target="_blank" rel="noopener" id="dFull">Open preview full size ${icon("out")}</a>`
    : (images.length > 1
      ? `<div class="thumbs" role="group" aria-label="Screenshots">${images.map((im, i) => `<button type="button" data-shot="${i}" aria-pressed="${i === 0}" aria-label="Show screenshot ${i + 1} of ${images.length}"><img src="${esc(im.src)}" alt=""/></button>`).join("")}</div><span>Screenshots from the original post.</span>`
      : `<span>Screenshot from the original post.</span>`);
  const facts = [
    ["Source", s.source],
    ["Added", `${fmtDate(s.createdAt, fmtTime)} IST`],
    s.installCount != null ? ["Installs", s.installCount] : null,
    s.likeCount != null ? ["Likes", s.likeCount] : null,
  ].filter(Boolean);
  const install = hasFile(s)
    ? `<p>Open <strong>Settings → Appearance</strong> in T3 Code, press <strong>Add</strong>, and drop <code>${esc(file)}</code>. Or on the server:</p>
       <span class="cmd"><code>${esc(command)}</code><button class="cmd-copy" type="button" data-copy="${esc(command)}" aria-label="Copy command: ${esc(command)}">${icon("copy")}</button></span>`
    : `<p>No public theme file was found for this one. Use the source link for the original post.</p>`;
  const picked = compare.includes(s.id);
  const tags = tagsFor(s);
  return `
    <div class="d-stage">
      ${previewHTML(s, mode, "detail")}
      <div class="d-stage-bar">${stageBar}</div>
    </div>
    <div class="d-info">
      <header>
        <p class="eyebrow">${esc(s.source)} · ${fmtDate(s.createdAt)}</p>
        <h2 id="dTitle">${esc(s.name)}</h2>
        <p class="d-by">by ${esc(s.author)}</p>
      </header>
      <p class="d-desc${s.description ? "" : " is-missing"}">${esc(s.description || "The author did not add a description.")}</p>
      ${factsHTML(s)}
      <div class="d-actions">
        ${downloadHTML(s)}
        <button class="btn" type="button" data-compare="${esc(s.id)}" aria-pressed="${picked}">${icon(picked ? "check" : "plus")}<span>${picked ? "In compare" : "Add to compare"}</span></button>
        <button class="btn" type="button" data-share="${esc(s.id)}">${icon("copy")}<span>Copy link</span></button>
      </div>
      <dl class="d-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      <section class="d-sec" id="dPalette">${paletteSectionHTML(s, mode)}</section>
      <section class="d-sec"><h3>Install</h3><div class="d-install">${install}</div></section>
      <section class="d-sec"><h3>Links</h3><div class="d-links">${(s.links || []).map(l => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener"><span>${esc(l.label)}</span>${icon("out")}</a>`).join("")}</div></section>
      ${tags.length ? `<section class="d-sec"><h3>Tags</h3>${tagsHTML(tags)}</section>` : ""}
    </div>`;
}
const detail = $("#detail");
function navList() { return visible.some(s => s.id === detailId) ? visible : skins; }
function openDetail(id) {
  const s = byId.get(id);
  if (!s) return;
  detailId = id;
  const body = $("#dBody");
  unwatch(body);
  body.innerHTML = detailHTML(s);
  $$(".pv", body).forEach(pv => watch(pv, true));
  const list = navList();
  const i = list.findIndex(x => x.id === id);
  $("#dPos").textContent = `${i + 1} of ${list.length}`;
  $("#dPrev").disabled = i <= 0;
  $("#dNext").disabled = i >= list.length - 1;
  if (!detail.open) {
    if ($("#compare").open) $("#compare").close();
    detail.showModal();
  }
  $(".d-info", body).scrollTop = 0;
  body.scrollTop = 0;
  writeHash();
}
function stepDetail(dir) {
  const list = navList();
  const next = list[list.findIndex(x => x.id === detailId) + dir];
  if (next) openDetail(next.id);
}
detail.addEventListener("close", () => {
  if (detail.open) return;
  unwatch($("#dBody"));
  $("#dBody").innerHTML = "";
  detailId = null;
  writeHash();
});

function toggleCompare(id) {
  const i = compare.indexOf(id);
  if (i >= 0) compare.splice(i, 1);
  else if (compare.length >= MAX_COMPARE) { toast(`Compare holds ${MAX_COMPARE} skins. Remove one first.`); return; }
  else compare.push(id);
  syncCompare();
}
function syncCompare() {
  const full = compare.length >= MAX_COMPARE;
  $$(".cmp, .d-actions [data-compare]").forEach(btn => {
    const on = compare.includes(btn.dataset.compare);
    btn.setAttribute("aria-pressed", String(on));
    const inDetail = btn.closest(".d-actions");
    btn.innerHTML = `${icon(on ? "check" : "plus")}<span>${inDetail ? (on ? "In compare" : "Add to compare") : (on ? "Added" : "Compare")}</span>`;
    btn.title = !on && full ? `Compare holds ${MAX_COMPARE} skins` : "";
  });
  cards.forEach((el, id) => el.classList.toggle("is-picked", compare.includes(id)));
  const tray = $("#tray");
  tray.hidden = compare.length === 0;
  $("#trayItems").innerHTML = compare.map(id => {
    const s = byId.get(id);
    const p = paletteOf(s, modesOf(s)[0]) || { canvas: "#222", accent: "#888" };
    return `<button class="tray-item" type="button" data-compare="${esc(id)}" aria-label="Remove ${esc(s.name)} from compare" style="--c:${esc(p.canvas)};--a:${esc(p.accent)}"><i></i><span>${esc(s.name)}</span>${icon("x")}</button>`;
  }).join("");
  const open = $("#trayOpen");
  open.disabled = compare.length < 2;
  open.textContent = compare.length < 2 ? "Pick one more" : `Compare ${compare.length}`;
  if ($("#compare").open) compare.length ? renderCompare() : $("#compare").close();
}
function colourCell(s, mode, key) {
  const raw = s.palettes && s.palettes[mode];
  const c = raw && raw[key];
  return c ? `<span class="c-sw" style="--c:${esc(c)}"><i></i><code>${esc(c)}</code></span>` : `<span class="c-none">—</span>`;
}
function fillCompareColours(s, mode) {
  $$(`#cBody [data-colour^="${CSS.escape(s.id)}|"]`).forEach(td => { td.innerHTML = colourCell(s, mode, td.dataset.colour.split("|")[1]); });
}
function renderCompare() {
  const body = $("#cBody");
  const list = compare.map(id => byId.get(id));
  const best = key => Math.max(...list.map(s => s[key] ?? -1));
  const row = (label, cell) => `<tr><th scope="row">${label}</th>${list.map(s => cell(s)).join("")}</tr>`;
  const num = key => s => s[key] == null ? `<td><span class="c-none">—</span></td>` : `<td class="${list.length > 1 && s[key] === best(key) && s[key] > 0 ? "is-best" : ""}">${s[key]}</td>`;
  unwatch(body);
  body.innerHTML = `<table class="ctable">
    <colgroup><col class="c-label"/>${list.map(() => `<col class="c-skin"/>`).join("")}</colgroup>
    <thead><tr><td></td>${list.map(s => `<th scope="col">
      ${previewHTML(s, modesOf(s)[0], "compare")}
      <div class="c-head"><div><b>${esc(s.name)}</b><small>by ${esc(s.author)}</small></div>
      <button class="icon-btn" type="button" data-compare="${esc(s.id)}" aria-label="Remove ${esc(s.name)} from compare" title="Remove">${icon("x")}</button></div>
    </th>`).join("")}</tr></thead>
    <tbody>
      ${row("Source", s => `<td>${esc(s.source)}</td>`)}
      ${row("Added", s => `<td>${fmtDate(s.createdAt)}</td>`)}
      ${row("Installs", num("installCount"))}
      ${row("Likes", num("likeCount"))}
      ${row("Modes", s => `<td>${modesLabel(s)}</td>`)}
      ${row("Motion", s => `<td>${s.animated ? "Animated" : "Static"}</td>`)}
      ${row("Styling", s => `<td>${s.hasCss ? "Custom CSS" : hasFile(s) ? "Palette only" : "No file"}</td>`)}
      ${PALETTE_KEYS.map(key => row(key, s => `<td data-colour="${esc(s.id)}|${key}">${colourCell(s, modesOf(s)[0], key)}</td>`)).join("")}
      ${row("Tags", s => `<td>${tagsHTML(tagsFor(s)) || `<span class="c-none">—</span>`}</td>`)}
      ${row("Get it", s => `<td><div class="c-actions">${downloadHTML(s, "JSON")}<button class="btn" type="button" data-open="${esc(s.id)}">Details</button></div></td>`)}
    </tbody></table>`;
  $$(".pv", body).forEach(pv => watch(pv, true));
}
$("#compare").addEventListener("close", () => {
  if ($("#compare").open) return;
  unwatch($("#cBody"));
  $("#cBody").innerHTML = "";
});

function buildIndex() {
  const items = skins.filter(s => paletteOf(s, modesOf(s)[0])).map(s => {
    const mode = modesOf(s)[0];
    const p = paletteOf(s, mode);
    const accent = rgbOf(p.accent, mode);
    return { s, p, hue: hueOf(accent), lum: luminance(accent) };
  }).sort((a, b) => (a.hue < 0) - (b.hue < 0) || (a.hue < 0 ? a.lum - b.lum : a.hue - b.hue));
  const index = $("#index");
  index.innerHTML = items.map(({ s, p }, i) => `<button type="button" data-open="${esc(s.id)}" data-name="${esc(s.name)} — ${esc(s.author)}" tabindex="${i ? -1 : 0}" aria-label="${esc(s.name)} by ${esc(s.author)}" style="--c:${esc(p.canvas)};--a:${esc(p.accent)}"></button>`).join("");
  $("#indexCount").textContent = `${items.length} palettes, sorted by accent hue`;
  const label = $("#indexLabel");
  const idle = label.textContent;
  const show = e => { const b = e.target.closest("button"); label.textContent = b ? b.dataset.name : idle; };
  index.addEventListener("pointerover", show);
  index.addEventListener("focusin", show);
  index.addEventListener("pointerleave", () => { label.textContent = index.contains(document.activeElement) ? document.activeElement.dataset.name : idle; });
  index.addEventListener("focusout", () => { label.textContent = idle; });
  index.addEventListener("keydown", e => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const buttons = $$("button", index);
    const at = buttons.indexOf(document.activeElement);
    let to = step ? at + step : e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : -1;
    if (to < 0 || to >= buttons.length || at < 0) return;
    e.preventDefault();
    buttons[at].tabIndex = -1;
    buttons[to].tabIndex = 0;
    buttons[to].focus();
    buttons[to].scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function buildStats() {
  const c = G.counts || {};
  const rows = [
    [c.total ?? skins.length, "skins"],
    [c.animated ?? skins.filter(s => s.animated).length, "animated"],
    [c.hasCss ?? skins.filter(s => s.hasCss).length, "with custom CSS"],
    [c.withJson ?? skins.filter(hasFile).length, "with JSON to download"],
  ];
  $("#stats").innerHTML = rows.map(([n, label]) => `<div><dt>${label}</dt><dd>${n}</dd></div>`).join("");
}
function buildTagOptions() {
  const counts = new Map();
  skins.forEach(s => (s.tags || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
  const tagSel = $("#tag");
  [...counts].filter(([t]) => !GENERIC_TAGS.has(t)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).forEach(([t]) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.dataset.label = t;
    opt.textContent = t;
    tagSel.appendChild(opt);
  });
}

function setFiltersOpen(open) {
  $("#filters").classList.toggle("is-open", open);
  $("#filtersToggle").setAttribute("aria-expanded", String(open));
}
function applyDensity() {
  grid.dataset.density = prefs.density;
  const input = $(`input[name="density"][value="${prefs.density}"]`);
  if (input) input.checked = true;
}
function applyLive() {
  $("#liveToggle").checked = prefs.live;
  cards.forEach(el => { const pv = $(".pv", el); if (pv) { if (!prefs.live) pv._forced = false; syncFrame(pv); } });
}

function bind() {
  let searchTimer = 0;
  $("#search").addEventListener("input", e => {
    rawQuery = e.target.value;
    $("#searchClear").hidden = !rawQuery;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = rawQuery.trim().toLowerCase(); update(); }, 90);
  });
  $("#searchClear").addEventListener("click", () => { rawQuery = ""; state.q = ""; update(); $("#search").focus(); });
  $("#tools").addEventListener("change", e => {
    const t = e.target;
    if (t.name === "density") { prefs.density = t.value; store.set("density", t.value); applyDensity(); return; }
    if (t.id === "liveToggle") { prefs.live = t.checked; store.set("live", t.checked ? "on" : "off"); applyLive(); return; }
    if (t.type === "radio" && t.name in DEFAULTS) setFilter(t.name, t.value);
    else if (t.id in DEFAULTS) setFilter(t.id, t.value);
  });
  $("#filtersToggle").addEventListener("click", () => setFiltersOpen(!$("#filters").classList.contains("is-open")));
  $("#filtersDone").addEventListener("click", () => { setFiltersOpen(false); $("#skins").scrollIntoView(); });
  $("#resetBtn").addEventListener("click", resetFilters);
  $("#randomBtn").addEventListener("click", () => { if (visible.length) openDetail(visible[Math.floor(Math.random() * visible.length)].id); });
  $("#themeBtn").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("theme", next);
  });
  $("#trayOpen").addEventListener("click", () => { if (compare.length < 2) return; renderCompare(); $("#compare").showModal(); });
  $("#trayClear").addEventListener("click", () => { compare.length = 0; syncCompare(); });
  $("#dPrev").addEventListener("click", () => stepDetail(-1));
  $("#dNext").addEventListener("click", () => stepDetail(1));

  document.addEventListener("click", e => {
    const t = e.target;
    const modeBtn = t.closest("button[data-mode]");
    if (modeBtn) { setMode(modeBtn.closest(".pv"), modeBtn.dataset.mode); return; }
    const play = t.closest("[data-play]");
    if (play) { const pv = play.closest(".pv"); pv._forced = true; syncFrame(pv); return; }
    const shot = t.closest("[data-shot]");
    if (shot) {
      const s = byId.get(detailId);
      const im = s && s.images[Number(shot.dataset.shot)];
      if (im) {
        const img = $("#dBody .pv img");
        img.src = im.src;
        img.alt = im.alt || s.name;
        $$("#dBody [data-shot]").forEach(b => b.setAttribute("aria-pressed", String(b === shot)));
      }
      return;
    }
    const copy = t.closest("[data-copy]");
    if (copy) { copyText(copy.dataset.copy); return; }
    const share = t.closest("[data-share]");
    if (share) { copyText(location.href.split("#")[0] + "#skin=" + share.dataset.share, "link to this skin"); return; }
    const cmp = t.closest("[data-compare]");
    if (cmp) {
      const fromTray = Boolean(cmp.closest("#tray"));
      toggleCompare(cmp.dataset.compare);
      if (fromTray && compare.length) $("#trayOpen").focus();
      return;
    }
    const tag = t.closest("[data-tag]");
    if (tag) {
      $$("dialog[open]").forEach(d => d.close());
      setFilter("tag", tag.dataset.tag);
      $("#skins").scrollIntoView();
      return;
    }
    const open = t.closest("[data-open]");
    if (open) { openDetail(open.dataset.open); return; }
    const clear = t.closest("[data-clear]");
    if (clear) {
      const key = clear.dataset.clear;
      if (key === "q") { rawQuery = ""; state.q = ""; update(); } else setFilter(key, DEFAULTS[key]);
      ($("#chips .chip") || $("#search")).focus();
      return;
    }
    if (t.closest("[data-reset]")) { resetFilters(); $("#search").focus(); return; }
    if (t.closest("[data-close-dialog]")) { t.closest("dialog").close(); return; }
    if (t instanceof HTMLDialogElement) { t.close(); return; }
    if ($("#filters").classList.contains("is-open") && !t.closest("#tools")) setFiltersOpen(false);
  });

  document.addEventListener("keydown", e => {
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== "radio" && e.target.type !== "checkbox";
    if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !$("dialog[open]")) {
      e.preventDefault();
      $("#search").focus();
      $("#search").select();
      return;
    }
    if (e.key === "Escape") {
      if (e.target.id === "search" && rawQuery) { rawQuery = ""; state.q = ""; update(); return; }
      if ($("#filters").classList.contains("is-open")) { setFiltersOpen(false); $("#filtersToggle").focus(); }
      return;
    }
    if (detail.open && !typing && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.target.closest(".pv-modes, .thumbs")) {
      e.preventDefault();
      stepDetail(e.key === "ArrowLeft" ? -1 : 1);
    }
  });

  window.addEventListener("hashchange", () => {
    const parsed = readHash();
    if (!parsed) return;
    Object.assign(state, parsed.next, { q: parsed.next.q.toLowerCase() });
    rawQuery = parsed.next.q;
    update({ resort: true });
    if (parsed.skin && parsed.skin !== detailId) openDetail(parsed.skin);
  });
  reducedMotion.addEventListener("change", () => $$(".pv").forEach(syncFrame));
}

function boot() {
  buildStats();
  buildTagOptions();
  buildIndex();
  skins.forEach(s => cards.set(s.id, cardEl(s)));
  const parsed = readHash();
  if (parsed) {
    Object.assign(state, parsed.next, { q: parsed.next.q.toLowerCase() });
    rawQuery = parsed.next.q;
  }
  applyDensity();
  $("#liveToggle").checked = prefs.live;
  bind();
  update({ resort: true });
  if (state.appearance === "dark" || state.appearance === "light") {
    cards.forEach(el => { const pv = $(".pv", el); if (pv) setMode(pv, state.appearance); });
  }
  cards.forEach(el => { const pv = $(".pv", el); if (pv) watch(pv, false); });
  syncCompare();
  if (parsed && parsed.skin) openDetail(parsed.skin);
}
boot();
})();
