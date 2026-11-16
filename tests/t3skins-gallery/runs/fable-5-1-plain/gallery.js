(() => {
"use strict";

const G = window.GALLERY;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const byId = new Map(G.skins.map(s => [s.id, s]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const MAX_COMPARE = 4;
const TAG_SKIP = new Set(["t3-code", "t3code", "t3-theme", "dark-theme", "light-theme"]);
const TAGS_VISIBLE = 14;

const DEFAULTS = { q: "", appearance: "all", motion: "all", css: "all", source: "all", tags: [], sort: "newest", pv: "auto", play: !reduceMotion.matches, compare: [], skin: null };
const state = structuredClone(DEFAULTS);
const cardMode = new Map();
const forcePlay = new Set();
let current = [];
let lastTrigger = null;

const ICON = {
  sun: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M3 13l1.4-1.4M11.6 4.4 13 3"/></svg>`,
  moon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7Z"/></svg>`,
  play: `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>`,
  down: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11"/></svg>`,
  copy: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/></svg>`,
  ext: `<svg class="ext" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 3H3v10h10v-3M9 3h4v4M13 3 7 9"/></svg>`,
  pin: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>`,
  check: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 8.5 3 3 7-7"/></svg>`,
  prev: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m10 3-5 5 5 5"/></svg>`,
  next: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>`,
  close: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>`,
};

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const modesOf = s => s.modes || [s.appearance || "dark"];
const isDual = s => { const m = modesOf(s); return m.includes("dark") && m.includes("light"); };
const ts = s => Date.parse(s.createdAt || 0) || 0;
const nameCmp = (a, b) => (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" });
const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Calcutta", day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Calcutta", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
function fmtDate(iso, withTime) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (withTime ? dateTimeFmt : dateFmt).format(d) + (withTime ? " IST" : "");
}
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

function textMatch(s, q) {
  if (!q) return true;
  const blob = [s.name, s.author, s.description, (s.tags || []).join(" "), s.source].join(" ").toLowerCase();
  return q.split(/\s+/).every(t => blob.includes(t));
}
function passes(s, st) {
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
  if (st.tags.length && !st.tags.every(t => (s.tags || []).includes(t))) return false;
  return true;
}
const SORTERS = {
  newest: (a, b) => ts(b) - ts(a) || nameCmp(a, b),
  oldest: (a, b) => ts(a) - ts(b) || nameCmp(a, b),
  name: nameCmp,
  author: (a, b) => (a.author || "").localeCompare(b.author || "", "en", { sensitivity: "base" }) || nameCmp(a, b),
  installs: (a, b) => (b.installCount ?? -1) - (a.installCount ?? -1) || nameCmp(a, b),
  likes: (a, b) => (b.likeCount ?? -1) - (a.likeCount ?? -1) || nameCmp(a, b),
  animated: (a, b) => (b.animated ? 1 : 0) - (a.animated ? 1 : 0) || ts(b) - ts(a) || nameCmp(a, b),
};
function filtered() {
  return G.skins.filter(s => passes(s, state)).sort(SORTERS[state.sort] || SORTERS.newest);
}
const countWith = (key, val) => G.skins.filter(s => passes(s, { ...state, [key]: val })).length;
function tagCount(t) {
  const tags = state.tags.includes(t) ? state.tags : [...state.tags, t];
  return G.skins.filter(s => passes(s, { ...state, tags })).length;
}
function allTags() {
  const c = new Map();
  G.skins.forEach(s => (s.tags || []).forEach(t => c.set(t, (c.get(t) || 0) + 1)));
  return [...c].filter(([t, n]) => n >= 2 && !TAG_SKIP.has(t)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
const TAGS = allTags();
const TAG_SET = new Set(TAGS.map(([t]) => t));

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const pick = (k, allowed) => { const v = p.get(k); return allowed.includes(v) ? v : DEFAULTS[k]; };
  state.q = (p.get("q") || "").trim().toLowerCase();
  state.appearance = pick("appearance", ["all", "dark", "light", "dual"]);
  state.motion = pick("motion", ["all", "animated", "static"]);
  state.css = pick("css", ["all", "css", "palette"]);
  state.source = pick("source", ["all", "t3skins.dev", "GitHub", "X"]);
  state.sort = pick("sort", Object.keys(SORTERS));
  state.pv = pick("pv", ["auto", "dark", "light"]);
  state.tags = (p.get("tags") || "").split(",").filter(t => TAG_SET.has(t));
  state.compare = [...new Set((p.get("cmp") || "").split(",").filter(id => byId.has(id)))].slice(0, MAX_COMPARE);
  state.skin = byId.has(p.get("skin")) ? p.get("skin") : null;
  if (p.has("play")) state.play = p.get("play") === "1";
}
function writeHash() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  for (const k of ["appearance", "motion", "css", "source", "sort", "pv"]) if (state[k] !== DEFAULTS[k]) p.set(k, state[k]);
  if (state.tags.length) p.set("tags", state.tags.join(","));
  if (state.play !== DEFAULTS.play) p.set("play", state.play ? "1" : "0");
  if (state.compare.length) p.set("cmp", state.compare.join(","));
  if (state.skin) p.set("skin", state.skin);
  const h = p.toString();
  history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
}

function effectiveMode(s, id = s.id) {
  const modes = modesOf(s);
  if (cardMode.has(id) && modes.includes(cardMode.get(id))) return cardMode.get(id);
  if (state.pv !== "auto" && modes.includes(state.pv)) return state.pv;
  return modes[0];
}
const canPlay = s => !s.animated || state.play || forcePlay.has(s.id);

function placeholderHTML(s, mode) {
  const pal = (s.palettes || {})[mode] || {};
  const fallbackText = mode === "light" ? "#222" : "#ddd";
  const style = [
    pal.canvas ? `--c1:${esc(pal.canvas)}` : "",
    pal.surface ? `--c2:${esc(pal.surface)}` : "",
    pal.sidebar ? `--c3:${esc(pal.sidebar)}` : "",
    pal.border ? `--c4:${esc(pal.border)}` : "",
    pal.accent ? `--ac:${esc(pal.accent)}` : "",
    `--tx:${esc(pal.text || fallbackText)}`,
  ].filter(Boolean).join(";");
  return `<div class="ph" style="${style}" aria-hidden="true"><div class="ph-side"></div><div class="ph-main"><span class="ph-dot"></span><div class="ph-line"></div><div class="ph-line s"></div><span class="ph-name">${esc(s.name)}</span></div></div>`;
}
function modeToggleHTML(s, mode) {
  const modes = modesOf(s);
  if (modes.length < 2) return "";
  return `<div class="modes" role="group" aria-label="Preview appearance">${modes.map(m =>
    `<button type="button" data-mode="${m}" aria-pressed="${m === mode}">${m === "dark" ? ICON.moon : ICON.sun}${m}</button>`).join("")}</div>`;
}
function shotHTML(s, { openable = true, modes = true } = {}) {
  const mode = effectiveMode(s);
  const img = s.images && s.images[0];
  const hasFrame = s.previews && s.previews[mode];
  let inner;
  if (hasFrame) inner = placeholderHTML(s, mode);
  else if (img) inner = `<img src="${esc(img.src)}" alt="${esc(img.alt || s.name)}" loading="lazy"/><span class="caption">Screenshot from the author’s post</span>`;
  else inner = `<div class="ph"><div class="ph-main"><span class="ph-name">No preview</span></div></div>`;
  const open = openable ? `<button class="open" type="button" data-open="${esc(s.id)}" aria-label="Open details for ${esc(s.name)}"><span>View details</span></button>` : "";
  return `<div class="shot" data-preview-for="${esc(s.id)}" data-mode="${mode}" ${hasFrame ? "" : 'data-static="1"'}>${inner}${open}${modes ? modeToggleHTML(s, mode) : ""}</div>`;
}
function stripHTML(s) {
  const sw = s.swatches || [];
  if (!sw.length) return "";
  return `<div class="strip" aria-hidden="true">${sw.map(x => `<i style="background:${esc(x.color)}" title="${esc(x.label)} ${esc(x.color)}"></i>`).join("")}</div>`;
}
function factsHTML(s) {
  const f = [];
  if (s.animated) f.push(`<li class="anim">Animated</li>`);
  if (s.hasCss) f.push(`<li class="css">Custom CSS</li>`);
  else if (s.jsonFile) f.push(`<li>Palette only</li>`);
  f.push(`<li>${modesOf(s).join(" + ")}</li>`);
  f.push(`<li>${esc(s.source)}</li>`);
  if (!s.jsonFile) f.push(`<li class="nofile">No file</li>`);
  return `<ul class="facts">${f.join("")}</ul>`;
}
function tagsHTML(s, limit = 6) {
  return `<div class="tags">${(s.tags || []).slice(0, limit).map(t => TAG_SET.has(t)
    ? `<button class="tag" type="button" data-tag="${esc(t)}" aria-pressed="${state.tags.includes(t)}" title="Filter by tag">${esc(t)}</button>`
    : `<span class="tag" style="cursor:default">${esc(t)}</span>`).join("")}</div>`;
}
const cmdFor = s => `t3 theme set ${s.id}.json`;
function byline(s, withSource) {
  const bits = [`by <b>${esc(s.author)}</b>`];
  if (withSource) bits.push(esc(s.source));
  bits.push(fmtDate(s.createdAt));
  if (s.installCount != null) bits.push(plural(s.installCount, "install"));
  return bits.join(" · ");
}

function cardHTML(s) {
  const pinned = state.compare.includes(s.id);
  const dl = s.jsonFile ? `<a class="btn sm primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">${ICON.down}<span class="label">JSON</span></a>
    <button class="btn sm" type="button" data-copy="${esc(cmdFor(s))}" title="Copy: ${esc(cmdFor(s))}">${ICON.copy}<span class="label">Command</span></button>` : "";
  const src = s.sourceUrl ? `<a class="btn sm" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener" title="Open source page">${esc(s.source === "X" ? "Post" : "Source")}${ICON.ext}</a>` : "";
  return `<article class="card${pinned ? " pinned" : ""}" data-id="${esc(s.id)}" aria-labelledby="t-${esc(s.id)}">
    ${shotHTML(s)}
    ${stripHTML(s)}
    <div class="body">
      <div class="head">
        <h2 id="t-${esc(s.id)}"><button type="button" data-open="${esc(s.id)}">${esc(s.name)}</button></h2>
        <button class="pin" type="button" data-pin="${esc(s.id)}" aria-pressed="${pinned}" aria-label="${pinned ? "Remove from compare" : "Add to compare"}">${pinned ? ICON.check : ICON.pin}<span class="label">${pinned ? "Comparing" : "Compare"}</span></button>
      </div>
      <p class="by">${byline(s)}</p>
      ${factsHTML(s)}
      ${tagsHTML(s)}
      <div class="actions">${dl}${src}<span class="grow"></span><button class="btn sm quiet" type="button" data-open="${esc(s.id)}">Details</button></div>
    </div>
  </article>`;
}

const PREVIEW_WIDTH = 540;
const ro = new ResizeObserver(entries => {
  for (const e of entries) {
    const w = e.contentRect.width, h = e.contentRect.height;
    if (!w || !h) continue;
    const s = Math.min(1, w / PREVIEW_WIDTH);
    e.target.style.setProperty("--s", s.toFixed(4));
    e.target.style.setProperty("--pw", `${Math.round(w / s)}px`);
    e.target.style.setProperty("--ph", `${Math.round(h / s)}px`);
  }
});
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) mount(e.target); else unmount(e.target);
  }
}, { rootMargin: "900px 0px" });

function mount(shot) {
  if (shot.dataset.static) return;
  const s = byId.get(shot.dataset.previewFor);
  if (!s) return;
  const mode = shot.dataset.mode || effectiveMode(s);
  const src = s.previews && s.previews[mode];
  if (!src) return;
  shot.querySelector(".play")?.remove();
  if (!canPlay(s)) {
    unmount(shot);
    shot.insertAdjacentHTML("beforeend", `<button class="play" type="button" data-play="${esc(s.id)}" aria-label="Play animated preview of ${esc(s.name)}"><span>${ICON.play}Play animated preview</span></button>`);
    return;
  }
  ro.observe(shot);
  const existing = shot.querySelector("iframe");
  if (existing && existing.dataset.src === src) return;
  existing?.remove();
  shot.classList.remove("ready");
  const f = document.createElement("iframe");
  f.src = src;
  f.dataset.src = src;
  f.title = `${s.name} preview, ${mode}`;
  f.loading = "lazy";
  f.tabIndex = -1;
  f.setAttribute("aria-hidden", "true");
  f.addEventListener("load", () => shot.classList.add("ready"), { once: true });
  const anchor = shot.querySelector(".open, .modes");
  shot.insertBefore(f, anchor);
}
function unmount(shot) {
  const f = shot.querySelector("iframe");
  if (f) { f.remove(); shot.classList.remove("ready"); }
}
function setShotMode(shot, mode) {
  const s = byId.get(shot.dataset.previewFor);
  if (!s || !s.previews?.[mode]) return;
  shot.dataset.mode = mode;
  shot.querySelector(".ph")?.remove();
  shot.insertAdjacentHTML("afterbegin", placeholderHTML(s, mode));
  $$("[data-mode]", shot).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  const wasLive = !!shot.querySelector("iframe, .play");
  unmount(shot);
  if (wasLive || !shot.closest("#grid")) mount(shot);
}
function refreshShots(root = document) {
  $$(".shot", root).forEach(shot => {
    const s = byId.get(shot.dataset.previewFor);
    if (!s || shot.dataset.static) return;
    const mode = effectiveMode(s);
    if (shot.dataset.mode !== mode) setShotMode(shot, mode);
    else if (shot.querySelector("iframe, .play") || !shot.closest("#grid")) mount(shot);
  });
}

function render() {
  current = filtered();
  const grid = $("#grid");
  io.disconnect();
  ro.disconnect();
  grid.innerHTML = current.length ? current.map(cardHTML).join("") :
    `<div class="empty"><h3>No skins match.</h3><p>Try fewer filters or a shorter search.</p><button class="btn" type="button" id="emptyClear">Clear all filters</button></div>`;
  $$(".shot", grid).forEach(el => io.observe(el));
  $("#railCount").textContent = current.length === G.skins.length ? `all ${G.skins.length}` : `${current.length} of ${G.skins.length}`;
  $("#status").innerHTML = current.length === G.skins.length
    ? `Showing all <b>${G.skins.length}</b> skins`
    : `<b>${current.length}</b> of ${G.skins.length} skins`;
  renderActiveChips();
  updateFacetCounts();
  writeHash();
}

function activeFilters() {
  const list = [];
  const label = { dark: "Dark", light: "Light", dual: "Dark + light", animated: "Animated", static: "Static", css: "Custom CSS", palette: "Palette only" };
  if (state.q) list.push({ k: "q", text: `“${state.q}”` });
  if (state.appearance !== "all") list.push({ k: "appearance", text: label[state.appearance] });
  if (state.motion !== "all") list.push({ k: "motion", text: label[state.motion] });
  if (state.css !== "all") list.push({ k: "css", text: label[state.css] });
  if (state.source !== "all") list.push({ k: "source", text: state.source === "X" ? "X only" : state.source });
  state.tags.forEach(t => list.push({ k: "tag", v: t, text: `#${t}` }));
  return list;
}
function renderActiveChips() {
  const items = activeFilters();
  $("#activeChips").innerHTML = items.map(i =>
    `<span class="achip"><b>${esc(i.text)}</b><button type="button" data-remove="${i.k}" data-value="${esc(i.v || "")}" aria-label="Remove filter ${esc(i.text)}">×</button></span>`).join("");
  $("#clearAll").hidden = !items.length;
  const fc = $("#filterCount");
  fc.hidden = !items.length;
  fc.textContent = items.length;
}
function updateFacetCounts() {
  for (const key of ["appearance", "motion", "css", "source"]) {
    $$(`input[name="${key}"]`).forEach(inp => {
      const lab = inp.closest("label");
      const n = lab.querySelector(".n");
      const c = inp.value === "all" && key !== "source" ? null : countWith(key, inp.value);
      if (n) n.textContent = c == null ? "" : c;
      lab.classList.toggle("zero", c === 0);
    });
  }
  $$("#tagsCloud .tagbtn").forEach(b => {
    const t = b.dataset.tag;
    const on = state.tags.includes(t);
    const c = tagCount(t);
    b.setAttribute("aria-pressed", String(on));
    b.querySelector(".n").textContent = c;
    b.classList.toggle("zero", c === 0);
  });
  updateTagsVisibility();
}
function updateTagsVisibility() {
  const expanded = $("#tagsMore").getAttribute("aria-expanded") === "true";
  $$("#tagsCloud .tagbtn").forEach((b, i) => {
    b.hidden = !expanded && i >= TAGS_VISIBLE && !state.tags.includes(b.dataset.tag);
  });
}
function syncControls() {
  $("#search").value = state.q;
  for (const key of ["appearance", "motion", "css", "source", "pv"]) {
    const inp = $(`input[name="${key}"][value="${CSS.escape(state[key])}"]`);
    if (inp) inp.checked = true;
  }
  $(`input[name="play"][value="${state.play ? "1" : "0"}"]`).checked = true;
  $(`input[name="density"][value="${document.documentElement.dataset.density === "compact" ? "compact" : "comfy"}"]`).checked = true;
  $("#sort").value = state.sort;
}

function toggleTag(t) {
  state.tags = state.tags.includes(t) ? state.tags.filter(x => x !== t) : [...state.tags, t];
  render();
}
function clearFilters() {
  Object.assign(state, { q: "", appearance: "all", motion: "all", css: "all", source: "all", tags: [] });
  syncControls();
  render();
}

function updateCompareUI() {
  const n = state.compare.length;
  $("#compareCount").textContent = n;
  $("#compareBtn").setAttribute("aria-pressed", String(n > 0));
  $("#compareBar").hidden = n === 0;
  $("#compareBarCount").textContent = n;
  $("#compareChips").innerHTML = state.compare.map(id => {
    const s = byId.get(id);
    const ac = (s.swatches || []).find(x => x.label === "accent")?.color || "var(--accent)";
    return `<button type="button" data-unpin="${esc(id)}" aria-label="Remove ${esc(s.name)} from compare"><i style="background:${esc(ac)}"></i>${esc(s.name)} ×</button>`;
  }).join("");
  $$(".card").forEach(c => c.classList.toggle("pinned", state.compare.includes(c.dataset.id)));
  $$("[data-pin]").forEach(b => {
    const on = state.compare.includes(b.dataset.pin);
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? "Remove from compare" : "Add to compare");
    b.innerHTML = `${on ? ICON.check : ICON.pin}<span class="label">${on ? "Comparing" : "Compare"}</span>`;
  });
  writeHash();
}
function togglePin(id) {
  if (state.compare.includes(id)) state.compare = state.compare.filter(x => x !== id);
  else if (state.compare.length >= MAX_COMPARE) { toast(`Compare holds ${MAX_COMPARE} skins. Remove one first.`); return; }
  else { state.compare.push(id); if (state.compare.length === 1) toast("Added. Pin up to 4, then press Open."); }
  updateCompareUI();
  const cd = $("#compare");
  if (cd.open) renderCompare();
}

function detailsHTML(s, idx) {
  const n = current.length;
  const inList = idx >= 0;
  const sw = (s.swatches || []).map(x => `<button class="swatch" type="button" data-copy="${esc(x.color)}" title="Copy ${esc(x.color)}"><i style="background:${esc(x.color)}"></i><span><small>${esc(x.label)}</small><b>${esc(x.color)}</b></span></button>`).join("");
  const links = (s.links || []).map(l => `<a class="btn sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${ICON.ext}</a>`).join("");
  const dl = s.jsonFile ? `<a class="btn sm primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">${ICON.down}Download JSON</a>` : "";
  const install = s.jsonFile
    ? `<div class="install"><ol>
        <li>Download <code>${esc(s.id)}.json</code>.</li>
        <li>In T3 Code open <strong>Settings → Appearance</strong>, press <strong>Add</strong>, and drop the file in.</li>
        <li>Or, on the machine running the T3 server:</li></ol>
        <div class="cmd"><code>${esc(cmdFor(s))}</code><button class="btn sm" type="button" data-copy="${esc(cmdFor(s))}">${ICON.copy}Copy</button></div></div>`
    : `<div class="install"><p>No public theme file was found for this one. Use the source link for the original post.</p></div>`;
  const mode = effectiveMode(s);
  const modes = modesOf(s);
  const meta = [
    ["Source", `<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.source)}</a>`],
    ["Shared", esc(fmtDate(s.createdAt, true))],
    ["Modes", esc(modes.join(" + "))],
    ["Styling", s.hasCss ? "Custom CSS" : s.jsonFile ? "Palette only" : "—"],
    ["Motion", s.animated ? "Animated" : "Static"],
    s.installCount != null ? ["Installs", esc(String(s.installCount))] : null,
    s.likeCount != null ? ["Likes", esc(String(s.likeCount))] : null,
    s.jsonFile ? ["File", `<code>${esc(s.jsonFile)}</code>`] : null,
  ].filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  const livePreview = s.previews?.[mode] ? `<a class="btn sm quiet" href="${esc(s.previews[mode])}" target="_blank" rel="noopener">Open preview in a tab${ICON.ext}</a>` : "";
  return `<div class="d-frame">
    <div class="d-top">
      <button class="btn icon" type="button" data-nav="-1" aria-label="Previous skin" ${inList && n > 1 ? "" : "disabled"}>${ICON.prev}</button>
      <span class="pos">${inList ? `${idx + 1} / ${n}` : "—"}</span>
      <button class="btn icon" type="button" data-nav="1" aria-label="Next skin" ${inList && n > 1 ? "" : "disabled"}>${ICON.next}</button>
      <span class="spacer"></span>
      <button class="pin" type="button" data-pin="${esc(s.id)}" aria-pressed="${state.compare.includes(s.id)}">${state.compare.includes(s.id) ? ICON.check : ICON.pin}<span class="label">${state.compare.includes(s.id) ? "Comparing" : "Compare"}</span></button>
      <button class="btn icon" type="button" data-close aria-label="Close details">${ICON.close}</button>
    </div>
    <div class="d-main">
      <div class="d-preview">
        ${shotHTML(s, { openable: false, modes: false })}
        <div class="d-under">${modes.length > 1 ? `<span class="hint">Preview</span>` : ""}${modes.length > 1 ? modeToggleHTML(s, mode) : `<span class="hint">${esc(mode)} only</span>`}<span class="spacer"></span>${livePreview}</div>
      </div>
      <div class="d-body">
        <h2 id="dTitle">${esc(s.name)}</h2>
        <p class="by">${byline(s, true)}</p>
        ${factsHTML(s)}
        <p class="desc">${esc(s.description || "")}</p>
        <dl class="meta">${meta}</dl>
        ${sw ? `<h3>Palette</h3><div class="swatches">${sw}</div>` : ""}
        ${(s.tags || []).length ? `<h3>Tags</h3>${tagsHTML(s, 99)}` : ""}
        <h3>Install</h3>${install}
        <h3>Links</h3><div class="links">${dl}${links}</div>
      </div>
    </div>
  </div>`;
}
function openDetails(id, trigger) {
  const s = byId.get(id);
  if (!s) return;
  const dlg = $("#details");
  if (trigger) lastTrigger = trigger;
  state.skin = id;
  const idx = current.findIndex(x => x.id === id);
  dlg.innerHTML = detailsHTML(s, idx);
  mount($(".d-preview .shot", dlg));
  if (!dlg.open) dlg.showModal();
  $(".d-body", dlg).scrollTop = 0;
  $("[data-close]", dlg).focus();
  writeHash();
}
function navDetails(dir) {
  if (!current.length) return;
  let i = current.findIndex(x => x.id === state.skin);
  if (i < 0) return;
  i = (i + dir + current.length) % current.length;
  openDetails(current[i].id);
}

function compareHTML() {
  const panes = state.compare.map(id => byId.get(id)).filter(Boolean).map(s => `
    <div class="pane" data-id="${esc(s.id)}">
      ${shotHTML(s, { openable: false })}
      ${stripHTML(s)}
      <div class="pane-body">
        <h2>${esc(s.name)}</h2>
        <p class="by">${byline(s, true)}</p>
        ${factsHTML(s)}
        <div class="actions">
          ${s.jsonFile ? `<a class="btn sm primary" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">${ICON.down}JSON</a>` : ""}
          <button class="btn sm" type="button" data-open="${esc(s.id)}">Details</button>
          <span class="grow"></span>
          <button class="btn sm quiet" type="button" data-unpin="${esc(s.id)}">Remove</button>
        </div>
      </div>
    </div>`).join("");
  return `<div class="cmp-frame">
    <div class="d-top">
      <h2 id="cTitle" style="font-size:15px">Compare <span class="pos">${state.compare.length} of ${MAX_COMPARE}</span></h2>
      <span class="spacer"></span>
      <button class="btn sm quiet" type="button" id="compareClearIn" ${state.compare.length ? "" : "disabled"}>Clear</button>
      <button class="btn icon" type="button" data-close aria-label="Close compare">${ICON.close}</button>
    </div>
    <div class="cmp-grid">${panes || `<div class="empty"><h3>Nothing to compare yet.</h3><p>Press “Compare” on up to four cards, then come back here.</p></div>`}</div>
  </div>`;
}
function renderCompare() {
  const dlg = $("#compare");
  dlg.innerHTML = compareHTML();
  $$(".shot", dlg).forEach(mount);
}
function openCompare(trigger) {
  const dlg = $("#compare");
  if (trigger) lastTrigger = trigger;
  renderCompare();
  if (!dlg.open) dlg.showModal();
  $("[data-close]", dlg).focus();
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.append(ta); ta.select();
    try { document.execCommand("copy"); } catch { }
    ta.remove();
  }
  toast(`Copied ${text}`);
}

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("skins.theme", t); } catch { }
  const b = $("#themeBtn");
  b.innerHTML = t === "dark" ? ICON.sun : ICON.moon;
  b.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
}
function applyDensity(d) {
  document.documentElement.dataset.density = d;
  try { localStorage.setItem("skins.density", d); } catch { }
}
function openRail(open) {
  document.body.classList.toggle("rail-open", open);
  $("#railOpen").setAttribute("aria-expanded", String(open));
  if (open) $("#search").focus(); else $("#railOpen").focus();
}

function renderStats() {
  const c = G.counts;
  $("#stats").innerHTML = `
    <div class="stat"><b>${c.total}</b><span>skins</span></div>
    <div class="stat"><b>${c.animated}</b><span>animated</span></div>
    <div class="stat"><b>${c.withJson}</b><span>with JSON file</span></div>
    <div class="stat src"><span><b>${c.t3skins}</b> t3skins.dev</span><span><b>${c.github}</b> GitHub</span><span><b>${c.x}</b> X only</span><span><b>${c.hasCss}</b> custom CSS</span><span class="refresh">refreshed ${esc(fmtDate(G.generatedAt, true))}</span></div>`;
  $("#topstats").textContent = `${c.total} skins · ${c.animated} animated · ${c.withJson} with JSON`;
}
function renderTagCloud() {
  $("#tagsCloud").innerHTML = TAGS.map(([t, n]) =>
    `<button class="tagbtn" type="button" data-tag="${esc(t)}" aria-pressed="false">${esc(t)} <span class="n">${n}</span></button>`).join("");
}

function bind() {
  const search = $("#search");
  let timer;
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = search.value.trim().toLowerCase(); render(); }, 120);
  });
  search.addEventListener("keydown", e => {
    if (e.key === "Escape" && search.value) { e.preventDefault(); e.stopPropagation(); search.value = ""; state.q = ""; render(); }
  });
  $("#searchClear").addEventListener("click", () => { search.value = ""; state.q = ""; render(); search.focus(); });

  $("#rail").addEventListener("change", e => {
    const inp = e.target;
    if (!(inp instanceof HTMLInputElement) || inp.type !== "radio") return;
    const key = inp.name;
    if (["appearance", "motion", "css", "source"].includes(key)) { state[key] = inp.value; render(); }
    else if (key === "pv") { state.pv = inp.value; cardMode.clear(); refreshShots(); writeHash(); }
    else if (key === "play") { state.play = inp.value === "1"; forcePlay.clear(); refreshShots(); writeHash(); }
    else if (key === "density") applyDensity(inp.value);
  });
  $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  $("#tagsMore").addEventListener("click", e => {
    const b = e.currentTarget;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    b.textContent = open ? "Show fewer" : "Show all";
    updateTagsVisibility();
  });
  $("#clearAll").addEventListener("click", clearFilters);
  $("#railOpen").addEventListener("click", () => openRail(true));
  $("#railClose").addEventListener("click", () => openRail(false));
  $("#themeBtn").addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#compareBtn").addEventListener("click", e => openCompare(e.currentTarget));
  $("#compareOpen").addEventListener("click", e => openCompare(e.currentTarget));
  $("#compareClear").addEventListener("click", () => { state.compare = []; updateCompareUI(); });

  document.addEventListener("click", e => {
    const t = e.target.closest("button, a, .achip button");
    if (!t) {
      if (e.target instanceof HTMLDialogElement) e.target.close();
      return;
    }
    const d = t.dataset;
    if (d.tag !== undefined) { toggleTag(d.tag); if (t.closest("dialog")) t.closest("dialog").close(); return; }
    if (d.remove) {
      if (d.remove === "q") { state.q = ""; $("#search").value = ""; }
      else if (d.remove === "tag") state.tags = state.tags.filter(x => x !== d.value);
      else state[d.remove] = "all";
      syncControls(); render(); return;
    }
    if (t.id === "emptyClear") { clearFilters(); return; }
    if (d.mode) {
      const shot = t.closest(".shot") || t.closest(".d-preview")?.querySelector(".shot");
      if (!shot) return;
      cardMode.set(shot.dataset.previewFor, d.mode);
      setShotMode(shot, d.mode);
      const under = t.closest(".d-under");
      if (under) $$("[data-mode]", under).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === d.mode)));
      return;
    }
    if (d.play) { forcePlay.add(d.play); const shot = t.closest(".shot"); t.remove(); mount(shot); return; }
    if (d.open) { openDetails(d.open, t); return; }
    if (d.pin) { togglePin(d.pin); return; }
    if (d.unpin) { togglePin(d.unpin); return; }
    if (d.copy) { copyText(d.copy); return; }
    if (d.nav) { navDetails(Number(d.nav)); return; }
    if (t.id === "compareClearIn") { state.compare = []; updateCompareUI(); renderCompare(); return; }
    if (d.close !== undefined) { t.closest("dialog")?.close(); return; }
  });

  const details = $("#details");
  details.addEventListener("close", () => {
    $$(".shot", details).forEach(unmount);
    state.skin = null;
    writeHash();
    lastTrigger?.isConnected ? lastTrigger.focus() : null;
  });
  details.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea, select")) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); navDetails(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); navDetails(1); }
  });
  const compare = $("#compare");
  compare.addEventListener("close", () => {
    $$(".shot", compare).forEach(unmount);
    lastTrigger?.isConnected ? lastTrigger.focus() : null;
  });

  document.addEventListener("keydown", e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const inField = e.target.matches("input, textarea, select, [contenteditable]");
    if (e.key === "/" && !inField && !$("#details").open && !$("#compare").open) {
      e.preventDefault();
      if (matchMedia("(max-width: 1023px)").matches) openRail(true);
      else { $("#search").focus(); $("#search").select(); }
    }
    if (e.key === "Escape" && document.body.classList.contains("rail-open")) openRail(false);
  });
  matchMedia("(min-width: 1024px)").addEventListener("change", e => { if (e.matches) openRail(false); });
  window.addEventListener("hashchange", () => { readHash(); syncControls(); render(); updateCompareUI(); if (state.skin) openDetails(state.skin); });
}

function boot() {
  renderStats();
  renderTagCloud();
  readHash();
  syncControls();
  applyTheme(document.documentElement.dataset.theme || "dark");
  bind();
  render();
  updateCompareUI();
  if (state.skin) openDetails(state.skin);
}
boot();
})();
