(() => {
"use strict";

const G = window.GALLERY;
const SKINS = G.skins;
const byId = new Map(SKINS.map(s => [s.id, s]));
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const MAX_COMPARE = 3;
const PALETTE_ROLES = ["canvas", "sidebar", "surface", "accent", "border", "text"];

const HUES = [
  { key: "red", label: "Red", dot: "#d63a3a", test: h => h >= 345 || h < 12 },
  { key: "orange", label: "Orange", dot: "#ec7a2b", test: h => h >= 12 && h < 40 },
  { key: "yellow", label: "Yellow", dot: "#f2c14e", test: h => h >= 40 && h < 70 },
  { key: "green", label: "Green", dot: "#4caf50", test: h => h >= 70 && h < 160 },
  { key: "teal", label: "Teal", dot: "#2fbfb0", test: h => h >= 160 && h < 198 },
  { key: "blue", label: "Blue", dot: "#3871e1", test: h => h >= 198 && h < 245 },
  { key: "purple", label: "Purple", dot: "#8a6fe8", test: h => h >= 245 && h < 290 },
  { key: "pink", label: "Pink", dot: "#e04aa8", test: h => h >= 290 && h < 345 },
  { key: "neutral", label: "Neutral", dot: "linear-gradient(135deg,#fff 50%,#000 50%)", test: () => false },
];

const FACETS = {
  appearance: { el: "#facet-appearance", options: [["all", "Any mode"], ["dark", "Dark"], ["light", "Light"], ["dual", "Both dark and light"]] },
  motion: { el: "#facet-motion", options: [["all", "Any"], ["animated", "Animated"], ["static", "Static"]] },
  css: { el: "#facet-css", options: [["all", "Any"], ["css", "Custom CSS"], ["palette", "Palette only"]] },
  source: { el: "#facet-source", options: [["all", "Anywhere"], ["t3skins.dev", "t3skins.dev"], ["GitHub", "GitHub"], ["X", "X only"]] },
};

const DEFAULTS = { q: "", appearance: "all", motion: "all", css: "all", source: "all", tag: "all", hues: [], sort: "newest", view: "default" };
const state = { ...DEFAULTS, hues: [] };
const cardMode = new Map();
const compareIds = [];

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const colorCtx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const colorCache = new Map();
function readColor(css) {
  if (!css) return null;
  if (colorCache.has(css)) return colorCache.get(css);
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = "#000";
  colorCtx.fillRect(0, 0, 1, 1);
  colorCtx.fillStyle = "#010203";
  colorCtx.fillStyle = css;
  if (colorCtx.fillStyle === "#010203" && css.toLowerCase() !== "#010203") { colorCache.set(css, null); return null; }
  colorCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = colorCtx.getImageData(0, 0, 1, 1).data;
  const hex = "#" + [r, g, b].map(n => n.toString(16).padStart(2, "0")).join("");
  const R = r / 255, Gc = g / 255, B = b / 255;
  const mx = Math.max(R, Gc, B), mn = Math.min(R, Gc, B), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === R) h = ((Gc - B) / d) % 6;
    else if (mx === Gc) h = (B - R) / d + 2;
    else h = (R - Gc) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  const info = { hex, hue: h, chroma: d, light: (mx + mn) / 2 };
  colorCache.set(css, info);
  return info;
}

const modesOf = s => (s.modes && s.modes.length ? s.modes : [s.appearance || "dark"]);
const previewModes = s => modesOf(s).filter(m => s.previews && s.previews[m]);
const isDual = s => { const m = modesOf(s); return m.includes("dark") && m.includes("light"); };
const paletteOf = (s, mode) => (s.palettes && (s.palettes[mode] || s.palettes[modesOf(s)[0]])) || {};

const meta = new Map();
SKINS.forEach(s => {
  const pal = paletteOf(s, modesOf(s)[0]);
  const canvas = readColor(pal.canvas);
  const accent = readColor(pal.accent);
  const key = accent || canvas;
  let bucket = null;
  if (key) bucket = key.chroma < 0.1 ? "neutral" : HUES.find(h => h.test(key.hue)).key;
  const hueOrder = key ? (bucket === "neutral" ? 400 + (1 - (canvas || key).light) * 100 : key.hue < 345 ? key.hue + 15 : key.hue - 345) : 999;
  meta.set(s.id, { pal, canvas, accent, bucket, hueOrder, blob: [s.name, s.author, s.description, (s.tags || []).join(" "), s.source].join(" ").toLowerCase() });
});

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Calcutta", day: "numeric", month: "short", year: "numeric" });
function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? (iso || "") : dateFmt.format(d);
}
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;

function traitsText(s) {
  const bits = [];
  if (s.animated) bits.push("Animated");
  if (s.hasCss) bits.push("custom CSS");
  else if (s.jsonFile) bits.push("palette only");
  else bits.push("screenshot only, no theme file");
  bits.push(isDual(s) ? "dark and light" : `${modesOf(s)[0]} only`);
  const text = bits.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function popularityText(s) {
  const bits = [];
  if (s.installCount != null) bits.push(plural(s.installCount, "install"));
  if (s.likeCount != null) bits.push(plural(s.likeCount, "like"));
  if (!bits.length) return "";
  return `${bits.join(" and ")} on ${s.source === "X" ? "X" : s.source}`;
}
const sourceLabel = s => (s.source === "X" ? "X post" : s.source === "GitHub" ? "GitHub" : "t3skins.dev");

function matches(s, skip) {
  const m = meta.get(s.id);
  if (state.q && !state.q.split(/\s+/).every(t => m.blob.includes(t))) return false;
  const modes = modesOf(s);
  if (skip !== "appearance") {
    if (state.appearance === "dark" && !modes.includes("dark")) return false;
    if (state.appearance === "light" && !modes.includes("light")) return false;
    if (state.appearance === "dual" && !isDual(s)) return false;
  }
  if (skip !== "motion") {
    if (state.motion === "animated" && !s.animated) return false;
    if (state.motion === "static" && s.animated) return false;
  }
  if (skip !== "css") {
    if (state.css === "css" && !s.hasCss) return false;
    if (state.css === "palette" && s.hasCss) return false;
  }
  if (skip !== "source" && state.source !== "all" && s.source !== state.source) return false;
  if (skip !== "tag" && state.tag !== "all" && !(s.tags || []).includes(state.tag)) return false;
  if (skip !== "hues" && state.hues.length && !state.hues.includes(m.bucket)) return false;
  return true;
}

const SORTS = {
  newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
  name: (a, b) => a.name.localeCompare(b.name),
  installs: (a, b) => (b.installCount ?? -1) - (a.installCount ?? -1) || SORTS.newest(a, b),
  animated: (a, b) => (b.animated - a.animated) || a.name.localeCompare(b.name),
  hue: (a, b) => meta.get(a.id).hueOrder - meta.get(b.id).hueOrder,
};
const sorted = list => [...list].sort(SORTS[state.sort] || SORTS.newest);
const visibleList = () => sorted(SKINS.filter(s => matches(s)));

function writeHash(skinId) {
  const p = new URLSearchParams();
  Object.keys(DEFAULTS).forEach(k => {
    const v = k === "q" ? state.q : state[k];
    if (k === "hues") { if (v.length) p.set("hue", v.join(",")); }
    else if (v !== DEFAULTS[k]) p.set(k, v);
  });
  if (compareIds.length) p.set("compare", compareIds.join(","));
  if (skinId) p.set("skin", skinId);
  const str = p.toString();
  try { history.replaceState(null, "", str ? "#" + str : location.pathname + location.search); } catch { }
}
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  Object.keys(DEFAULTS).forEach(k => {
    if (k === "hues") { const h = p.get("hue"); if (h) state.hues = h.split(",").filter(x => HUES.some(H => H.key === x)); }
    else if (p.has(k)) state[k] = p.get(k);
  });
  (p.get("compare") || "").split(",").filter(id => byId.has(id)).slice(0, MAX_COMPARE).forEach(id => compareIds.push(id));
  return p.get("skin");
}

function modeFor(s, view = state.view) {
  const avail = previewModes(s);
  if (cardMode.has(s.id) && avail.includes(cardMode.get(s.id))) return cardMode.get(s.id);
  if (view !== "default" && avail.includes(view)) return view;
  return avail[0] || modesOf(s)[0];
}

function previewHTML(s, mode, { lazy = true, imgIndex = 0 } = {}) {
  if (s.previews && s.previews[mode]) {
    return `<iframe ${lazy ? 'loading="lazy"' : ""} tabindex="-1" title="${esc(s.name)} preview, ${mode} mode" src="${esc(s.previews[mode])}"></iframe>`;
  }
  const img = s.images && s.images[imgIndex];
  if (img) return `<img src="${esc(img.src)}" alt="${esc(img.alt || s.name)}" ${lazy ? 'loading="lazy"' : ""}/>`;
  return `<div class="no-preview">No preview</div>`;
}

function modeSeg(s, current, attr) {
  const avail = previewModes(s);
  if (avail.length < 2) return "";
  return `<div class="seg" role="group" aria-label="${esc(s.name)} preview mode">${avail.map(m =>
    `<button type="button" ${attr}="${m}" aria-pressed="${m === current}">${m === "dark" ? "Dark" : "Light"}</button>`).join("")}</div>`;
}

function viewNote(s, mode) {
  if (state.view === "default" || mode === state.view || !previewModes(s).length) return "";
  return `<span class="win-note">${mode === "dark" ? "Dark" : "Light"} only</span>`;
}

function chipline(s) {
  const sw = (s.swatches || []).filter(x => readColor(x.color));
  if (!sw.length) return "";
  return `<div class="chipline" aria-hidden="true">${sw.map(x => `<i style="background:${esc(x.color)}"></i>`).join("")}</div>`;
}

const cards = new Map();
function buildCard(s) {
  const li = document.createElement("li");
  li.className = "skin";
  li.dataset.id = s.id;
  const mode = modeFor(s);
  const pop = popularityText(s);
  const dl = s.jsonFile ? `<a class="btn btn-primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">Download JSON</a>` : "";
  const src = s.sourceUrl ? `<a class="btn" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${sourceLabel(s)}</a>` : "";
  li.innerHTML = `
    <div class="win" data-win>
      ${previewHTML(s, mode)}
      <button type="button" class="win-open" tabindex="-1" aria-hidden="true" data-open="${esc(s.id)}"></button>
      ${modeSeg(s, mode, "data-card-mode")}
      ${viewNote(s, mode)}
    </div>
    ${chipline(s)}
    <div class="skin-head">
      <h3 class="skin-name">${esc(s.name)}</h3>
      <label class="cmp"><input type="checkbox" data-compare="${esc(s.id)}"/> Compare</label>
    </div>
    <p class="by">by ${esc(s.author)}, ${fmtDate(s.createdAt)}</p>
    <p class="traits">${esc(traitsText(s))}${pop ? `. ${esc(pop)}` : ""}</p>
    <div class="acts">${dl}<button type="button" class="btn" data-open="${esc(s.id)}" aria-label="Details for ${esc(s.name)}">Details</button>${src}</div>`;
  return li;
}

function refreshCardPreview(s) {
  const li = cards.get(s.id);
  if (!li) return;
  const win = $("[data-win]", li);
  const mode = modeFor(s);
  const iframe = $("iframe", win);
  if (iframe && s.previews[mode] && !iframe.src.endsWith(s.previews[mode])) {
    iframe.src = s.previews[mode];
    iframe.title = `${s.name} preview, ${mode} mode`;
  }
  $$("[data-card-mode]", win).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cardMode === mode)));
  $(".win-note", win)?.remove();
  win.insertAdjacentHTML("beforeend", viewNote(s, mode));
}

let lastOrder = "";
function renderGrid(list) {
  const grid = $("#grid");
  const ordered = sorted(SKINS);
  const orderKey = ordered.map(s => s.id).join();
  if (orderKey !== lastOrder) {
    ordered.forEach(s => { if (!cards.has(s.id)) cards.set(s.id, buildCard(s)); });
    grid.append(...ordered.map(s => cards.get(s.id)));
    lastOrder = orderKey;
  }
  const show = new Set(list.map(s => s.id));
  cards.forEach((li, id) => { li.hidden = !show.has(id); });
  let empty = $("#empty");
  if (!list.length) {
    if (!empty) {
      grid.insertAdjacentHTML("afterend", `<div class="empty" id="empty"><h3>No skins match</h3><p>Remove a filter or change the search to see more skins.</p><button type="button" class="btn btn-primary" data-reset>Reset all filters</button></div>`);
    }
  } else empty?.remove();
}

function activeFilters() {
  const out = [];
  if (state.q) out.push(["q", `“${state.q}”`]);
  ["appearance", "motion", "css", "source"].forEach(k => {
    if (state[k] !== "all") out.push([k, FACETS[k].options.find(o => o[0] === state[k])[1]]);
  });
  if (state.tag !== "all") out.push(["tag", `Tag: ${state.tag}`]);
  state.hues.forEach(h => out.push(["hue:" + h, `${HUES.find(H => H.key === h).label} accent`]));
  return out;
}

function renderFacets() {
  Object.entries(FACETS).forEach(([key, f]) => {
    const host = $(f.el);
    const counts = f.options.map(([v]) => {
      const saved = state[key];
      state[key] = v;
      const n = SKINS.filter(s => matches(s)).length;
      state[key] = saved;
      return n;
    });
    if (!host.childElementCount) {
      host.innerHTML = f.options.map(([v, label]) =>
        `<label class="opt"><input type="radio" name="f-${key}" value="${esc(v)}" data-facet="${key}"/> ${esc(label)} <span class="n"></span></label>`).join("");
    }
    $$("input", host).forEach((inp, i) => {
      inp.checked = state[key] === inp.value;
      inp.closest(".opt").classList.toggle("is-empty", counts[i] === 0);
      $(".n", inp.closest(".opt")).textContent = counts[i];
    });
  });

  const hueHost = $("#facet-hue");
  if (!hueHost.childElementCount) {
    hueHost.innerHTML = HUES.map(h =>
      `<label class="opt"><input type="checkbox" value="${h.key}" data-hue/> <span class="hue-dot" style="background:${h.dot}"></span>${h.label} <span class="n"></span></label>`).join("");
  }
  const base = SKINS.filter(s => matches(s, "hues"));
  $$("input", hueHost).forEach(inp => {
    const n = base.filter(s => meta.get(s.id).bucket === inp.value).length;
    inp.checked = state.hues.includes(inp.value);
    inp.closest(".opt").classList.toggle("is-empty", n === 0);
    $(".n", inp.closest(".opt")).textContent = n;
  });

  $("#tag").value = state.tag;
  $("#sort").value = state.sort;
  if ($("#search").value.trim().toLowerCase() !== state.q) $("#search").value = state.q;
}

function renderStatus(list) {
  const active = activeFilters();
  $("#reset").disabled = !active.length;
  const toggle = $("#filters-toggle");
  const facetCount = active.filter(([k]) => k !== "q").length;
  toggle.textContent = facetCount ? `Filters (${facetCount})` : "Filters";
  $("#facets-done").textContent = list.length ? `Show ${plural(list.length, "skin")}` : "No skins match. Change a filter.";
  $("#status").innerHTML = `<span>Showing <strong>${list.length}</strong> of ${SKINS.length} skins</span>` +
    active.map(([k, label]) => `<button type="button" class="pill" data-clear="${esc(k)}" aria-label="Remove filter ${esc(label)}">${esc(label)}<span aria-hidden="true">×</span></button>`).join("");
}

function renderSpectrumState(list) {
  const show = new Set(list.map(s => s.id));
  $$(".strip").forEach(b => b.classList.toggle("is-out", !show.has(b.dataset.id)));
}

function render({ hash = true } = {}) {
  const list = visibleList();
  renderGrid(list);
  renderFacets();
  renderStatus(list);
  renderSpectrumState(list);
  renderCompareState();
  if (hash) writeHash(detailsId());
}

function buildSpectrum() {
  const track = $("#spectrum-track");
  const list = SKINS.filter(s => meta.get(s.id).canvas || meta.get(s.id).accent)
    .sort((a, b) => meta.get(a.id).hueOrder - meta.get(b.id).hueOrder);
  track.innerHTML = list.map((s, i) => {
    const m = meta.get(s.id);
    const top = (m.canvas || m.accent).hex, bottom = (m.accent || m.canvas).hex;
    return `<li><button type="button" class="strip" data-id="${esc(s.id)}" data-strip tabindex="${i ? -1 : 0}" style="--i:${i}"
      aria-label="${esc(s.name)} by ${esc(s.author)}"><i style="background:${top}"></i><i style="background:${bottom}"></i></button></li>`;
  }).join("");
  const readout = $("#readout");
  const idle = `<span>${list.length} skins with a published palette, each shown as its canvas over its accent and sorted by accent colour. Select one to open it.</span>`;
  readout.innerHTML = idle;
  let current = null;
  const read = btn => {
    if (current) current.classList.remove("is-read");
    current = btn;
    if (!btn) { readout.innerHTML = idle; return; }
    btn.classList.add("is-read");
    const s = byId.get(btn.dataset.id), m = meta.get(s.id);
    const hex = (label, c) => c ? `<span class="hex"><i style="background:${c.hex}"></i>${label} ${c.hex}</span>` : "";
    readout.innerHTML = `<strong>${esc(s.name)}</strong><span>by ${esc(s.author)}</span>${hex("Canvas", m.canvas)}${hex("Accent", m.accent)}`;
  };
  track.addEventListener("pointerover", e => { const b = e.target.closest("[data-strip]"); if (b) read(b); });
  track.addEventListener("pointerleave", () => { if (!track.contains(document.activeElement)) read(null); });
  track.addEventListener("focusin", e => read(e.target.closest("[data-strip]")));
  track.addEventListener("focusout", e => { if (!track.contains(e.relatedTarget)) read(null); });
  track.addEventListener("keydown", e => {
    const strips = $$("[data-strip]", track);
    const i = strips.indexOf(document.activeElement);
    if (i < 0) return;
    let j = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = Math.min(strips.length - 1, i + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = Math.max(0, i - 1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = strips.length - 1;
    if (j == null) return;
    e.preventDefault();
    strips[i].tabIndex = -1;
    strips[j].tabIndex = 0;
    strips[j].focus();
    strips[j].scrollIntoView({ block: "nearest", inline: "nearest" });
  });
  track.addEventListener("click", e => {
    const b = e.target.closest("[data-strip]");
    if (!b) return;
    $$("[data-strip]", track).forEach(x => { x.tabIndex = x === b ? 0 : -1; });
    openDetails(b.dataset.id);
  });
  const spectrum = $("#spectrum");
  const stop = () => spectrum.classList.remove("is-entering");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) stop();
  else setTimeout(stop, 700 + list.length * 9 + 100);
}

const details = $("#details");
let detailsState = null;
const detailsId = () => (details.open && detailsState ? detailsState.id : null);

function detailsNav(id) {
  const list = visibleList();
  const seq = list.some(s => s.id === id) ? list : sorted(SKINS);
  const i = seq.findIndex(s => s.id === id);
  return { seq, i };
}

function paletteRows(s, mode) {
  const pal = paletteOf(s, mode);
  const rows = PALETTE_ROLES.filter(r => pal[r] && readColor(pal[r])).map(r => ({ role: r, value: pal[r], hex: readColor(pal[r]).hex }));
  if (rows.length) return rows;
  return (s.swatches || []).filter(x => readColor(x.color)).map(x => ({ role: x.label, value: x.color, hex: readColor(x.color).hex }));
}
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);

function renderDetails() {
  const { id, mode, img } = detailsState;
  const s = byId.get(id);
  const { seq, i } = detailsNav(id);
  const rows = paletteRows(s, mode);
  const pop = popularityText(s);
  const file = `${s.id}.json`;
  const dl = s.jsonFile ? `<a class="btn btn-primary" href="${esc(s.jsonFile)}" download="${esc(file)}">Download JSON</a>` : "";
  const links = (s.links || []).filter(l => !(s.jsonFile && /download json/i.test(l.label)))
    .map(l => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
  const inCompare = compareIds.includes(s.id);
  const imgs = (s.images || []).length > 1 && !(s.previews && s.previews[mode])
    ? `<div class="gallery-imgs" role="group" aria-label="Screenshots">${s.images.map((im, k) =>
      `<button type="button" data-img="${k}" aria-pressed="${k === img}" aria-label="Screenshot ${k + 1}"><img src="${esc(im.src)}" alt=""/></button>`).join("")}</div>` : "";
  const install = s.jsonFile ? `
      <h3>Install</h3>
      <ol class="steps">
        <li><p>Download <code>${esc(file)}</code>.</p></li>
        <li><p>In T3 Code, open <strong>Settings → Appearance</strong>, press <strong>Add</strong>, and drop the file in.</p></li>
        <li><p>Or, on the machine running the T3 server:</p>
          <div class="cmd"><code>t3 theme set ${esc(file)}</code><button type="button" class="btn" data-copy="t3 theme set ${esc(file)}">Copy command</button></div></li>
      </ol>`
    : `<p class="notice">No public theme file was found for this one. Use the source link for the original post.</p>`;

  details.innerHTML = `
    <div class="sheet">
      <div class="sheet-bar">
        <span class="pos">${i + 1} of ${seq.length}</span>
        <button type="button" class="btn" data-nav="-1" ${i <= 0 ? "disabled" : ""} aria-keyshortcuts="ArrowLeft">Previous</button>
        <button type="button" class="btn" data-nav="1" ${i >= seq.length - 1 ? "disabled" : ""} aria-keyshortcuts="ArrowRight">Next</button>
        <button type="button" class="btn" data-close>Close</button>
      </div>
      <div class="sheet-body">
        <div class="stage">
          <div class="win">${previewHTML(s, mode, { lazy: false, imgIndex: img })}</div>
          <div class="stage-tools">
            ${modeSeg(s, mode, "data-detail-mode") || `<span>${previewModes(s).length ? `${cap(mode)} mode only` : "Screenshot from the original post"}</span>`}
            ${imgs}
          </div>
        </div>
        <div class="info">
          <h2 id="d-name">${esc(s.name)}</h2>
          <p class="by">by ${esc(s.author)}, shared ${fmtDate(s.createdAt)} via ${esc(s.source)}</p>
          <p class="traits">${esc(traitsText(s))}${pop ? `. ${esc(pop)}` : ""}</p>
          <p class="desc">${esc(s.description)}</p>
          <div class="acts">${dl}<button type="button" class="btn" data-compare-toggle="${esc(s.id)}" aria-pressed="${inCompare}" ${!inCompare && compareIds.length >= MAX_COMPARE ? "disabled" : ""}>${inCompare ? "Remove from compare" : "Add to compare"}</button></div>
          ${rows.length ? `<h3>Palette, ${esc(mode)} mode</h3><div class="swatches">${rows.map(r =>
            `<button type="button" class="swatch" data-copy="${esc(r.value)}" title="Copy ${esc(r.value)}"><i style="background:${esc(r.value)}"></i><span><b>${esc(cap(r.role))}</b><small>${esc(/^#/.test(r.value) ? r.value : r.hex)}</small></span></button>`).join("")}</div>` : ""}
          ${install}
          ${links ? `<h3>Links</h3><div class="links">${links}</div>` : ""}
          ${(s.tags || []).length ? `<h3>Tags</h3><div class="tags">${s.tags.map(t => `<button type="button" data-tag="${esc(t)}" title="Show skins tagged ${esc(t)}">${esc(t)}</button>`).join("")}</div>` : ""}
        </div>
      </div>
    </div>`;
}

let returnFocus = null;
function openDetails(id, { focusClose = true } = {}) {
  const s = byId.get(id);
  if (!s) return;
  const wasOpen = details.open;
  detailsState = { id, mode: modeFor(s), img: 0 };
  renderDetails();
  if (!wasOpen) {
    returnFocus = document.activeElement;
    details.showModal();
  }
  if (focusClose) $("[data-close]", details).focus();
  writeHash(id);
}
function closeDetails() { if (details.open) details.close(); }
details.addEventListener("close", () => {
  detailsState = null;
  details.innerHTML = "";
  writeHash();
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
});
function navDetails(step) {
  if (!detailsState) return;
  const { seq, i } = detailsNav(detailsState.id);
  const next = seq[i + step];
  if (!next) return;
  openDetails(next.id, { focusClose: false });
  const btn = $(`[data-nav="${step}"]`, details);
  (btn && !btn.disabled ? btn : $("[data-close]", details)).focus();
}
details.addEventListener("click", e => {
  if (e.target === details) return closeDetails();
  const t = e.target.closest("button");
  if (!t) return;
  if (t.matches("[data-close]")) closeDetails();
  else if (t.dataset.nav) navDetails(Number(t.dataset.nav));
  else if (t.dataset.detailMode) {
    detailsState.mode = t.dataset.detailMode;
    renderDetails();
    $(`[data-detail-mode="${detailsState.mode}"]`, details).focus();
  } else if (t.dataset.img) {
    detailsState.img = Number(t.dataset.img);
    renderDetails();
    $(`[data-img="${detailsState.img}"]`, details).focus();
  } else if (t.dataset.tag) {
    const tag = t.dataset.tag;
    const known = $$("#tag option").some(o => o.value === tag);
    if (known) state.tag = tag; else { state.q = tag.toLowerCase(); }
    returnFocus = $("#search");
    closeDetails();
    render();
    $("#results").scrollIntoView({ block: "start" });
  } else if (t.dataset.compareToggle) {
    toggleCompare(t.dataset.compareToggle);
    renderDetails();
    $("[data-compare-toggle]", details).focus();
  }
});
details.addEventListener("keydown", e => {
  if (e.target.closest("input,select,textarea")) return;
  if (e.key === "ArrowRight") { e.preventDefault(); navDetails(1); }
  if (e.key === "ArrowLeft") { e.preventDefault(); navDetails(-1); }
});

function toggleCompare(id) {
  const i = compareIds.indexOf(id);
  if (i >= 0) compareIds.splice(i, 1);
  else if (compareIds.length < MAX_COMPARE) compareIds.push(id);
  renderCompareState();
  writeHash(detailsId());
}
function renderCompareState() {
  const full = compareIds.length >= MAX_COMPARE;
  $$("[data-compare]").forEach(inp => {
    inp.checked = compareIds.includes(inp.dataset.compare);
    inp.disabled = !inp.checked && full;
    inp.closest(".cmp").title = inp.disabled ? `Compare holds ${MAX_COMPARE} skins. Remove one first.` : "";
  });
  const tray = $("#tray");
  tray.hidden = !compareIds.length;
  $("#tray-label").textContent = `${compareIds.length} of ${MAX_COMPARE} picked`;
  $("#tray-names").innerHTML = compareIds.map(id => `<button type="button" data-uncompare="${esc(id)}" aria-label="Remove ${esc(byId.get(id).name)} from compare">${esc(byId.get(id).name)}<span aria-hidden="true">×</span></button>`).join("");
  const open = $("#tray-open");
  open.disabled = compareIds.length < 2;
  open.textContent = compareIds.length < 2 ? "Pick one more to compare" : `Compare ${compareIds.length} skins`;
}

const compare = $("#compare");
let compareView = "default";
function renderCompare() {
  const skins = compareIds.map(id => byId.get(id));
  const roles = PALETTE_ROLES;
  compare.innerHTML = `
    <div class="sheet">
      <div class="sheet-bar">
        <h2 id="c-title" class="cmp-title">Compare ${skins.length} skins</h2>
        <div class="seg" role="group" aria-label="Compare preview mode">${[["default", "Default"], ["dark", "Dark"], ["light", "Light"]].map(([v, l]) =>
          `<button type="button" data-cview="${v}" aria-pressed="${compareView === v}">${l}</button>`).join("")}</div>
        <button type="button" class="btn" data-close>Close</button>
      </div>
      <div class="cmp-body" style="--cols:${skins.length}">
        ${skins.map(s => {
          const avail = previewModes(s);
          const mode = compareView !== "default" && avail.includes(compareView) ? compareView : (avail[0] || modesOf(s)[0]);
          const pal = paletteOf(s, mode);
          const rows = roles.map(r => {
            const c = pal[r] && readColor(pal[r]);
            return `<tr><th scope="row">${cap(r)}</th><td>${c ? `<span class="sw-inline"><i style="background:${esc(pal[r])}"></i>${esc(/^#/.test(pal[r]) ? pal[r] : c.hex)}</span>` : "Not set"}</td></tr>`;
          }).join("");
          return `<section class="cmp-col" aria-label="${esc(s.name)}">
            <h3>${esc(s.name)}</h3>
            <p class="by">by ${esc(s.author)}</p>
            <div class="win">${previewHTML(s, mode, { lazy: false })}${compareView !== "default" && mode !== compareView && avail.length ? `<span class="win-note">${cap(mode)} only</span>` : ""}</div>
            <table class="cmp-table"><tbody>
              ${rows}
              <tr><th scope="row">Modes</th><td>${modesOf(s).map(cap).join(" and ")}</td></tr>
              <tr><th scope="row">Motion</th><td>${s.animated ? "Animated" : "Static"}</td></tr>
              <tr><th scope="row">Styling</th><td>${s.hasCss ? "Custom CSS" : s.jsonFile ? "Palette only" : "No theme file"}</td></tr>
              <tr><th scope="row">Installs</th><td>${s.installCount != null ? s.installCount : "Not listed"}</td></tr>
            </tbody></table>
            <div class="acts">${s.jsonFile ? `<a class="btn btn-primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">Download JSON</a>` : ""}<button type="button" class="btn" data-detail-from-compare="${esc(s.id)}">Details</button></div>
          </section>`;
        }).join("")}
      </div>
    </div>`;
}
function openCompare() {
  if (compareIds.length < 2) return;
  compareView = state.view;
  renderCompare();
  compare.showModal();
  $("[data-close]", compare).focus();
}
compare.addEventListener("click", e => {
  if (e.target === compare) return compare.close();
  const t = e.target.closest("button");
  if (!t) return;
  if (t.matches("[data-close]")) compare.close();
  else if (t.dataset.cview) { compareView = t.dataset.cview; renderCompare(); $(`[data-cview="${compareView}"]`, compare).focus(); }
  else if (t.dataset.detailFromCompare) { compare.close(); openDetails(t.dataset.detailFromCompare); }
});
compare.addEventListener("close", () => { compare.innerHTML = ""; $("#tray-open").focus(); });

const toastEl = $("#toast");
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 1800);
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    (details.open ? details : compare.open ? compare : document.body).appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) { toast("Copy failed. Select the text and copy it by hand."); return; }
  }
  toast(`Copied ${text}`);
}

function setView(v) {
  state.view = v;
  document.documentElement.dataset.booth = v === "default" ? "auto" : v;
  $$("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
  SKINS.forEach(refreshCardPreview);
}

function clearFilter(key) {
  if (key === "q") state.q = "";
  else if (key.startsWith("hue:")) state.hues = state.hues.filter(h => h !== key.slice(4));
  else state[key] = DEFAULTS[key];
}
function resetAll() {
  ["q", "appearance", "motion", "css", "source", "tag"].forEach(k => { state[k] = DEFAULTS[k]; });
  state.hues = [];
  render();
}

function boot() {
  const tagCounts = {};
  SKINS.forEach(s => (s.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const skip = new Set(["t3-code", "t3code", "t3-theme", "dark-theme", "light-theme"]);
  Object.entries(tagCounts).filter(([t, n]) => n >= 2 && !skip.has(t))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([t, n]) => $("#tag").add(new Option(`${t} (${n})`, t)));

  $$("[data-count]").forEach(el => { el.textContent = G.counts[el.dataset.count]; });

  const openSkin = readHash();
  if (!$$("#tag option").some(o => o.value === state.tag)) state.tag = "all";
  if (!SORTS[state.sort]) state.sort = "newest";
  if (!["default", "dark", "light"].includes(state.view)) state.view = "default";
  ["appearance", "motion", "css", "source"].forEach(k => { if (!FACETS[k].options.some(o => o[0] === state[k])) state[k] = "all"; });

  buildSpectrum();
  setView(state.view);
  render({ hash: false });

  $("#search").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); render(); });
  $("#facets").addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.facet) state[t.dataset.facet] = t.value;
    else if (t.matches("[data-hue]")) state.hues = $$("[data-hue]").filter(x => x.checked).map(x => x.value);
    else if (t.id === "tag") state.tag = t.value;
    render();
  });
  $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  $("#reset").addEventListener("click", resetAll);
  const setFacetsOpen = open => {
    $("#filters-toggle").setAttribute("aria-expanded", String(open));
    $("#facets").classList.toggle("is-open", open);
  };
  $("#filters-toggle").addEventListener("click", e => {
    const open = e.currentTarget.getAttribute("aria-expanded") !== "true";
    setFacetsOpen(open);
    if (open) {
      $("#facets").scrollIntoView({ block: "start" });
      $("#facets input").focus({ preventScroll: true });
    }
  });
  $("#facets-done").addEventListener("click", () => {
    setFacetsOpen(false);
    $("#results").scrollIntoView({ block: "start" });
    $("#filters-toggle").focus({ preventScroll: true });
  });
  $("#view-seg").addEventListener("click", e => {
    const b = e.target.closest("[data-view]");
    if (b) { setView(b.dataset.view); writeHash(detailsId()); }
  });
  $("#tray-open").addEventListener("click", openCompare);
  $("#tray-clear").addEventListener("click", () => { compareIds.length = 0; renderCompareState(); writeHash(detailsId()); });

  document.addEventListener("click", e => {
    const t = e.target.closest("button,[data-open]");
    if (!t || details.contains(t) || compare.contains(t)) {
      const c = e.target.closest("[data-copy]");
      if (c) copy(c.dataset.copy);
      return;
    }
    if (t.dataset.open) openDetails(t.dataset.open);
    else if (t.dataset.cardMode) {
      const li = t.closest(".skin");
      cardMode.set(li.dataset.id, t.dataset.cardMode);
      refreshCardPreview(byId.get(li.dataset.id));
    } else if (t.dataset.clear) {
      clearFilter(t.dataset.clear);
      render();
      ($("#status .pill") || $("#search")).focus();
    } else if (t.dataset.uncompare) {
      toggleCompare(t.dataset.uncompare);
      ($("#tray-names button") || $("#tray:not([hidden]) .btn") || $("#search")).focus();
    } else if (t.matches("[data-reset]")) {
      resetAll();
      $("#search").focus();
    } else if (t.dataset.copy) copy(t.dataset.copy);
  });
  document.addEventListener("change", e => {
    if (e.target.matches("[data-compare]")) toggleCompare(e.target.dataset.compare);
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (details.open || compare.open || e.target.closest("input,select,textarea,[contenteditable]")) return;
    e.preventDefault();
    $("#search").focus();
  });

  if (openSkin && byId.has(openSkin)) openDetails(openSkin);
}

boot();
})();
