const { models: MODELS, tests: TESTS } = window.BENCH;
const ORIGINAL = { id: "original", name: "Original" };
const $ = (id) => document.getElementById(id);

const state = readHash();

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  const test = TESTS.find((t) => t.id === p.get("test")) ?? TESTS[0];
  const model = [ORIGINAL.id, ...test.models].includes(p.get("model")) ? p.get("model") : test.models[0];
  return {
    test,
    model,
    skill: p.get("skill") !== "off",
    compare: p.get("compare") === "1",
    mobile: p.get("mobile") === "1",
  };
}

function writeHash() {
  const p = new URLSearchParams({ test: state.test.id, model: state.model, skill: state.skill ? "on" : "off" });
  if (state.compare) p.set("compare", "1");
  if (state.mobile) p.set("mobile", "1");
  history.replaceState(null, "", `#${p}`);
}

const modelById = (id) => (id === ORIGINAL.id ? ORIGINAL : MODELS.find((m) => m.id === id));
const isOriginal = () => state.model === ORIGINAL.id;

function pageUrl(modelId, skill) {
  const { dir } = state.test;
  return modelId === ORIGINAL.id
    ? `${dir}/original/index.html`
    : `${dir}/runs/${modelId}-${skill ? "skill" : "plain"}/index.html`;
}

function panes() {
  if (isOriginal()) return [{ url: pageUrl(ORIGINAL.id), label: null }];
  if (!state.compare) return [{ url: pageUrl(state.model, state.skill), label: null }];
  return [false, true].map((skill) => ({ url: pageUrl(state.model, skill), label: { skill } }));
}

function paneEl({ url, label }) {
  const model = modelById(state.model);
  const pane = document.createElement("section");
  pane.className = "pane";
  if (label) {
    const head = document.createElement("div");
    head.className = "pane-label";
    head.innerHTML = `<span class="dot${label.skill ? " on" : ""}"></span>Skill ${label.skill ? "on" : "off"}<small></small>`;
    head.querySelector("small").textContent = model.name;
    pane.append(head);
  }
  const frame = document.createElement("iframe");
  frame.className = "frame";
  frame.src = url;
  frame.title = `${model.name}${isOriginal() ? "" : `, design skill ${label ? (label.skill ? "on" : "off") : state.skill ? "on" : "off"}`}`;
  pane.append(frame);
  return pane;
}

function renderModels() {
  const ids = [ORIGINAL.id, ...state.test.models];
  $("models").replaceChildren(
    ...ids.map((id, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `model${id === ORIGINAL.id ? " original" : ""}`;
      b.setAttribute("role", "radio");
      b.dataset.id = id;
      b.innerHTML = `<span></span><span class="key" aria-hidden="true">${i}</span>`;
      b.firstChild.textContent = modelById(id).name;
      return b;
    }),
  );
}

function render() {
  for (const b of $("models").children) {
    const on = b.dataset.id === state.model;
    b.setAttribute("aria-checked", on);
    b.tabIndex = on ? 0 : -1;
    if (on) b.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  const original = isOriginal();
  const comparing = state.compare && !original;
  const skillOn = state.skill && !original && !comparing;
  $("skill").disabled = original || comparing;
  $("skill").setAttribute("aria-checked", skillOn);
  $("skill-state").textContent = comparing ? "both" : skillOn ? "on" : "off";
  $("compare").disabled = original;
  $("compare").setAttribute("aria-pressed", comparing);
  $("mobile").setAttribute("aria-pressed", state.mobile);

  const list = panes();
  $("newtab").href = list.at(-1).url;
  const stage = $("stage");
  stage.dataset.vp = state.mobile ? "mobile" : "full";
  const want = list.map((p) => p.url).join("|");
  if (stage.dataset.urls !== want) {
    stage.dataset.urls = want;
    stage.replaceChildren(...list.map(paneEl));
  }

  const model = modelById(state.model);
  document.title = `${model.name}${original ? "" : state.compare ? ", skill off vs on" : `, skill ${state.skill ? "on" : "off"}`}: ${state.test.title} | ui-bench`;
  writeHash();
}

function set(patch) {
  Object.assign(state, patch);
  render();
}

function selectModelByOffset(delta) {
  const ids = [ORIGINAL.id, ...state.test.models];
  const next = ids[(ids.indexOf(state.model) + delta + ids.length) % ids.length];
  set({ model: next });
  $("models").querySelector(`[data-id="${next}"]`).focus();
}

async function openBrief() {
  const dlg = $("brief");
  $("brief-summary").textContent = state.test.summary;
  $("brief-models").replaceChildren(
    ...state.test.models.flatMap((id) => {
      const m = modelById(id);
      const dt = document.createElement("dt");
      dt.textContent = m.name;
      const dd = document.createElement("dd");
      dd.textContent = `${m.vendor}, ${m.target}`;
      return [dt, dd];
    }),
  );
  dlg.showModal();
  const promptUrl = `${state.test.dir}/prompt.md`;
  try {
    const res = await fetch(promptUrl);
    if (!res.ok) throw new Error(res.statusText);
    $("brief-prompt").textContent = await res.text();
  } catch {
    $("brief-prompt").innerHTML = `The prompt could not load here. <a href="${promptUrl}" target="_blank" rel="noopener">Open prompt.md</a>.`;
  }
}

function boot() {
  $("test").replaceChildren(
    ...TESTS.map((t) => Object.assign(document.createElement("option"), { value: t.id, textContent: t.title })),
  );
  $("test").value = state.test.id;
  $("test").addEventListener("change", (e) => {
    const test = TESTS.find((t) => t.id === e.target.value);
    state.test = test;
    renderModels();
    set({ model: test.models.includes(state.model) ? state.model : test.models[0] });
  });

  renderModels();
  $("models").addEventListener("click", (e) => {
    const b = e.target.closest("[data-id]");
    if (b) set({ model: b.dataset.id });
  });
  $("models").addEventListener("keydown", (e) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (delta) {
      e.preventDefault();
      selectModelByOffset(delta);
    }
  });

  $("skill").addEventListener("click", () => set({ skill: !state.skill }));
  $("compare").addEventListener("click", () => set({ compare: !state.compare }));
  $("mobile").addEventListener("click", () => set({ mobile: !state.mobile }));
  $("brief-open").addEventListener("click", openBrief);

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || $("brief").open) return;
    if (e.target.closest("input, select, textarea")) return;
    const ids = [ORIGINAL.id, ...state.test.models];
    if (/^\d$/.test(e.key) && Number(e.key) < ids.length) return set({ model: ids[Number(e.key)] });
    const k = e.key.toLowerCase();
    if (k === "s" && !isOriginal() && !state.compare) set({ skill: !state.skill });
    else if (k === "c" && !isOriginal()) set({ compare: !state.compare });
    else if (k === "m") set({ mobile: !state.mobile });
  });

  window.addEventListener("hashchange", () => {
    Object.assign(state, readHash());
    $("test").value = state.test.id;
    renderModels();
    render();
  });

  render();
}

boot();
