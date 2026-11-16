(() => {
"use strict";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const G = window.GALLERY;
if (!G || !Array.isArray(G.skins)) {
  $("#gallery").innerHTML = `<p>The skin data did not load. Check that <code>data.js</code> sits next to <code>index.html</code>.</p>`;
  return;
}

const skins = G.skins;
const byId = new Map(skins.map(s => [s.id, s]));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const CARD_VIEW = [440, 275];
const STAGE_VIEWS = [[720, 450], [480, 300]];
const STAGE_WIDE_FROM = 600;
const MAX_COMPARE = 4;
const MODE_ORDER = ["dark", "light"];
const PALETTE_KEYS = ["canvas", "sidebar", "surface", "text", "accent", "border"];
const REDUNDANT_TAGS = new Set(["dark", "light", "animated", "custom-css", "palette", "preview-only", "light-and-dark", "dark-theme", "light-theme", "t3-code", "t3code", "t3-theme"]);
const HUES = [
  ["red", "Red", "#d64545"], ["orange", "Orange", "#e8833a"], ["yellow", "Yellow", "#e2bd3a"],
  ["green", "Green", "#4f9d55"], ["teal", "Teal", "#2fa7a0"], ["blue", "Blue", "#4a7fe0"],
  ["purple", "Purple", "#8a63d8"], ["pink", "Pink", "#d85fa3"], ["neutral", "Neutral", "#8c9099"],
];
const SOURCE_LINK = { "t3skins.dev": "On t3skins.dev", GitHub: "On GitHub", X: "On X" };
const DEFAULTS = { q: "", mode: "all", motion: "all", css: "all", source: "all", hue: "all", tag: "all", sort: "installs", pv: "auto" };
const SEGMENTS = [
  { key: "mode", name: "Mode", opts: [["all", "Any"], ["dark", "Dark"], ["light", "Light"], ["dual", "Dark + light"]] },
  { key: "motion", name: "Motion", opts: [["all", "Any"], ["animated", "Animated"], ["static", "Static"]] },
  { key: "css", name: "Styling", opts: [["all", "Any"], ["css", "Custom CSS"], ["palette", "Palette only"]] },
  { key: "source", name: "Source", opts: [["all", "Any"], ["t3skins.dev", "t3skins.dev"], ["GitHub", "GitHub"], ["X", "X only"]] },
];
const PREVIEW_SEGMENT = { key: "pv", name: "Show previews in", opts: [["auto", "Skin default"], ["dark", "Dark"], ["light", "Light"]] };

const state = { ...DEFAULTS };
let compare = [];
let cardMode = {};
let openId = null;
let detailMode = "dark";
let visibleIds = [];
let appliedSort = null;
const played = new Set();

const els = {
  grid: $("#gallery"), empty: $("#empty"), status: $("#status"), reset: $("#reset"), filters: $("#filters"),
  filtersBtn: $("#filtersBtn"), q: $("#q"), sort: $("#sort"), deck: $("#deck"), readout: $("#readout"),
  tools: $("#tools"), toolsMark: $("#toolsMark"), tray: $("#tray"), detail: $("#detail"), compare: $("#compare"), live: $("#live"), theme: $("#themeBtn"),
};

const paint = (() => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  return (color, backdrop) => {
    const key = `${color}|${backdrop}`;
    if (cache.has(key)) return cache.get(key);
    let rgb = [128, 128, 128];
    if (ctx) {
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      rgb = [d[0], d[1], d[2]];
    }
    cache.set(key, rgb);
    return rgb;
  };
})();

const css = rgb => `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
const luminance = rgb => {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const toHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
};
const hueBucket = rgb => {
  const [h, s, l] = toHsl(rgb);
  if (s < 0.16 || l < 0.07 || l > 0.95) return "neutral";
  if (h < 15 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "yellow";
  if (h < 165) return "green";
  if (h < 200) return "teal";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
};

const paletteCache = new Map();
function palette(s, mode) {
  const key = `${s.id}|${mode}`;
  if (paletteCache.has(key)) return paletteCache.get(key);
  const raw = (s.palettes || {})[mode];
  let result = null;
  if (raw) {
    const backdrop = mode === "light" ? "#fff" : "#000";
    const rgb = {};
    PALETTE_KEYS.forEach(k => { if (raw[k]) rgb[k] = paint(raw[k], backdrop); });
    const canvas = rgb.canvas || paint(backdrop, backdrop);
    const sidebar = rgb.sidebar || canvas;
    const surface = rgb.surface || sidebar;
    const text = rgb.text && contrast(rgb.text, canvas) >= 4.5 ? rgb.text : luminance(canvas) > 0.3 ? [18, 19, 22] : [245, 246, 248];
    const accent = rgb.accent || text;
    result = {
      canvas: css(canvas), sidebar: css(sidebar), surface: css(surface), text: css(text), accent: css(accent),
      border: css(rgb.border || surface),
      accentRgb: rgb.accent || null,
      chips: PALETTE_KEYS.filter(k => rgb[k]).map(k => css(rgb[k])),
      entries: PALETTE_KEYS.filter(k => raw[k]).map(k => ({ label: k, value: raw[k], flat: css(rgb[k]) })),
    };
  }
  paletteCache.set(key, result);
  return result;
}

const info = new Map(skins.map(s => {
  const p = palette(s, s.modes[0]);
  let hue = null, hueRank = 5000;
  if (p) {
    hue = p.accentRgb ? hueBucket(p.accentRgb) : "neutral";
    const [h, , l] = toHsl(p.accentRgb || [128, 128, 128]);
    hueRank = hue === "neutral" ? 2000 + (1 - l) * 100 : (h + 15) % 360;
  }
  return [s.id, {
    hue, hueRank,
    blob: [s.name, s.author, s.description, (s.tags || []).join(" "), s.source, s.id].join(" ").toLowerCase(),
    dual: s.modes.includes("dark") && s.modes.includes("light"),
    modes: MODE_ORDER.filter(m => s.modes.includes(m)),
  }];
}));

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Calcutta", day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Calcutta", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
function formatDate(iso, fmt = dateFmt) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
}
const modeLabel = m => (m === "light" ? "Light" : "Dark");
const modesLabel = s => (info.get(s.id).dual ? "Dark + light" : `${modeLabel(s.modes[0])} only`);
const stylingLabel = s => (s.hasCss ? "Custom CSS" : s.jsonFile ? "Palette only" : "No public file");
const sourceLabel = s => (s.source === "X" ? "X only" : s.source);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const authorName = s => (s.author === "Unknown" ? "Unknown author" : s.author);

function facts(s) {
  const out = [];
  if (s.animated) out.push("Animated");
  out.push(stylingLabel(s), sourceLabel(s));
  if (s.installCount != null) out.push(plural(s.installCount, "install"));
  return out;
}

function matches(s, st) {
  const i = info.get(s.id);
  if (st.q && !st.q.toLowerCase().split(/\s+/).filter(Boolean).every(t => i.blob.includes(t))) return false;
  if (st.mode === "dark" && !s.modes.includes("dark")) return false;
  if (st.mode === "light" && !s.modes.includes("light")) return false;
  if (st.mode === "dual" && !i.dual) return false;
  if (st.motion === "animated" && !s.animated) return false;
  if (st.motion === "static" && s.animated) return false;
  if (st.css === "css" && !s.hasCss) return false;
  if (st.css === "palette" && (s.hasCss || !s.jsonFile)) return false;
  if (st.source !== "all" && s.source !== st.source) return false;
  if (st.hue !== "all" && i.hue !== st.hue) return false;
  if (st.tag !== "all" && !(s.tags || []).includes(st.tag)) return false;
  return true;
}

const newestFirst = (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
const SORTS = {
  newest: newestFirst,
  installs: (a, b) => (b.installCount ?? -1) - (a.installCount ?? -1) || newestFirst(a, b),
  likes: (a, b) => (b.likeCount ?? -1) - (a.likeCount ?? -1),
  name: () => 0,
  animated: (a, b) => Number(b.animated) - Number(a.animated),
  hue: (a, b) => info.get(a.id).hueRank - info.get(b.id).hueRank,
};
const sortedSkins = () => [...skins].sort((a, b) => SORTS[state.sort](a, b) || a.name.localeCompare(b.name));

function modeFor(s) {
  const own = cardMode[s.id];
  if (own && s.modes.includes(own)) return own;
  const wanted = state.pv !== "auto" ? state.pv : state.mode === "dark" || state.mode === "light" ? state.mode : null;
  return wanted && s.modes.includes(wanted) ? wanted : s.modes[0];
}

function previewVars(s, mode) {
  const p = palette(s, mode);
  return p ? `--c:${p.canvas};--sb:${p.sidebar};--sf:${p.surface};--bd:${p.border};--a:${p.accent}` : "";
}

function previewHTML(s, mode, kind, linked) {
  const src = (s.previews || {})[mode];
  const image = (s.images || [])[0];
  const inner = src ? `<div class="ph"><i></i></div>`
    : image ? `<img src="${esc(image.src)}" alt="${esc(image.alt || s.name)}" loading="lazy"/>`
    : `<div class="ph"></div>`;
  const link = linked ? `<a class="pv-open" href="#skin=${esc(s.id)}" data-open="${esc(s.id)}" tabindex="-1" aria-hidden="true"></a>` : "";
  return `<div class="pv" data-pv="${kind}" data-id="${esc(s.id)}" data-mode="${mode}"${src ? ` data-src="${esc(src)}"` : ""} style="${previewVars(s, mode)}">${inner}${link}</div>`;
}

function stripInner(s, mode) {
  const p = palette(s, mode);
  return p ? p.chips.map(c => `<i style="background:${c}"></i>`).join("") : "";
}
const stripHTML = (s, mode) => `<div class="strip${palette(s, mode) ? "" : " strip-none"}" aria-hidden="true">${stripInner(s, mode)}</div>`;

function modeSwitchHTML(s, mode) {
  const modes = info.get(s.id).modes;
  if (modes.length < 2) return `<span class="mode-only">${modeLabel(s.modes[0])} only</span>`;
  return `<div class="mini" role="group" aria-label="Preview mode for ${esc(s.name)}">${modes.map(m =>
    `<button type="button" data-set-mode="${m}" aria-pressed="${m === mode}">${modeLabel(m)}</button>`).join("")}</div>`;
}

const tagsHTML = tags => (tags.length ? `<div class="tags">${tags.map(t => `<button type="button" class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>` : "");
const downloadHTML = s => (s.jsonFile ? `<a class="btn btn-solid" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">Download JSON</a>` : "");
const compareToggleHTML = s => `<label class="cmp"><input type="checkbox" data-cmp="${esc(s.id)}"/><span>Compare</span></label>`;

function sourceLinkHTML(s) {
  if (!s.sourceUrl) return "";
  if (!s.jsonFile) return `<a class="btn btn-solid" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">Open X post</a>`;
  return `<a class="lnk" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${SOURCE_LINK[s.source] || "Source"}</a>`;
}

function cardHTML(s) {
  const mode = modeFor(s);
  const id = esc(s.id);
  return `<article class="skin" data-box="${id}" data-id="${id}">
    ${previewHTML(s, mode, "card", true)}
    ${stripHTML(s, mode)}
    <div class="cap">
      <div class="cap-head"><h2><a href="#skin=${id}" data-open="${id}">${esc(s.name)}</a></h2>${modeSwitchHTML(s, mode)}</div>
      <p class="by">${esc(authorName(s))}, ${formatDate(s.createdAt)}</p>
      <div class="facts"><ul>${facts(s).map(f => `<li>${esc(f)}</li>`).join("")}</ul></div>
      ${tagsHTML((s.tags || []).filter(t => !REDUNDANT_TAGS.has(t)).slice(0, 3))}
      <div class="acts">${downloadHTML(s)}<a class="btn" href="#skin=${id}" data-open="${id}">Details</a>${sourceLinkHTML(s)}${compareToggleHTML(s)}</div>
    </div>
  </article>`;
}

const resizeWatch = new ResizeObserver(entries => entries.forEach(e => fit(e.target)));
const viewWatch = new IntersectionObserver(entries => entries.forEach(e => (e.isIntersecting ? mount(e.target) : unmount(e.target))), { rootMargin: "500px 0px" });

function fit(el) {
  const width = el.clientWidth;
  if (!width) return;
  const [vw, vh] = el.dataset.pv === "card" ? CARD_VIEW : STAGE_VIEWS[width >= STAGE_WIDE_FROM ? 0 : 1];
  el.style.setProperty("--s", (width / vw).toFixed(4));
  el.style.setProperty("--vw", `${vw}px`);
  el.style.setProperty("--vh", `${vh}px`);
}

function mount(el) {
  if (!el.dataset.src || el.querySelector("iframe")) return;
  const s = byId.get(el.dataset.id);
  if (reduceMotion.matches && s.animated && !played.has(s.id)) {
    if (!el.querySelector(".pv-play")) el.insertAdjacentHTML("beforeend", `<button type="button" class="btn pv-play" data-play="${esc(s.id)}">Play animated preview</button>`);
    return;
  }
  const frame = document.createElement("iframe");
  frame.title = `${s.name} preview, ${el.dataset.mode}`;
  frame.tabIndex = -1;
  frame.setAttribute("inert", "");
  frame.addEventListener("load", () => frame.classList.add("ready"), { once: true });
  frame.src = el.dataset.src;
  el.querySelector(".ph").after(frame);
}

function unmount(el) {
  el.querySelector("iframe")?.remove();
}

function adopt(root, lazy) {
  $$(".pv", root).forEach(el => {
    resizeWatch.observe(el);
    fit(el);
    if (lazy) viewWatch.observe(el); else mount(el);
  });
}

function release(root) {
  $$(".pv", root).forEach(el => { resizeWatch.unobserve(el); viewWatch.unobserve(el); });
}

function setBoxMode(box, s, mode) {
  const pv = $(".pv", box);
  if (pv && pv.dataset.mode !== mode && s.previews[mode]) {
    const live = !!pv.querySelector("iframe");
    unmount(pv);
    pv.dataset.mode = mode;
    pv.dataset.src = s.previews[mode];
    pv.style.cssText = previewVars(s, mode);
    fit(pv);
    if (live) mount(pv);
  }
  const strip = $(".strip", box);
  if (strip) strip.innerHTML = stripInner(s, mode);
  $$("[data-set-mode]", box).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.setMode === mode)));
}

function syncModes() {
  skins.forEach(s => {
    if (!info.get(s.id).dual) return;
    const mode = modeFor(s);
    $$(`[data-box="${CSS.escape(s.id)}"]`).forEach(box => setBoxMode(box, s, mode));
  });
}

function buildDeck() {
  const list = skins.filter(s => palette(s, s.modes[0])).sort((a, b) => info.get(a.id).hueRank - info.get(b.id).hueRank);
  els.deck.innerHTML = list.map((s, i) => {
    const p = palette(s, s.modes[0]);
    return `<button type="button" class="stripe" data-stripe="${esc(s.id)}" tabindex="${i ? -1 : 0}" aria-label="${esc(s.name)} by ${esc(authorName(s))}" style="--c:${p.canvas};--sf:${p.surface};--a:${p.accent}"></button>`;
  }).join("");
  els.deck.dataset.count = list.length;
  showReadout(null);
}

function showReadout(s) {
  $$(".stripe.cur", els.deck).forEach(b => b.classList.remove("cur"));
  if (!s) {
    els.readout.removeAttribute("style");
    els.readout.innerHTML = `<span class="readout-hint">${els.deck.dataset.count} palettes, sorted by accent colour. Point at one to see whose it is, then select it to open the skin.</span>`;
    return;
  }
  const p = palette(s, s.modes[0]);
  $(`[data-stripe="${CSS.escape(s.id)}"]`, els.deck)?.classList.add("cur");
  els.readout.style.cssText = `--r-bg:${p.canvas};--r-fg:${p.text};--r-bd:${p.border}`;
  els.readout.innerHTML = `<span class="readout-chips">${p.chips.map(c => `<i style="background:${c}"></i>`).join("")}</span>
    <span class="readout-name">${esc(s.name)}</span><span>by ${esc(authorName(s))}</span>
    <span class="readout-facts">${esc([modesLabel(s), ...facts(s)].join(", "))}</span>`;
}

function segmentHTML({ key, name, opts }, counted) {
  return `<div class="field" role="radiogroup" aria-labelledby="fn-${key}">
    <span class="field-name" id="fn-${key}">${name}</span>
    <div class="seg">${opts.map(([value, label]) =>
      `<label data-opt="${key}:${esc(value)}"><input type="radio" name="f-${key}" value="${esc(value)}"/><span>${esc(label)}${counted ? " <small></small>" : ""}</span></label>`).join("")}</div>
  </div>`;
}

function buildFilters() {
  const present = new Set(skins.map(s => info.get(s.id).hue));
  const hues = HUES.filter(([value]) => present.has(value));
  const hueField = `<div class="field" role="radiogroup" aria-labelledby="fn-hue">
    <span class="field-name" id="fn-hue">Accent colour</span>
    <div class="seg"><label data-opt="hue:all"><input type="radio" name="f-hue" value="all"/><span>Any</span></label>${hues.map(([value, label, colour]) =>
      `<label class="hue-opt" data-opt="hue:${value}" title="${label}"><input type="radio" name="f-hue" value="${value}" aria-label="${label}"/><span><i class="dot" style="--h:${colour}"></i></span></label>`).join("")}</div>
  </div>`;
  const tagCounts = {};
  skins.forEach(s => (s.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const tagOptions = Object.entries(tagCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t, n]) => `<option value="${esc(t)}">${esc(t)} (${n})</option>`).join("");
  const tagField = `<label class="field"><span class="field-name">Tag</span><select id="tag"><option value="all">Any tag</option>${tagOptions}</select></label>`;
  els.filters.innerHTML = SEGMENTS.map(seg => segmentHTML(seg, true)).join("") + hueField + tagField + segmentHTML(PREVIEW_SEGMENT, false)
    + `<button type="button" class="btn panel-reset" data-reset hidden>Reset filters</button>`;
}

function syncControls() {
  els.q.value = state.q;
  els.sort.value = state.sort;
  $("#tag").value = state.tag;
  [...SEGMENTS, PREVIEW_SEGMENT, { key: "hue" }].forEach(({ key }) => {
    const input = $(`input[name="f-${key}"][value="${CSS.escape(state[key])}"]`, els.filters);
    if (input) input.checked = true;
  });
}

function updateFacets() {
  $$("[data-opt]", els.filters).forEach(label => {
    const [key, value] = label.dataset.opt.split(/:(.*)/);
    const n = skins.filter(s => matches(s, { ...state, [key]: value })).length;
    const small = $("small", label);
    if (small) small.textContent = n;
    label.classList.toggle("zero", n === 0);
    const input = $("input", label);
    if (key === "hue" && value !== "all") input.setAttribute("aria-label", `${label.title} accent, ${plural(n, "skin")}`);
  });
  const hueName = (HUES.find(([value]) => value === state.hue) || [])[1];
  $("#fn-hue").textContent = hueName ? `Accent colour: ${hueName}` : "Accent colour";
}

function apply() {
  if (appliedSort !== state.sort) {
    const order = sortedSkins();
    order.forEach(s => els.grid.append($(`[data-box="${CSS.escape(s.id)}"]`, els.grid)));
    appliedSort = state.sort;
  }
  const visible = new Set(skins.filter(s => matches(s, state)).map(s => s.id));
  visibleIds = $$(".skin", els.grid).map(card => {
    card.hidden = !visible.has(card.dataset.id);
    return card.hidden ? null : card.dataset.id;
  }).filter(Boolean);
  $$(".stripe", els.deck).forEach(b => b.classList.toggle("dim", !visible.has(b.dataset.stripe)));

  const n = visibleIds.length;
  els.status.innerHTML = `<strong>${n}</strong> of ${skins.length} skins`;
  els.grid.hidden = n === 0;
  els.empty.hidden = n !== 0;
  const active = Object.keys(DEFAULTS).filter(k => !["q", "sort"].includes(k) && state[k] !== DEFAULTS[k]).length;
  els.reset.hidden = !active && !state.q;
  $(".panel-reset", els.filters).hidden = els.reset.hidden;
  els.filtersBtn.textContent = active ? `Filters (${active})` : "Filters";
  updateFacets();
  syncModes();
  writeHash();
}

function setState(patch) {
  if ("pv" in patch && patch.pv !== state.pv) cardMode = {};
  Object.assign(state, patch);
  apply();
}

function resetFilters() {
  const sort = state.sort;
  cardMode = {};
  Object.assign(state, DEFAULTS, { sort });
  syncControls();
  apply();
}

function replaceUrl(url) {
  try {
    history.replaceState(null, "", url);
  } catch {
    return false;
  }
  return true;
}

function writeHash() {
  const params = new URLSearchParams();
  Object.keys(DEFAULTS).forEach(k => { if (state[k] !== DEFAULTS[k]) params.set(k, state[k]); });
  if (compare.length) params.set("cmp", compare.join(","));
  if (openId) params.set("skin", openId);
  const query = params.toString();
  if (query) replaceUrl(`#${query}`);
  else if (location.hash) replaceUrl(location.pathname + location.search);
}

function readHash() {
  const raw = location.hash.slice(1);
  if (!raw.includes("=")) return null;
  const params = new URLSearchParams(raw);
  const allowed = {};
  [...SEGMENTS, PREVIEW_SEGMENT].forEach(({ key, opts }) => { allowed[key] = opts.map(o => o[0]); });
  allowed.hue = ["all", ...HUES.map(h => h[0])];
  allowed.sort = Object.keys(SORTS);
  Object.keys(DEFAULTS).forEach(k => {
    const value = params.get(k);
    state[k] = value != null && (!allowed[k] || allowed[k].includes(value)) ? value : DEFAULTS[k];
  });
  if (state.tag !== "all" && !skins.some(s => (s.tags || []).includes(state.tag))) state.tag = "all";
  compare = (params.get("cmp") || "").split(",").filter(id => byId.has(id)).slice(0, MAX_COMPARE);
  return params.get("skin");
}

function announce(text) {
  els.live.textContent = "";
  requestAnimationFrame(() => { els.live.textContent = text; });
}

function syncCompareToggles() {
  $$("[data-cmp]").forEach(input => {
    input.checked = compare.includes(input.dataset.cmp);
    input.disabled = !input.checked && compare.length >= MAX_COMPARE;
  });
}

function renderTray() {
  els.tray.hidden = !compare.length;
  if (!compare.length) { els.tray.innerHTML = ""; return; }
  const chips = compare.map(id => {
    const s = byId.get(id);
    const p = palette(s, s.modes[0]);
    return `<span class="tray-chip"${p ? ` style="--c:${p.canvas};--a:${p.accent}"` : ""}><i></i>${esc(s.name)}<button type="button" data-cmp-remove="${esc(id)}" aria-label="Remove ${esc(s.name)} from the comparison">×</button></span>`;
  }).join("");
  const ready = compare.length > 1;
  els.tray.innerHTML = `<span class="tray-label">Compare</span><div class="tray-items">${chips}</div>
    <button type="button" class="btn btn-solid" data-compare-open${ready ? "" : " disabled"}>${ready ? `Compare ${compare.length} skins` : "Pick one more"}</button>
    <button type="button" class="btn" data-compare-clear>Clear</button>`;
}

function setCompare(ids, message) {
  compare = ids;
  syncCompareToggles();
  renderTray();
  if (els.compare.open) {
    if (compare.length > 1) renderCompare(); else els.compare.close();
  }
  writeHash();
  if (message) announce(message);
}

function toggleCompare(id, on) {
  const s = byId.get(id);
  if (on && !compare.includes(id)) {
    if (compare.length >= MAX_COMPARE) { syncCompareToggles(); return; }
    setCompare([...compare, id], `${s.name} added to the comparison. ${compare.length + 1} of ${MAX_COMPARE} picked.`);
  } else if (!on && compare.includes(id)) {
    setCompare(compare.filter(x => x !== id), `${s.name} removed from the comparison.`);
  }
}

function compareColumnHTML(s) {
  const mode = modeFor(s);
  const id = esc(s.id);
  const rows = [
    ["Modes", modesLabel(s)], ["Motion", s.animated ? "Animated" : "Static"], ["Styling", stylingLabel(s)],
    ["Source", s.source], ["Installs", s.installCount ?? "Not tracked"], ["Likes", s.likeCount ?? "Not tracked"],
    ["Added", formatDate(s.createdAt)],
  ];
  return `<article class="c-col" data-box="${id}">
    <div>${previewHTML(s, mode, "card", false)}${stripHTML(s, mode)}</div>
    <div class="cap">
      <div class="cap-head"><h2><a href="#skin=${id}" data-open="${id}">${esc(s.name)}</a></h2>${modeSwitchHTML(s, mode)}</div>
      <p class="by">${esc(authorName(s))}</p>
    </div>
    <dl class="c-rows">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
    <div class="c-acts">${downloadHTML(s)}<a class="btn" href="#skin=${id}" data-open="${id}">Details</a><button type="button" class="btn" data-cmp-remove="${id}">Remove</button></div>
  </article>`;
}

function renderCompare() {
  release(els.compare);
  els.compare.innerHTML = `<div class="sheet-bar"><h2 class="sheet-title" id="c-title">Comparing ${compare.length} skins</h2><button type="button" class="btn" data-close autofocus>Close</button></div>
    <div class="c-grid">${compare.map(id => compareColumnHTML(byId.get(id))).join("")}</div>`;
  adopt(els.compare, false);
}

function openCompare() {
  if (compare.length < 2) return;
  renderCompare();
  if (!els.compare.open) showSheet(els.compare);
}

function showSheet(dlg) {
  dlg.showModal();
  dlg.scrollTop = 0;
  document.body.classList.add("locked");
}

function detailNavIds() {
  return visibleIds.includes(openId) ? visibleIds : sortedSkins().map(s => s.id);
}

function paletteSectionHTML(s) {
  const blocks = info.get(s.id).modes.concat(s.modes.filter(m => !MODE_ORDER.includes(m))).map(mode => {
    const p = palette(s, mode);
    if (!p || !p.entries.length) return "";
    const head = s.modes.length > 1 ? `<p class="pal-mode">${modeLabel(mode)}</p>` : "";
    return `${head}<ul class="pal">${p.entries.map(e =>
      `<li><button type="button" data-copy="${esc(e.value)}" title="Copy ${esc(e.value)}"><i style="--sw:${e.flat}"></i><b>${esc(e.label)}</b><code>${esc(e.value)}</code></button></li>`).join("")}</ul>`;
  }).join("");
  return blocks ? `<section class="d-sec"><h3>Palette</h3>${blocks}<p class="d-note">Select a colour to copy its value.</p></section>` : "";
}

function installSectionHTML(s) {
  if (!s.jsonFile) {
    return `<section class="d-sec"><h3>Install</h3><p>No public theme file was found for this one. Use the source link for the original post.</p></section>`;
  }
  const file = `${esc(s.id)}.json`;
  const command = `t3 theme set ${file}`;
  return `<section class="d-sec"><h3>Install</h3>
    <ol class="steps">
      <li><span><a href="${esc(s.jsonFile)}" download="${file}">Download ${file}</a>.</span></li>
      <li><span>In T3 Code, open <strong>Settings → Appearance</strong> and press <strong>Add</strong>.</span></li>
      <li><span>Drop <code>${file}</code> in.</span></li>
    </ol>
    <p class="d-note">Or, on the machine running the T3 server:</p>
    <div class="cmd"><code>${command}</code><button type="button" class="btn btn-small" data-copy="${command}" data-copy-label="Copy command">Copy command</button></div>
  </section>`;
}

function stageHTML(s) {
  const modes = info.get(s.id).modes;
  const hasLive = Object.keys(s.previews || {}).length > 0;
  if (!hasLive) {
    const shots = (s.images || []).map(img => `<figure><img class="shot" src="${esc(img.src)}" alt="${esc(img.alt || s.name)}"/></figure>`).join("");
    return `<div class="d-stage"><div class="d-stage-top"><span>Screenshot from the author’s post. No public theme file was found.</span></div>
      <div class="d-pvs">${shots || `<p class="d-note">No preview is available for this skin.</p>`}</div></div>`;
  }
  const shown = detailMode === "both" ? modes : [detailMode];
  const switcher = modes.length > 1 ? `<div class="mini" role="group" aria-label="Preview mode">${[...modes, "both"].map(m =>
    `<button type="button" data-detail-mode="${m}" aria-pressed="${m === detailMode}">${m === "both" ? "Both" : modeLabel(m)}</button>`).join("")}</div>` : "";
  return `<div class="d-stage"><div class="d-stage-top"><span>A mock T3 Code window running this skin’s real colours and CSS.</span>${switcher}</div>
    <div class="d-pvs">${shown.map(m => `<figure>${shown.length > 1 ? `<figcaption>${modeLabel(m)}</figcaption>` : ""}${previewHTML(s, m, "stage", false)}</figure>`).join("")}</div></div>`;
}

function renderDetail(refocus) {
  const s = byId.get(openId);
  const ids = detailNavIds();
  const at = ids.indexOf(s.id);
  const counts = [s.installCount != null && plural(s.installCount, "install"), s.likeCount != null && plural(s.likeCount, "like")].filter(Boolean);
  const links = (s.links || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
  release(els.detail);
  els.detail.innerHTML = `<div class="sheet-bar">
      <span class="sheet-pos">${at + 1} of ${ids.length}</span>
      <button type="button" class="btn" data-step="-1">Previous</button>
      <button type="button" class="btn" data-step="1">Next</button>
      <button type="button" class="btn" data-close autofocus>Close</button>
    </div>
    <div class="d-body">
      ${stageHTML(s)}
      <div class="d-info">
        <header class="d-head">
          <h2 id="d-name">${esc(s.name)}</h2>
          <p>by ${esc(authorName(s))}</p>
          <p class="d-note">Added ${formatDate(s.createdAt, dateTimeFmt)} IST. ${esc([modesLabel(s), s.animated ? "animated" : "static", stylingLabel(s).toLowerCase().replace("css", "CSS"), sourceLabel(s), ...counts].join(", "))}.</p>
        </header>
        <p class="d-desc">${esc(s.description || "")}</p>
        <div class="d-acts">${downloadHTML(s)}${s.jsonFile ? "" : sourceLinkHTML(s)}${compareToggleHTML(s)}</div>
        ${tagsHTML(s.tags || [])}
        ${installSectionHTML(s)}
        ${paletteSectionHTML(s)}
        <section class="d-sec"><h3>Links</h3><div class="links">${links}</div></section>
      </div>
    </div>`;
  adopt(els.detail, false);
  syncCompareToggles();
  if (refocus) $(refocus, els.detail)?.focus();
}

function openDetail(id) {
  const s = byId.get(id);
  if (!s) return;
  if (els.compare.open) els.compare.close();
  openId = id;
  detailMode = info.get(id).modes.includes(modeFor(s)) ? modeFor(s) : s.modes[0];
  renderDetail();
  if (!els.detail.open) showSheet(els.detail);
  els.detail.scrollTop = 0;
  writeHash();
}

function stepDetail(delta) {
  const ids = detailNavIds();
  const next = ids[(ids.indexOf(openId) + delta + ids.length) % ids.length];
  const s = byId.get(next);
  openId = next;
  detailMode = info.get(next).modes.includes(modeFor(s)) ? modeFor(s) : s.modes[0];
  renderDetail(`[data-step="${delta}"]`);
  els.detail.scrollTop = 0;
  writeHash();
}

function onSheetClose(dlg) {
  release(dlg);
  dlg.innerHTML = "";
  if (dlg === els.detail) openId = null;
  if (!els.detail.open && !els.compare.open) document.body.classList.remove("locked");
  writeHash();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    (document.querySelector("dialog[open]") || document.body).append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

async function onCopy(button) {
  const ok = await copyText(button.dataset.copy);
  const target = button.dataset.copyLabel ? button : $("b", button);
  const original = button.dataset.copyLabel || target.textContent;
  target.textContent = ok ? "Copied" : "Copy failed";
  announce(ok ? `Copied ${button.dataset.copy}` : "Copy failed. Select the text and copy it by hand.");
  setTimeout(() => { if (target.isConnected) target.textContent = original; }, 1600);
}

function setTheme(theme, remember) {
  document.documentElement.dataset.theme = theme;
  els.theme.textContent = theme === "dark" ? "Switch to light" : "Switch to dark";
  if (!remember) return;
  try {
    localStorage.setItem("gallery-theme", theme);
  } catch {
    return;
  }
}

const narrow = window.matchMedia("(max-width: 760px)");
let stuck = false;

function setFiltersOpen(open) {
  els.tools.classList.toggle("open", open);
  els.filtersBtn.setAttribute("aria-expanded", String(open));
}

function syncTools() {
  const condensed = narrow.matches || stuck;
  els.tools.classList.remove("condensed");
  els.tools.style.marginBottom = "";
  if (!condensed) { setFiltersOpen(false); return; }
  const reserve = narrow.matches ? 0 : els.filters.offsetHeight + parseFloat(getComputedStyle(els.filters).marginTop);
  els.tools.classList.add("condensed");
  if (reserve) els.tools.style.marginBottom = `${reserve}px`;
}

function focusStripe(target) {
  if (!target) return;
  $$(".stripe", els.deck).forEach(b => { b.tabIndex = b === target ? 0 : -1; });
  target.focus();
  target.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function bind() {
  els.q.addEventListener("input", () => setState({ q: els.q.value.trim() }));
  els.sort.addEventListener("change", () => setState({ sort: els.sort.value }));
  els.filters.addEventListener("change", e => {
    if (e.target.id === "tag") setState({ tag: e.target.value });
    else if (e.target.name?.startsWith("f-")) setState({ [e.target.name.slice(2)]: e.target.value });
  });
  els.reset.addEventListener("click", resetFilters);
  $("#emptyReset").addEventListener("click", () => { resetFilters(); els.q.focus(); });
  els.filtersBtn.addEventListener("click", () => setFiltersOpen(!els.tools.classList.contains("open")));
  new IntersectionObserver(([entry]) => {
    const now = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    if (now !== stuck) { stuck = now; syncTools(); }
  }, { rootMargin: "80px 0px 0px 0px" }).observe(els.toolsMark);
  narrow.addEventListener("change", syncTools);
  syncTools();
  els.theme.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true));

  els.deck.addEventListener("pointerover", e => {
    const stripe = e.target.closest(".stripe");
    if (stripe) showReadout(byId.get(stripe.dataset.stripe));
  });
  els.deck.addEventListener("pointerleave", () => {
    const focused = els.deck.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
    showReadout(focused ? byId.get(document.activeElement.dataset.stripe) : null);
  });
  els.deck.addEventListener("focusin", e => {
    if (e.target.matches(".stripe:focus-visible")) showReadout(byId.get(e.target.dataset.stripe));
  });
  els.deck.addEventListener("focusout", e => { if (!els.deck.contains(e.relatedTarget)) showReadout(null); });
  els.deck.addEventListener("keydown", e => {
    const stripes = $$(".stripe", els.deck);
    const at = stripes.indexOf(document.activeElement);
    const to = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: stripes.length - 1 }[e.key];
    if (to == null || at < 0) return;
    e.preventDefault();
    focusStripe(stripes[Math.max(0, Math.min(stripes.length - 1, to))]);
  });

  document.addEventListener("click", e => {
    const t = e.target;
    if (els.tools.classList.contains("open") && !els.tools.contains(t)) setFiltersOpen(false);
    const stripe = t.closest(".stripe");
    if (stripe) { openDetail(stripe.dataset.stripe); return; }
    const opener = t.closest("[data-open]");
    if (opener) { e.preventDefault(); openDetail(opener.dataset.open); return; }
    const modeBtn = t.closest("[data-set-mode]");
    if (modeBtn) {
      const id = modeBtn.closest("[data-box]").dataset.box;
      cardMode[id] = modeBtn.dataset.setMode;
      $$(`[data-box="${CSS.escape(id)}"]`).forEach(box => setBoxMode(box, byId.get(id), cardMode[id]));
      return;
    }
    const detailBtn = t.closest("[data-detail-mode]");
    if (detailBtn) { detailMode = detailBtn.dataset.detailMode; renderDetail(`[data-detail-mode="${detailMode}"]`); return; }
    const play = t.closest("[data-play]");
    if (play) { played.add(play.dataset.play); const pv = play.closest(".pv"); play.remove(); mount(pv); return; }
    const tag = t.closest("[data-tag]");
    if (tag) {
      if (els.detail.open) els.detail.close();
      if (els.compare.open) els.compare.close();
      state.tag = tag.dataset.tag;
      syncControls();
      apply();
      $("#tools").scrollIntoView({ block: "start" });
      els.grid.focus({ preventScroll: true });
      announce(`Showing skins tagged ${state.tag}.`);
      return;
    }
    if (t.closest("[data-reset]")) { resetFilters(); return; }
    const copy = t.closest("[data-copy]");
    if (copy) { onCopy(copy); return; }
    const step = t.closest("[data-step]");
    if (step) { stepDetail(Number(step.dataset.step)); return; }
    const remove = t.closest("[data-cmp-remove]");
    if (remove) { toggleCompare(remove.dataset.cmpRemove, false); return; }
    if (t.closest("[data-compare-open]")) { openCompare(); return; }
    if (t.closest("[data-compare-clear]")) { setCompare([], "Comparison cleared."); return; }
    const close = t.closest("[data-close]");
    if (close) { close.closest("dialog").close(); return; }
    if (t === els.detail || t === els.compare) t.close();
  });

  document.addEventListener("change", e => {
    if (e.target.matches("[data-cmp]")) toggleCompare(e.target.dataset.cmp, e.target.checked);
  });

  document.addEventListener("keydown", e => {
    const typing = e.target.matches("input, select, textarea");
    if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !document.querySelector("dialog[open]")) {
      e.preventDefault();
      els.q.focus();
      els.q.select();
    } else if (e.key === "Escape" && els.tools.classList.contains("open") && !document.querySelector("dialog[open]")) {
      setFiltersOpen(false);
      els.filtersBtn.focus();
    } else if (els.detail.open && !typing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      stepDetail(e.key === "ArrowRight" ? 1 : -1);
    }
  });

  [els.detail, els.compare].forEach(dlg => dlg.addEventListener("close", () => onSheetClose(dlg)));

  window.addEventListener("hashchange", () => {
    const skin = readHash();
    if (skin === null && !location.hash.includes("=")) return;
    syncControls();
    syncCompareToggles();
    renderTray();
    apply();
    if (skin && byId.has(skin)) openDetail(skin);
    else if (els.detail.open) els.detail.close();
  });
}

function boot() {
  $("#counts").textContent = `${G.counts.total} skins, ${G.counts.animated} animated, ${G.counts.withJson} with a JSON file to download.`;
  setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);
  const skin = readHash();
  buildFilters();
  buildDeck();
  appliedSort = state.sort;
  els.grid.innerHTML = sortedSkins().map(cardHTML).join("");
  adopt(els.grid, true);
  syncControls();
  syncCompareToggles();
  renderTray();
  bind();
  apply();
  if (skin && byId.has(skin)) openDetail(skin);
}

boot();
})();
