'use strict';
const G = window.GALLERY;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  moon: '<path d="M20.5 13.5A8.5 8.5 0 0 1 10.5 3 8.5 8.5 0 1 0 20.5 13.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  dual: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/>',
  spark: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 5H4v15h15v-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  sliders: '<path d="M4 7h3m4 0h9M4 17h9m4 0h3"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>',
  play: '<path d="m8 4 12 8-12 8z"/>'
};
const icon = name => `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24">${paths[name] || paths.spark}</svg></span>`;
$$('[data-icon]').forEach(el => el.outerHTML = icon(el.dataset.icon));
const modesOf = s => s.modes || [s.appearance || 'dark'];
const isDual = s => modesOf(s).includes('dark') && modesOf(s).includes('light');
const skinById = id => G.skins.find(s => s.id === id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = {q:'',appearance:'all',motion:'all',css:'all',source:'all',tag:'all',sort:'installs',library:'all'};
const selectedModes = new Map();
let saved = new Set();
try { const stored = JSON.parse(localStorage.getItem('t3-skins-saved') || '[]'); if (Array.isArray(stored)) saved = new Set(stored.filter(id => skinById(id))); } catch {}
let featuredId = 'nyx';
let toastTimer;
let lastDialogTrigger;
const filterLabels = {
  appearance: {all:'All appearances',dark:'Dark',light:'Light',dual:'Dark + light'},
  motion: {all:'Any',animated:'Animated',static:'Static'},
  css: {all:'All styles',css:'Custom CSS',palette:'Palette only'}
};
const appearanceIcons = {all:'grid',dark:'moon',light:'sun',dual:'dual'};
const appearanceCounts = {all:G.skins.length,dark:G.skins.filter(s => modesOf(s).includes('dark')).length,light:G.skins.filter(s => modesOf(s).includes('light')).length,dual:G.skins.filter(isDual).length};
for (const key of ['appearance','motion','css']) {
  $(`#${key}-options`).innerHTML = Object.entries(filterLabels[key]).map(([value,label]) => `<button data-filter="${key}" data-value="${value}" aria-pressed="${value === 'all'}">${key === 'appearance' ? icon(appearanceIcons[value]) : ''}${label}${key === 'appearance' ? `<span class="count">${appearanceCounts[value]}</span>` : ''}</button>`).join('');
}
const tagCounts = new Map();
G.skins.forEach(s => (s.tags || []).forEach(t => tagCounts.set(t,(tagCounts.get(t) || 0) + 1)));
[...tagCounts].sort(([a],[b]) => a.localeCompare(b)).forEach(([t,n]) => { const option = new Option(`${t} (${n})`,t); $('#tag').append(option); });
function filtered() {
  const terms = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return G.skins.filter(s => {
    const text = [s.name,s.author,s.description,s.source,...(s.tags || [])].join(' ').toLowerCase();
    return terms.every(t => text.includes(t)) &&
      (state.library !== 'saved' || saved.has(s.id)) &&
      (state.appearance === 'all' || (state.appearance === 'dual' ? isDual(s) : modesOf(s).includes(state.appearance))) &&
      (state.motion === 'all' || (state.motion === 'animated' ? s.animated : !s.animated)) &&
      (state.css === 'all' || (state.css === 'css' ? s.hasCss : !s.hasCss)) &&
      (state.source === 'all' || state.source === s.source) &&
      (state.tag === 'all' || (s.tags || []).includes(state.tag));
  }).sort((a,b) => {
    if (state.sort === 'installs') return (b.installCount ?? -1) - (a.installCount ?? -1);
    if (state.sort === 'newest') return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    if (state.sort === 'animated') return Number(!!b.animated) - Number(!!a.animated) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}
function currentMode(s) { return selectedModes.get(s.id) || modesOf(s)[0]; }
function palette(s) { return (s.swatches || []).slice(0,5).map(sw => `<i style="--swatch:${esc(sw.color)}" title="${esc(sw.label)}: ${esc(sw.color)}"></i>`).join(''); }
function preview(s, mode, eager = false, playMotion = false) {
  if (s.previews?.[mode]) {
    if (s.animated && reducedMotion.matches && !playMotion) return `<div class="motion-paused" style="background:${esc(s.palettes?.[mode]?.canvas || '#241f30')}">${icon('play')}<span>Preview paused for reduced motion</span><button data-play="${esc(s.id)}">Show preview</button></div>`;
    return `<iframe class="preview-frame" title="${esc(s.name)} ${mode} preview" srcdoc="${esc(window.PREVIEW_DOCUMENTS[s.previews[mode]].replace('<head>','<head><base href="' + esc(new URL('previews/',location.href).href) + '">'))}" loading="${eager ? 'eager' : 'lazy'}" tabindex="-1" inert></iframe>`;
  }
  if (s.images?.length) return `<img class="preview-image" src="${esc(s.images[0].src)}" alt="${esc(s.images[0].alt || s.name)}" loading="lazy">`;
  return '<div class="preview-unavailable">No preview available</div>';
}
function modeToggle(s) {
  const modes = modesOf(s), mode = currentMode(s);
  if (modes.length < 2) return `<span class="single-mode">${icon(mode === 'light' ? 'sun' : 'moon')}${mode === 'light' ? 'Light' : 'Dark'}</span>`;
  return `<div class="mode-toggle" role="group" aria-label="${esc(s.name)} preview appearance">${modes.map(m => `<button data-mode="${m}" data-skin="${esc(s.id)}" aria-pressed="${m === mode}" aria-label="Preview ${esc(s.name)} in ${m} mode">${icon(m === 'light' ? 'sun' : 'moon')}${m === 'light' ? 'Light' : 'Dark'}</button>`).join('')}</div>`;
}
function saveButton(s, inCard = true) {
  return `<button class="${inCard ? 'save-button' : 'icon-button'}" data-save="${esc(s.id)}" aria-pressed="${saved.has(s.id)}" aria-label="${saved.has(s.id) ? 'Unsave' : 'Save'} ${esc(s.name)}" title="${saved.has(s.id) ? 'Unsave' : 'Save'} skin">${icon('bookmark')}</button>`;
}
function card(s) {
  return `<article class="card" data-id="${esc(s.id)}"><div class="preview-wrap" data-preview-for="${esc(s.id)}">${preview(s,currentMode(s))}<button class="preview-open" data-open="${esc(s.id)}" aria-label="Preview ${esc(s.name)}"><span class="preview-hover">Explore skin ↗</span></button>${s.animated ? `<span class="preview-label">${icon('spark')}Animated</span>` : !s.jsonFile ? '<span class="preview-label">Preview only</span>' : ''}${saveButton(s)}</div><div class="card-meta"><div class="title-row"><h3><button data-open="${esc(s.id)}">${esc(s.name)}</button></h3><div class="palette" aria-label="${esc(s.name)} colors">${palette(s)}</div></div><p class="author" title="${esc(s.author)}">by ${esc(s.author)}</p><div class="card-toolbar">${modeToggle(s)}<div class="card-actions">${s.sourceUrl ? `<a class="icon-button" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener" aria-label="${esc(s.name)} source" title="View source">${icon('external')}</a>` : ''}${s.jsonFile ? `<a class="icon-button" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json" aria-label="Download ${esc(s.name)} JSON" title="Download JSON">${icon('download')}</a>` : ''}<button class="preview-link" data-open="${esc(s.id)}">Preview</button></div></div></div></article>`;
}
function render() {
  const list = filtered();
  const active = ['appearance','motion','css','source','tag'].filter(k => state[k] !== 'all');
  $('#grid').innerHTML = list.map(card).join('') || `<div class="empty"><h3>${state.library === 'saved' && !saved.size ? 'Keep a few favorites.' : 'No skins found.'}</h3><p>${state.library === 'saved' && !saved.size ? 'Select the bookmark on any skin to save it here.' : 'Try a different search or clear your filters.'}</p><button class="solid-button" ${state.library === 'saved' && !saved.size ? 'data-library="all"' : 'data-reset'}>${state.library === 'saved' && !saved.size ? 'Explore all skins' : 'Clear filters'}</button></div>`;
  $('#status').innerHTML = `Showing <strong>${list.length}</strong>${state.library === 'saved' ? ' saved skins' : ` of ${G.skins.length} skins`}`;
  $('#active-filters').innerHTML = active.map(k => `<button data-clear="${k}" aria-label="Remove ${esc(filterLabels[k]?.[state[k]] || state[k])} filter">${esc(filterLabels[k]?.[state[k]] || state[k])}<span aria-hidden="true">×</span></button>`).join('');
  $('#filter-indicator').textContent = active.length || '';
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed',state[b.dataset.filter] === b.dataset.value));
  $$('.library-tabs [data-library]').forEach(b => b.setAttribute('aria-pressed',state.library === b.dataset.library));
  $('#saved-count').textContent = saved.size;
  $$('[data-reset].reset-button').forEach(b => b.hidden = !active.length && !state.q);
  for (const key of ['source','tag','sort']) $(`#${key}`).value = state[key];
  observePreviews();
}
function showFeatured(id) {
  featuredId = id;
  const s = skinById(id);
  $('#featured-preview').dataset.previewFor = id;
  $('#featured-preview').innerHTML = preview(s,currentMode(s),true) + `<button class="preview-open" data-open="${esc(id)}" aria-label="Explore ${esc(s.name)}"><span class="preview-hover">Explore ${esc(s.name)} ↗</span></button>`;
  $('#featured-credit').innerHTML = `<strong>${esc(s.name)}</strong> by ${esc(s.author)}`;
  $('#featured-palette').innerHTML = palette(s);
  $('#featured-open').dataset.open = id;
  $$('[data-feature]').forEach(b => b.setAttribute('aria-pressed',b.dataset.feature === id));
}
function date(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(d);
}
function openDetails(id, trigger) {
  const s = skinById(id);
  if (!s) return;
  lastDialogTrigger = trigger || document.activeElement;
  const links = [...(s.links || [])];
  if (s.sourceUrl && !links.some(l => l.url === s.sourceUrl)) links.unshift({url:s.sourceUrl,label:'Original source'});
  const modal = $('#details');
  modal.innerHTML = `<div class="dialog-top"><div><h2 id="dialog-title">${esc(s.name)}</h2><p class="author">by ${esc(s.author)}</p></div><div class="dialog-top-controls">${modeToggle(s)}${saveButton(s,false)}<button class="icon-button" data-close="details" aria-label="Close preview" autofocus>${icon('close')}</button></div></div><div class="modal-preview" data-preview-for="${esc(s.id)}">${preview(s,currentMode(s),true)}</div><div class="dialog-body"><div><p class="dialog-description">${esc(s.description || '')}</p><div class="detail-facts">${s.animated ? `<span>${icon('spark')}Animated</span>` : '<span>Static</span>'}<span>${s.hasCss ? 'Custom CSS' : 'Palette only'}</span>${s.createdAt ? `<span>${date(s.createdAt)}</span>` : ''}${s.installCount != null ? `<span>${icon('download')}${s.installCount} installs on t3skins.dev</span>` : ''}<span>${esc(s.source)}</span></div><div class="tags">${(s.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div><div class="swatches">${(s.swatches || []).map(sw => `<span class="swatch"><i style="--swatch:${esc(sw.color)}"></i>${esc(sw.label)} ${esc(sw.color)}</span>`).join('')}</div><div class="detail-links">${links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${icon('external')}</a>`).join('')}</div></div><div class="detail-install"><h3>${s.jsonFile ? 'Make it your workspace' : 'A look from the community'}</h3><p>${s.jsonFile ? 'Download the JSON. In T3 Code, open <strong>Settings → Appearance</strong>, press <strong>Add</strong>, and drop in the file.' : 'No public theme file was found for this skin. See the original post for more details.'}</p>${s.jsonFile ? `<a class="solid-button" href="${esc(s.jsonFile)}" download="${esc(s.id)}.json">${icon('download')}Download JSON</a><p>Or, on the server:<br><code>t3 theme set ${esc(s.id)}.json</code></p>` : `<a class="solid-button" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">View original post ${icon('external')}</a>`}</div></div>`;
  modal.showModal();
  modal.scrollTop = 0;
}
function showToast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => $('#toast').hidden = true,2400);
}
function toggleSave(id) {
  const s = skinById(id);
  if (saved.has(id)) saved.delete(id); else saved.add(id);
  let persisted = true;
  try { localStorage.setItem('t3-skins-saved',JSON.stringify([...saved])); } catch { persisted = false; }
  $$(`[data-save="${id}"]`).forEach(b => {
    b.setAttribute('aria-pressed',saved.has(id));
    b.setAttribute('aria-label',`${saved.has(id) ? 'Unsave' : 'Save'} ${s.name}`);
    b.title = saved.has(id) ? 'Unsave skin' : 'Save skin';
  });
  $('#saved-count').textContent = saved.size;
  if (state.library === 'saved') {
    const focusedCard = document.activeElement.closest('.card');
    render();
    if (focusedCard) ($('[data-save]', $('#grid')) || $('.library-tabs [data-library="saved"]')).focus();
  }
  showToast(saved.has(id) ? `${s.name} saved${persisted ? '' : ' for this session'}` : `${s.name} removed from saved skins`);
}
function resetFilters() {
  Object.assign(state,{q:'',appearance:'all',motion:'all',css:'all',source:'all',tag:'all'});
  $('#search').value = '';
  render();
}
let observer;
function observePreviews() {
  observer?.disconnect();
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const frame = entry.target;
      try {
        const doc = frame.contentDocument;
        if (!doc) continue;
        let style = doc.getElementById('gallery-motion-control');
        if (!style) { style = doc.createElement('style'); style.id = 'gallery-motion-control'; doc.head.append(style); }
        style.textContent = entry.isIntersecting ? '' : '*,:before,:after{animation-play-state:paused!important}';
      } catch {}
    }
  },{rootMargin:'200px'});
  $$('#grid iframe').forEach(frame => observer.observe(frame));
}
$('#search').addEventListener('input',e => {state.q = e.target.value;render();});
for (const key of ['source','tag','sort']) $(`#${key}`).addEventListener('change',e => {state[key] = e.target.value;render();});
document.addEventListener('click',e => {
  const button = e.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-feature')) showFeatured(button.dataset.feature);
  else if (button.hasAttribute('data-open')) openDetails(button.dataset.open,button);
  else if (button.hasAttribute('data-save')) toggleSave(button.dataset.save);
  else if (button.hasAttribute('data-mode')) {
    const s = skinById(button.dataset.skin);
    selectedModes.set(s.id,button.dataset.mode);
    $$(`[data-mode][data-skin="${s.id}"]`).forEach(b => b.setAttribute('aria-pressed',b.dataset.mode === button.dataset.mode));
    $$(`[data-preview-for="${s.id}"]`).forEach(wrap => {
      const old = wrap.querySelector('iframe,img,.motion-paused');
      if (old) { const template = document.createElement('template'); template.innerHTML = preview(s,button.dataset.mode,true); old.replaceWith(template.content); }
    });
    observePreviews();
  } else if (button.hasAttribute('data-filter')) {state[button.dataset.filter] = button.dataset.value;render();}
  else if (button.hasAttribute('data-clear')) {state[button.dataset.clear] = 'all';render();$('#search').focus();}
  else if (button.hasAttribute('data-reset')) {resetFilters();$('#search').focus();}
  else if (button.hasAttribute('data-library')) {state.library = button.dataset.library;render();}
  else if (button.hasAttribute('data-install')) {lastDialogTrigger = button;$('#install').showModal();}
  else if (button.hasAttribute('data-close')) $(`#${button.dataset.close}`).close();
  else if (button.matches('.mobile-filters')) {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded',open);
    $('#filter-panel').classList.toggle('is-open',open);
  } else if (button.hasAttribute('data-play')) {
    const s = skinById(button.dataset.play);
    const wrap = button.closest('[data-preview-for]');
    const template = document.createElement('template');
    template.innerHTML = preview(s,currentMode(s),true,true);
    $('.motion-paused',wrap).replaceWith(template.content);
  }
});
$$('dialog').forEach(dialog => {
  dialog.addEventListener('click',e => {
    if (e.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close',() => {
    if (dialog.id === 'details') dialog.innerHTML = '';
    if (lastDialogTrigger?.isConnected) lastDialogTrigger.focus();
  });
});
document.addEventListener('keydown',e => {
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.matches('input,textarea,select,[contenteditable]') && !document.querySelector('dialog[open]')) {e.preventDefault();$('#search').focus();}
});
$('a[href="#sources"]').addEventListener('click',() => $('.source-details').open = true);
reducedMotion.addEventListener('change',() => {render();showFeatured(featuredId);$('#details').close();});
$('#footer-counts').textContent = `${G.counts.total} skins / ${G.counts.animated} animated / ${G.counts.withJson} downloads`;
render();
showFeatured(featuredId);
document.addEventListener('click',event => {
  const link = event.target.closest('a[download]');
  if (!link || link.href.startsWith('blob:')) return;
  const contents = window.SKIN_FILES[link.getAttribute('href')];
  if (!contents) return;
  event.preventDefault();
  const url = URL.createObjectURL(new Blob([contents],{type:'application/json'}));
  const download = document.createElement('a');
  download.href = url;
  download.download = link.download;
  download.hidden = true;
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
