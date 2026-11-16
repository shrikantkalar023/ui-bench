const G = window.GALLERY;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  q: "",
  mode: "all",
  motion: "all",
  css: "all",
  src: "all",
  tag: "all",
  sort: "newest",
  prev: reduceMotion.matches ? "still" : "live",
  dual: "dark",
  skin: "",
};
const DEFAULTS = { ...state, skin: "" };
const STAGE_IDLE_LIMIT_PX = 500;
const UNMOUNT_LIMIT_PX = 1600;

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const modesOf = (s) => s.modes || [s.appearance || "dark"];
const isDual = (s) => modesOf(s).includes("dark") && modesOf(s).includes("light");
const byId = (id) => G.skins.find((x) => x.id === id);
const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Calcutta", day: "numeric", month: "short", year: "numeric" });
const fmtDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso || "" : dateFmt.format(d);
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
probe.canvas.width = probe.canvas.height = 1;
function rgbOf(color, base) {
  probe.fillStyle = base;
  probe.fillRect(0, 0, 1, 1);
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
function luminance([r, g, b]) {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastOn(color, base) {
  return luminance(rgbOf(color, base)) > 0.36 ? "#161618" : "#f4f4f2";
}
function paletteFor(s, mode) {
  const p = (s.palettes || {})[mode] || Object.values(s.palettes || {})[0];
  if (!p || !p.canvas) return null;
  const base = mode === "light" ? "#ffffff" : "#000000";
  const text = p.text || contrastOn(p.canvas, base);
  const accent = p.accent || text;
  return {
    canvas: p.canvas,
    sidebar: p.sidebar || p.canvas,
    surface: p.surface || p.canvas,
    border: p.border || text,
    accent,
    text,
    accentFg: contrastOn(accent, base),
    base,
  };
}

function textMatch(s, q) {
  if (!q) return true;
  const blob = [s.id, s.name, s.author, s.description, (s.tags || []).join(" "), s.source].join(" ").toLowerCase();
  return q.split(/\s+/).every((t) => blob.includes(t));
}
function filtered() {
  const list = G.skins.filter((s) => {
    if (!textMatch(s, state.q)) return false;
    const modes = modesOf(s);
    if (state.mode === "dark" && !modes.includes("dark")) return false;
    if (state.mode === "light" && !modes.includes("light")) return false;
    if (state.mode === "dual" && !isDual(s)) return false;
    if (state.motion === "animated" && !s.animated) return false;
    if (state.motion === "static" && s.animated) return false;
    if (state.css === "css" && !s.hasCss) return false;
    if (state.css === "palette" && s.hasCss) return false;
    if (state.src !== "all" && s.source !== state.src) return false;
    if (state.tag !== "all" && !(s.tags || []).includes(state.tag)) return false;
    return true;
  });
  const key = {
    newest: (s) => -(Date.parse(s.createdAt || 0) || 0),
    name: (s) => (s.name || "").toLowerCase(),
    installs: (s) => -(s.installCount ?? -1),
    animated: (s) => (s.animated ? "0" : "1") + (s.name || "").toLowerCase(),
  }[state.sort];
  return list.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

function defaultMode(s) {
  const modes = modesOf(s);
  return modes.includes(state.dual) ? state.dual : modes[0];
}
function traitsHTML(s) {
  const bits = [];
  const modes = modesOf(s);
  bits.push(isDual(s) ? "Dark and light" : cap(modes[0]));
  if (s.animated) bits.push("Animated");
  if (s.hasCss) bits.push("Custom CSS");
  else if (s.jsonFile) bits.push("Palette only");
  if (!s.jsonFile) bits.push("No theme file");
  return `<ul class="traits">${bits.map((b) => `<li>${b}</li>`).join("")}</ul>`;
}
function metaText(s) {
  const parts = [`by ${s.author}`, s.source, fmtDate(s.createdAt)];
  if (s.installCount != null) parts.push(`${s.installCount} installs`);
  return esc(parts.join(", "));
}
function mockHTML(s, mode) {
  const p = paletteFor(s, mode);
  if (!p) return "";
  const vars = `--m-canvas:${p.canvas};--m-sidebar:${p.sidebar};--m-surface:${p.surface};--m-border:${p.border};--m-accent:${p.accent};--m-text:${p.text}`;
  return `<div class="mock" style="${esc(vars)}" aria-hidden="true">
    <div class="side"><i></i><i></i><i></i><i></i></div>
    <div class="main"><div class="bubble"><i></i><i style="width:70%"></i></div><div class="bubble me"><i></i></div><div class="bar"><b></b></div></div>
  </div>`;
}
function stripHTML(s) {
  const p = paletteFor(s, defaultMode(s));
  if (!p) return `<div class="strip none" aria-hidden="true"></div>`;
  const cells = [p.canvas, p.sidebar, p.surface, p.border, p.text, p.accent];
  return `<div class="strip" aria-hidden="true">${cells.map((c, i) => `<i class="${i === 5 ? "a" : ""}" style="background:${esc(c)}"></i>`).join("")}</div>`;
}
function frameHTML(s, mode, opts = {}) {
  const src = s.previews && s.previews[mode];
  const img = s.images && s.images[0];
  let inner = "";
  if (src) {
    inner = mockHTML(s, mode) + (opts.eager ? iframeHTML(s, src) : "");
  } else if (img) {
    inner = `<img src="${esc(img.src)}" alt="${esc(img.alt || s.name)}" loading="lazy"/>`;
  } else {
    inner = `<div class="noprev">No preview available</div>`;
  }
  const modes = modesOf(s);
  const toggle = modes.length > 1 && src && !opts.noToggle
    ? `<div class="modes" role="group" aria-label="Preview mode">${modes.map((m) => `<button type="button" data-mode="${m}" aria-pressed="${m === mode}">${cap(m)}</button>`).join("")}</div>`
    : "";
  return `<div class="preview"><div class="frame" data-preview-for="${esc(s.id)}" data-mode="${mode}" ${src ? `data-src="${esc(src)}"` : ""}>${inner}</div>${toggle}</div>`;
}
function iframeHTML(s, src) {
  return `<iframe title="${esc(s.name)} preview in a mock T3 Code window" src="${esc(src)}" tabindex="-1"></iframe>`;
}

function card(s, stageId) {
  const mode = defaultMode(s);
  const tags = (s.tags || []).map((t) => `<button type="button" data-tag="${esc(t)}" aria-pressed="${state.tag === t}">${esc(t)}</button>`).join("");
  const dl = s.jsonFile ? `<a class="btn fill" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">Download JSON</a>` : "";
  const on = s.id === stageId;
  return `<article class="skin${on ? " on-stage" : ""}" data-id="${esc(s.id)}">
    ${frameHTML(s, mode)}
    ${stripHTML(s)}
    <h2><button type="button" data-stage="${esc(s.id)}" aria-label="Try ${esc(s.name)} on the stage">${esc(s.name)}</button></h2>
    <p class="meta">${metaText(s)}</p>
    ${traitsHTML(s)}
    <div class="tags">${tags}</div>
    <div class="acts">
      <button class="btn${on ? " on" : ""}" type="button" data-stage="${esc(s.id)}" ${on ? 'aria-current="true"' : ""}>${on ? "On stage" : "Try on"}</button>
      <button class="btn" type="button" data-open="${esc(s.id)}">Details</button>
      ${dl}
    </div>
  </article>`;
}

let mounted = null;
function mountObserver() {
  if (mounted) mounted.disconnect();
  mounted = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const f = e.target;
      if (!f.dataset.src) continue;
      const iframe = f.querySelector("iframe");
      if (e.isIntersecting && !iframe && state.prev === "live") {
        f.insertAdjacentHTML("beforeend", iframeHTML(byId(f.dataset.previewFor), f.dataset.src));
      } else if (!e.isIntersecting && iframe) {
        iframe.remove();
      }
    }
  }, { rootMargin: `${UNMOUNT_LIMIT_PX}px 0px` });
  $$("#grid .frame[data-src]").forEach((f) => mounted.observe(f));
}

function render() {
  const list = filtered();
  const grid = $("#grid");
  grid.innerHTML = list.map((s) => card(s, state.skin)).join("") ||
    `<div class="empty"><p>No skins match these filters. Try fewer filters or a shorter search.</p><button class="btn" type="button" data-reset>Clear all filters</button></div>`;
  const activeFilters = ["q", "mode", "motion", "css", "src", "tag"].filter((k) => state[k] !== DEFAULTS[k]).length;
  $("#status").innerHTML = `${list.length} of ${G.skins.length} skins${activeFilters ? ` <button class="linkish" type="button" data-reset>Clear filters</button>` : ""}`;
  mountObserver();
  renderStageStep(list);
}

function renderStage(id) {
  const s = byId(id);
  const el = $("#stage");
  const stage = document.querySelector(".stage");
  if (!s) {
    el.innerHTML = `<p class="stage-empty">Pick a skin below to see it here at full size.</p>`;
    return;
  }
  const mode = defaultMode(s);
  const p = paletteFor(s, mode);
  const st = stage.style;
  if (p) {
    st.setProperty("--st-canvas", p.canvas);
    st.setProperty("--st-surface", p.surface);
    st.setProperty("--st-border", p.border);
    st.setProperty("--st-text", p.text);
    st.setProperty("--st-muted", `color-mix(in srgb, ${p.text} 72%, ${p.canvas})`);
    st.setProperty("--st-accent", p.accent);
    st.setProperty("--st-accent-fg", p.accentFg);
  } else {
    ["--st-canvas", "--st-surface", "--st-border", "--st-text", "--st-muted", "--st-accent", "--st-accent-fg"].forEach((v) => st.removeProperty(v));
  }
  const swatches = (s.swatches || []).map((sw) => `<li><i style="background:${esc(sw.color)}"></i>${esc(sw.label)}</li>`).join("");
  const dl = s.jsonFile ? `<a class="btn fill" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">Download JSON</a>` : "";
  const src = s.sourceUrl ? `<a class="btn" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">Open source page</a>` : "";
  const full = s.previews && s.previews[mode] ? `<a class="btn" href="${esc(s.previews[mode])}" target="_blank" rel="noopener">Open preview full size</a>` : "";
  const nofile = s.jsonFile ? "" : `<p class="nofile">No public theme file was found for this one. The source post is the only copy.</p>`;
  el.innerHTML = `
    ${frameHTML(s, mode, { eager: state.prev === "live" })}
    <div class="stage-info">
      <div>
        <h2>${esc(s.name)}</h2>
        <p class="byline">${metaText(s)}</p>
      </div>
      ${traitsHTML(s)}
      ${s.description ? `<p class="desc">${esc(s.description)}</p>` : ""}
      ${swatches ? `<ul class="swatches">${swatches}</ul>` : ""}
      ${nofile}
      <div class="acts">${dl}<button class="btn" type="button" data-open="${esc(s.id)}">Details and install</button>${src}${full}</div>
      <div class="step">
        <button class="btn" type="button" data-step="-1" aria-label="Previous skin">&#8592;</button>
        <button class="btn" type="button" data-step="1" aria-label="Next skin">&#8594;</button>
        <span class="pos" id="stagePos"></span>
      </div>
    </div>`;
  renderStageStep(filtered());
}
function renderStageStep(list) {
  const pos = $("#stagePos");
  if (!pos) return;
  const i = list.findIndex((s) => s.id === state.skin);
  pos.textContent = i >= 0 ? `${i + 1} of ${list.length} shown` : list.length ? `Not in the ${list.length} shown` : "";
  $$("#stage [data-step]").forEach((b) => { b.disabled = list.length === 0; });
}
function setStage(id, { scroll = false } = {}) {
  state.skin = id;
  renderStage(id);
  $$("#grid .skin").forEach((a) => {
    const on = a.dataset.id === id;
    a.classList.toggle("on-stage", on);
    const b = a.querySelector(".acts [data-stage]");
    if (b) {
      b.textContent = on ? "On stage" : "Try on";
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    }
  });
  writeHash();
  if (scroll) {
    const top = document.querySelector(".stage").getBoundingClientRect().top;
    if (top < 0 || top > STAGE_IDLE_LIMIT_PX) document.querySelector(".stage").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
  }
}
function stepStage(dir) {
  const list = filtered();
  if (!list.length) return;
  const i = list.findIndex((s) => s.id === state.skin);
  const next = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
  setStage(list[next].id);
}

function swapMode(frame, mode) {
  const s = byId(frame.dataset.previewFor);
  if (!s || !s.previews || !s.previews[mode]) return;
  frame.dataset.mode = mode;
  frame.dataset.src = s.previews[mode];
  frame.parentElement.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  const mock = frame.querySelector(".mock");
  if (mock) mock.outerHTML = mockHTML(s, mode);
  const iframe = frame.querySelector("iframe");
  if (iframe) iframe.src = s.previews[mode];
  const strip = frame.closest(".skin")?.querySelector(".strip");
  if (strip && frame.closest(".skin")) {
    const p = paletteFor(s, mode);
    if (p) strip.innerHTML = [p.canvas, p.sidebar, p.surface, p.border, p.text, p.accent].map((c, i) => `<i class="${i === 5 ? "a" : ""}" style="background:${esc(c)}"></i>`).join("");
  }
  if (frame.closest("#stage")) {
    const p = paletteFor(s, mode);
    const st = document.querySelector(".stage").style;
    if (p) {
      st.setProperty("--st-canvas", p.canvas);
      st.setProperty("--st-surface", p.surface);
      st.setProperty("--st-border", p.border);
      st.setProperty("--st-text", p.text);
      st.setProperty("--st-muted", `color-mix(in srgb, ${p.text} 72%, ${p.canvas})`);
      st.setProperty("--st-accent", p.accent);
      st.setProperty("--st-accent-fg", p.accentFg);
    }
  }
}

let opener = null;
function openDetails(id, from) {
  const s = byId(id);
  if (!s) return;
  opener = from || document.activeElement;
  const dlg = $("#details");
  const modes = modesOf(s).filter((m) => s.previews && s.previews[m]);
  const previews = modes.length
    ? modes.map((m) => `<figure>${frameHTML(s, m, { eager: true, noToggle: true })}<figcaption>${cap(m)} mode</figcaption></figure>`).join("")
    : (s.images || []).map((im) => `<figure><div class="frame"><img src="${esc(im.src)}" alt="${esc(im.alt || s.name)}"/></div><figcaption>${esc(im.alt || "Screenshot")}</figcaption></figure>`).join("");
  const swatches = (s.swatches || []).map((sw) => `<button type="button" data-copy="${esc(sw.color)}" title="Copy ${esc(sw.color)}"><i style="background:${esc(sw.color)}"></i><span>${esc(sw.label)}<br/><small>${esc(sw.color)}</small></span></button>`).join("");
  const links = (s.links || []).map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label === "Download JSON" && s.jsonFile ? `Download JSON from ${s.source}` : l.label)}</a>`).join("");
  const dl = s.jsonFile ? `<a class="btn fill" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">Download JSON</a>` : "";
  const install = s.jsonFile
    ? `<h3>Install in T3 Code</h3>
       <ol>
         <li>Download <code>${esc(s.id)}.json</code>.</li>
         <li>In T3 Code open Settings → Appearance and press Add.</li>
         <li>Drop the file in. The skin applies at once.</li>
       </ol>
       <p class="cmd">Or, on the machine that runs the T3 server: <code>t3 theme set ${esc(s.id)}.json</code> <button class="btn" type="button" data-copy="t3 theme set ${esc(s.id)}.json">Copy command</button></p>
       <p>To undo, pick another theme in Appearance or run <code>t3 theme set t3-chat</code>.</p>`
    : `<h3>Install</h3><p>No public theme file was found for this skin, so there is nothing to download. Open the source post to see the original share.</p>`;
  dlg.innerHTML = `
    <div class="d-head">
      <div>
        <h2>${esc(s.name)}</h2>
        <p class="byline">${metaText(s)}</p>
      </div>
      <button class="btn close" type="button" data-close>Close</button>
    </div>
    <div class="d-previews">${previews}</div>
    <div class="d-body">
      <div class="col">
        ${traitsHTML(s)}
        ${s.description ? `<p>${esc(s.description)}</p>` : ""}
        ${swatches ? `<div><h3>Palette</h3><div class="swatches">${swatches}</div></div>` : ""}
        ${(s.tags || []).length ? `<div class="tags">${(s.tags || []).map((t) => `<button type="button" data-tag="${esc(t)}" data-close>${esc(t)}</button>`).join("")}</div>` : ""}
      </div>
      <div class="col">
        <div>${install}</div>
        <div><h3>Links</h3><div class="links">${dl}${links}</div></div>
        <p class="copied" id="copied" aria-live="polite"></p>
      </div>
    </div>`;
  dlg.showModal();
  dlg.scrollTop = 0;
  $(".close", dlg).focus();
}
function closeDetails() {
  const dlg = $("#details");
  if (dlg.open) dlg.close();
}

async function copyText(text, note) {
  try {
    await navigator.clipboard.writeText(text);
    note.textContent = `Copied ${text}`;
  } catch {
    note.textContent = `Copy failed. Select and copy: ${text}`;
  }
}

function readHash() {
  const h = new URLSearchParams(location.hash.replace(/^#/, ""));
  for (const k of Object.keys(DEFAULTS)) if (h.has(k)) state[k] = h.get(k);
  if (state.skin && !byId(state.skin)) state.skin = "";
}
function writeHash() {
  const h = new URLSearchParams();
  for (const k of Object.keys(DEFAULTS)) if (state[k] !== DEFAULTS[k] && state[k] !== "") h.set(k, state[k]);
  const next = h.toString() ? `#${h}` : "";
  if (next !== location.hash) history.replaceState(null, "", next || location.pathname + location.search);
}

function syncControls() {
  $("#search").value = state.q;
  $$("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(state[b.dataset.filter] === b.dataset.value)));
  $("#source").value = state.src;
  $("#tag").value = [...$("#tag").options].some((o) => o.value === state.tag) ? state.tag : "all";
  $("#sort").value = state.sort;
}

function uniqueTags() {
  const c = {};
  G.skins.forEach((s) => (s.tags || []).forEach((t) => { c[t] = (c[t] || 0) + 1; }));
  return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
function ensureTagOption(t) {
  const sel = $("#tag");
  if (![...sel.options].some((o) => o.value === t)) {
    const n = G.skins.filter((s) => (s.tags || []).includes(t)).length;
    const opt = new Option(`${t} (${n})`, t);
    sel.appendChild(opt);
  }
}

function boot() {
  readHash();
  const sel = $("#tag");
  const skip = new Set(["t3-code", "t3code", "t3-theme", "dark-theme", "light-theme"]);
  uniqueTags().filter(([t, n]) => n >= 2 && !skip.has(t)).forEach(([t, n]) => sel.appendChild(new Option(`${t} (${n})`, t)));
  if (state.tag !== "all") ensureTagOption(state.tag);
  $("#counts").textContent = `${G.counts.total} skins, ${G.counts.animated} animated, ${G.counts.withJson} with a theme file`;
  syncControls();

  $("#search").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); render(); writeHash(); });
  $$("[data-filter]").forEach((btn) => btn.addEventListener("click", () => {
    const key = btn.dataset.filter;
    state[key] = btn.dataset.value;
    $$(`[data-filter="${key}"]`).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    if (key === "prev" || key === "dual") {
      render();
      renderStage(state.skin);
    } else {
      render();
    }
    writeHash();
  }));
  $("#source").addEventListener("change", (e) => { state.src = e.target.value; render(); writeHash(); });
  $("#tag").addEventListener("change", (e) => { state.tag = e.target.value; render(); writeHash(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); writeHash(); });

  document.addEventListener("click", (e) => {
    const t = e.target;
    const modeBtn = t.closest("[data-mode]");
    if (modeBtn && modeBtn.closest(".preview")) { swapMode(modeBtn.closest(".preview").querySelector(".frame"), modeBtn.dataset.mode); return; }
    const tag = t.closest("[data-tag]");
    if (tag) {
      const v = tag.dataset.tag;
      state.tag = state.tag === v && !tag.hasAttribute("data-close") ? "all" : v;
      if (state.tag !== "all") ensureTagOption(state.tag);
      syncControls();
      render();
      writeHash();
      if (tag.hasAttribute("data-close")) closeDetails();
      return;
    }
    const stageBtn = t.closest("[data-stage]");
    if (stageBtn) { setStage(stageBtn.dataset.stage, { scroll: true }); return; }
    const step = t.closest("[data-step]");
    if (step) { stepStage(Number(step.dataset.step)); return; }
    const open = t.closest("[data-open]");
    if (open) { openDetails(open.dataset.open, open); return; }
    const copy = t.closest("[data-copy]");
    if (copy) { copyText(copy.dataset.copy, $("#copied")); return; }
    if (t.closest("[data-close]")) { closeDetails(); return; }
    if (t.closest("[data-reset]")) {
      ["q", "mode", "motion", "css", "src", "tag"].forEach((k) => { state[k] = DEFAULTS[k]; });
      syncControls();
      render();
      writeHash();
      $("#search").focus();
      return;
    }
    if (t.id === "details") closeDetails();
  });
  $("#details").addEventListener("close", () => { (opener && opener.isConnected ? opener : $("#search")).focus(); opener = null; });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !$("#details").open) {
      e.preventDefault();
      $("#search").focus();
    }
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && e.target.closest("#stage") && !e.target.closest("iframe")) {
      stepStage(e.key === "ArrowLeft" ? -1 : 1);
      $(`#stage [data-step="${e.key === "ArrowLeft" ? -1 : 1}"]`)?.focus();
    }
  });
  window.addEventListener("hashchange", () => { readHash(); syncControls(); render(); renderStage(state.skin); });

  render();
  if (!state.skin) {
    const first = filtered()[0];
    state.skin = first ? first.id : "";
  }
  setStage(state.skin);
}
boot();
