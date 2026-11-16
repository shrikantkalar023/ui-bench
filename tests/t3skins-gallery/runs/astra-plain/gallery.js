const G = window.GALLERY;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const icons = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  moon: '<path d="M20 13a8.5 8.5 0 0 1-9-9 8.5 8.5 0 1 0 9 9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  sliders: '<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  arrow: '<path d="M6 18 18 6M6 6h12v12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  motion: '<path d="m10 4 10 8-10 8ZM4 5v14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
const defaults = { q: '', appearance: 'all', motion: 'all', css: 'all', source: 'all', tag: 'all', sort: 'installs' };
const state = {...defaults};
const previewModes = new Map();
const selected = new Set();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionPlaying = !reducedMotion.matches;
let featuredId = 'nyx';
let dialogOrigin = null;
let toastTimer;
const modesOf = skin => skin.modes || [skin.appearance || 'dark'];
const skinById = id => G.skins.find(skin => skin.id === id);
const modeOf = skin => previewModes.get(skin.id) || (modesOf(skin).includes(state.appearance) ? state.appearance : modesOf(skin)[0]);
const dateOf = value => value ? new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'}).format(new Date(value)) : '';

function filtered() {
  const list = G.skins.filter(skin => {
    const searchable = [skin.name, skin.author, skin.description, ...(skin.tags || []), skin.source].join(' ').toLowerCase();
    if (!state.q.split(/\s+/).every(word => searchable.includes(word))) return false;
    const modes = modesOf(skin);
    if (state.appearance === 'dual' && !(modes.includes('dark') && modes.includes('light'))) return false;
    if (['dark', 'light'].includes(state.appearance) && !modes.includes(state.appearance)) return false;
    if (state.motion !== 'all' && skin.animated !== (state.motion === 'animated')) return false;
    if (state.css !== 'all' && Boolean(skin.hasCss) !== (state.css === 'css')) return false;
    if (state.source !== 'all' && skin.source !== state.source) return false;
    if (state.tag !== 'all' && !(skin.tags || []).includes(state.tag)) return false;
    return true;
  });
  return list.sort((a, b) => {
    if (state.sort === 'name') return a.name.localeCompare(b.name);
    if (state.sort === 'newest') return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    if (state.sort === 'animated') return Number(b.animated) - Number(a.animated) || a.name.localeCompare(b.name);
    return (b.installCount ?? -1) - (a.installCount ?? -1);
  });
}

function paletteDots(skin) {
  const colours = (skin.swatches || []).filter(swatch => !['border', 'text'].includes(swatch.label)).slice(0, 4);
  return `<span class="palette-dots" aria-hidden="true">${colours.map(swatch => `<i style="background:${escapeHTML(swatch.color)}"></i>`).join('')}</span>`;
}

function modeButtons(skin, mode) {
  if (modesOf(skin).length < 2) return '';
  return `<div class="mode-toggle" role="group" aria-label="${escapeHTML(skin.name)} preview appearance">${modesOf(skin).map(value => `<button type="button" data-mode="${value}" aria-pressed="${mode === value}">${icon(value === 'dark' ? 'moon' : 'sun')}${value === 'dark' ? 'Dark' : 'Light'}</button>`).join('')}</div>`;
}

function preview(skin, {featured = false, detail = false} = {}) {
  const mode = modeOf(skin);
  const path = skin.previews?.[mode];
  const image = skin.images?.[0];
  const media = path ? `<iframe title="${escapeHTML(skin.name)} — ${mode} preview" data-preview-path="${escapeHTML(path)}" tabindex="-1"></iframe>` : image ? `<img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt || skin.name)}" loading="lazy">` : '<p>Preview unavailable</p>';
  const badge = !featured && !detail ? `<span class="preview-badge${skin.animated ? '' : ' static'}">${icon(skin.animated ? 'motion' : modesOf(skin)[0] === 'light' ? 'sun' : 'moon')}${!skin.jsonFile ? 'Preview only' : skin.animated ? 'Animated' : modesOf(skin).length > 1 ? 'Dark + light' : mode === 'light' ? 'Light' : 'Dark'}</span>` : '';
  const overlay = !detail ? `<button type="button" class="preview-link" data-open="${escapeHTML(skin.id)}" aria-label="Preview ${escapeHTML(skin.name)}"><span class="open-hint">${icon('expand')} Explore skin</span></button>` : '';
  return `<div class="preview-stage ${featured ? 'featured-stage' : detail ? 'dialog-preview' : 'card-preview'}" data-preview-for="${escapeHTML(skin.id)}">${media}${overlay}${badge}${modeButtons(skin, mode)}</div>`;
}

function downloadLink(skin, className = 'button dark') {
  return skin.jsonFile ? `<a class="${className}" href="${escapeHTML(skin.jsonFile)}" download="${escapeHTML(skin.id)}.json" aria-label="Download ${escapeHTML(skin.name)} JSON">${icon('download')}${className === 'card-download' ? 'Get skin' : 'Download JSON'}</a>` : `<a class="${className}" href="${escapeHTML(skin.sourceUrl)}" target="_blank" rel="noopener">View source ${icon('arrow')}</a>`;
}

function card(skin) {
  return `<article class="skin-card${selected.has(skin.id) ? ' is-selected' : ''}" data-id="${escapeHTML(skin.id)}">
    ${preview(skin)}
    <div class="card-body">
      <div class="card-title-row"><h3><button class="title-button" data-open="${escapeHTML(skin.id)}">${escapeHTML(skin.name)}</button></h3>${paletteDots(skin)}</div>
      <p class="card-author">by <span>${escapeHTML(skin.author)}</span></p>
      <p class="card-description">${escapeHTML(skin.description || '')}</p>
      <div class="card-bottom"><a class="card-source" href="${escapeHTML(skin.sourceUrl)}" target="_blank" rel="noopener">${escapeHTML(skin.source)} ↗</a>${skin.installCount != null ? `<span class="card-installs" title="${skin.installCount} installs on t3skins.dev">${icon('download')}${skin.installCount}</span>` : ''}${downloadLink(skin, 'card-download')}<button class="compare-add" data-compare="${escapeHTML(skin.id)}" aria-label="Compare ${escapeHTML(skin.name)}" aria-pressed="${selected.has(skin.id)}" title="Compare ${escapeHTML(skin.name)}">${icon(selected.has(skin.id) ? 'check' : 'plus')}</button></div>
    </div>
  </article>`;
}

function frameDocument(path) {
  const base = new URL('previews/', document.baseURI).href;
  const pause = motionPlaying ? '' : '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}';
  const control = `<style>.shell{display:grid;grid-template-columns:150px minmax(0,1fr)}.shell>main{min-height:0}.shell>aside{height:100%}</style><style id="gallery-motion">${pause}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}</style>`;
  return window.SKIN_PREVIEWS[path].replace('<head>', `<head><base href="${escapeHTML(base)}">`).replace('</head>', `${control}</head>`);
}

function sizeFrame(frame) {
  const stage = frame.parentElement;
  if (stage.classList.contains('dialog-preview') && innerWidth > 580) return;
  const width = stage.classList.contains('featured-stage') ? 800 : stage.classList.contains('dialog-preview') ? 600 : 720;
  const scale = stage.clientWidth / width;
  frame.style.width = `${width}px`;
  frame.style.height = `${stage.clientHeight / scale}px`;
  frame.style.transform = `scale(${scale})`;
}

function mountFrame(frame) {
  if (frame.hasAttribute('srcdoc')) return;
  frame.srcdoc = frameDocument(frame.dataset.previewPath);
  frame.addEventListener('load', () => {
    frame.contentDocument?.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('#details-dialog').open) closeDialog();
    });
  });
  sizeFrame(frame);
}

const previewObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    mountFrame(entry.target);
    previewObserver.unobserve(entry.target);
  }
}), {rootMargin: '250px'});
const resizeObserver = new ResizeObserver(entries => entries.forEach(entry => {
  const frame = $('iframe', entry.target);
  if (frame) {
    if (entry.target.classList.contains('dialog-preview') && innerWidth > 580) {
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.transform = 'none';
    } else sizeFrame(frame);
  }
}));

function connectPreviews(root, immediate = false) {
  $$('.preview-stage', root).forEach(stage => resizeObserver.observe(stage));
  $$('iframe[data-preview-path]', root).forEach(frame => immediate ? mountFrame(frame) : previewObserver.observe(frame));
}

function disconnectPreviews(root) {
  $$('.preview-stage', root).forEach(stage => resizeObserver.unobserve(stage));
  $$('iframe', root).forEach(frame => previewObserver.unobserve(frame));
}

function render() {
  const list = filtered();
  disconnectPreviews($('#grid'));
  $('#grid').innerHTML = list.length ? list.map(card).join('') : `<div class="empty-state">${icon('search')}<h3>No skins found</h3><p>Try another search or give your filters a fresh start.</p><button class="button dark" data-reset>Clear all filters</button></div>`;
  $('#status').textContent = `Showing ${list.length} of ${G.skins.length} skins`;
  $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(state[button.dataset.filter] === button.dataset.value)));
  const count = ['motion', 'css', 'source', 'tag'].filter(key => state[key] !== defaults[key]).length;
  $('#filter-count').hidden = count === 0;
  $('#filter-count').textContent = count;
  $('.reset-button').hidden = !Object.keys(defaults).some(key => key !== 'sort' && state[key] !== defaults[key]);
  connectPreviews($('#grid'));
}

function resetFilters() {
  Object.assign(state, {...defaults, sort: state.sort});
  $('#search').value = '';
  $('#source').value = 'all';
  $('#tag').value = 'all';
  render();
}

function renderFeatured() {
  const skin = skinById(featuredId);
  disconnectPreviews($('#featured'));
  $('#featured').innerHTML = `<div class="window-chrome"><i class="window-dot"></i><i class="window-dot"></i><i class="window-dot"></i><span class="window-title">T3 Code · your space to create</span></div>${preview(skin, {featured: true})}<div class="featured-caption"><strong>${escapeHTML(skin.name)}</strong><small>by ${escapeHTML(skin.author)}</small>${paletteDots(skin)}<button type="button" data-open="${escapeHTML(skin.id)}" aria-label="Explore ${escapeHTML(skin.name)}">↗</button></div>`;
  $('#featured-choices').innerHTML = ['nyx', 'nebula', 'paper-lantern'].map(id => {
    const item = skinById(id);
    const colour = item.swatches.find(swatch => swatch.label === 'accent')?.color || '#888';
    return `<button class="mood-choice" type="button" data-featured="${id}" aria-label="Feature ${escapeHTML(item.name)}" aria-pressed="${id === featuredId}" title="${escapeHTML(item.name)}"><span style="background:${escapeHTML(colour)}"></span></button>`;
  }).join('');
  connectPreviews($('#featured'), true);
}

function swatches(skin) {
  return `<div class="swatches">${(skin.swatches || []).map(swatch => `<span class="swatch"><i style="background:${escapeHTML(swatch.color)}"></i><span>${escapeHTML(swatch.label)}<br><code>${escapeHTML(swatch.color)}</code></span></span>`).join('')}</div>`;
}

function details(skin) {
  const tags = [...(skin.tags || []), ...(skin.hasCss ? ['custom CSS'] : []), ...modesOf(skin)];
  const links = [...(skin.links || [])];
  if (skin.sourceUrl && !links.some(link => link.url === skin.sourceUrl)) links.unshift({url: skin.sourceUrl, label: 'Original source'});
  const install = skin.jsonFile ? `<h3>Make it your workspace</h3><p>Open <strong>Settings → Appearance → Add</strong> in T3 Code, then drop in the downloaded JSON file.</p><code>t3 theme set ${escapeHTML(skin.id)}.json</code>${downloadLink(skin)}` : `<h3>A look at what’s possible</h3><p>No public theme file was found for this skin. Visit the original source for more information.</p>${downloadLink(skin)}`;
  const extraImages = (skin.images || []).slice(1).map(image => `<img loading="lazy" src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt || skin.name)}">`).join('');
  return `${preview(skin, {detail: true})}<div class="dialog-body"><div class="detail-overview"><div><p class="detail-description">${escapeHTML(skin.description || '')}</p><div class="detail-tags">${[...new Set(tags)].map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div>${swatches(skin)}<p class="detail-meta">${escapeHTML(skin.source)}${skin.createdAt ? ` · ${dateOf(skin.createdAt)}` : ''}${skin.installCount != null ? ` · ${skin.installCount} installs` : ''}</p></div><div class="detail-install">${install}</div></div><div class="detail-links"><span>Explore the original</span>${links.map(link => `<a class="button" href="${escapeHTML(link.url)}" target="_blank" rel="noopener">${escapeHTML(link.label)} ↗</a>`).join('')}</div>${extraImages ? `<div class="detail-image-list">${extraImages}</div>` : ''}</div>`;
}

function openDialog(title, subtitle, body) {
  const dialog = $('#details-dialog');
  if (!dialog.open) dialogOrigin = document.activeElement;
  disconnectPreviews(dialog);
  $('#dialog-content').innerHTML = `<div class="dialog-header"><div><h2 id="dialog-title">${escapeHTML(title)}</h2><p>${escapeHTML(subtitle)}</p></div><button type="button" class="close-button" data-close aria-label="Close preview">${icon('close')}</button></div>${body}`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  connectPreviews(dialog, true);
  $('[data-close]', dialog).focus();
}

function openDetails(id) {
  const skin = skinById(id);
  if (!skin) return;
  openDialog(skin.name, `by ${skin.author} · ${skin.jsonFile ? 'Live workspace preview' : 'Community screenshot'}`, details(skin));
}

function closeDialog() {
  const dialog = $('#details-dialog');
  disconnectPreviews(dialog);
  dialog.close();
}

function updateMode(button) {
  const stage = button.closest('[data-preview-for]');
  const skin = skinById(stage.dataset.previewFor);
  const mode = button.dataset.mode;
  previewModes.set(skin.id, mode);
  $$('.preview-stage').filter(item => item.dataset.previewFor === skin.id).forEach(item => {
    $$('[data-mode]', item).forEach(control => control.setAttribute('aria-pressed', String(control.dataset.mode === mode)));
    const frame = $('iframe', item);
    if (frame && skin.previews?.[mode]) {
      frame.dataset.previewPath = skin.previews[mode];
      frame.title = `${skin.name} — ${mode} preview`;
      frame.srcdoc = frameDocument(skin.previews[mode]);
    }
  });
}

function showToast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}

function updateCompare() {
  $('#compare-tray').hidden = selected.size === 0;
  $('#open-compare').disabled = selected.size !== 2;
  $('#open-compare').textContent = selected.size === 1 ? 'Choose one more' : 'Compare 2 skins ↗';
  $('#compare-selection').innerHTML = [...selected].map(id => {
    const skin = skinById(id);
    const colour = skin.swatches?.find(swatch => swatch.label === 'accent')?.color || '#bca4b3';
    return `<span class="selected-skin"><i style="background:${escapeHTML(colour)}"></i>${escapeHTML(skin.name)}<button data-compare="${id}" aria-label="Remove ${escapeHTML(skin.name)} from comparison">×</button></span>`;
  }).join('');
  $$('.skin-card').forEach(item => {
    const isSelected = selected.has(item.dataset.id);
    item.classList.toggle('is-selected', isSelected);
    const button = $('[data-compare]', item);
    button.setAttribute('aria-pressed', String(isSelected));
    button.innerHTML = icon(isSelected ? 'check' : 'plus');
  });
}

function toggleCompare(id) {
  if (selected.has(id)) selected.delete(id);
  else if (selected.size < 2) selected.add(id);
  else { showToast('Remove a selected skin to compare another.'); return; }
  updateCompare();
}

function openComparison() {
  if (selected.size !== 2) return;
  openDialog('Find your favourite', 'Two skins. One workspace. Take a closer look.', `<div class="comparison">${[...selected].map(id => {
    const skin = skinById(id);
    return `<article>${preview(skin)}<h3>${escapeHTML(skin.name)}</h3><p class="card-author">by ${escapeHTML(skin.author)}</p><p class="detail-description">${escapeHTML(skin.description || '')}</p>${swatches(skin)}${downloadLink(skin)}</article>`;
  }).join('')}</div>`);
}

function updateMotion() {
  $('#motion-control').disabled = reducedMotion.matches;
  $('#motion-control').title = reducedMotion.matches ? 'Animations are off to match your device settings' : '';
  $('#motion-control').setAttribute('aria-pressed', String(motionPlaying));
  $('#motion-control').innerHTML = `<span class="motion-indicator"></span>${icon(motionPlaying ? 'pause' : 'play')}${reducedMotion.matches ? 'Motion reduced' : motionPlaying ? 'Pause previews' : 'Play previews'}`;
  $$('iframe[srcdoc]').forEach(frame => {
    const style = frame.contentDocument?.getElementById('gallery-motion');
    if (style) style.textContent = `${motionPlaying ? '' : '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}'}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}`;
  });
}

$$('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
$('#total-count').textContent = G.skins.length;
$('#hero-stats').innerHTML = `<strong>${G.skins.length} skins.</strong> Endless personality.<br>${G.skins.filter(skin => skin.jsonFile).length} ready to make your own.`;
const tags = new Map();
G.skins.forEach(skin => (skin.tags || []).forEach(tag => tags.set(tag, (tags.get(tag) || 0) + 1)));
[...tags].sort((a, b) => a[0].localeCompare(b[0])).forEach(([tag, count]) => {
  const option = document.createElement('option');
  option.value = tag;
  option.textContent = `${tag} (${count})`;
  $('#tag').appendChild(option);
});
$('#search').addEventListener('input', event => { state.q = event.target.value.trim().toLowerCase(); render(); });
['source', 'tag', 'sort'].forEach(id => $(`#${id}`).addEventListener('change', event => { state[id] = event.target.value; render(); }));
$('#filter-toggle').addEventListener('click', () => {
  const expanded = $('#filter-toggle').getAttribute('aria-expanded') === 'true';
  $('#filter-toggle').setAttribute('aria-expanded', String(!expanded));
  $('#advanced-filters').hidden = expanded;
});
$('#motion-control').addEventListener('click', () => { motionPlaying = !motionPlaying; updateMotion(); });
reducedMotion.addEventListener('change', event => { motionPlaying = !event.matches; updateMotion(); });
$('#clear-compare').addEventListener('click', () => { selected.clear(); updateCompare(); });
$('#open-compare').addEventListener('click', openComparison);
document.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.hasAttribute('data-filter')) { state[target.dataset.filter] = target.dataset.value; render(); }
  if (target.hasAttribute('data-reset')) resetFilters();
  if (target.hasAttribute('data-featured')) {
    featuredId = target.dataset.featured;
    renderFeatured();
    $(`[data-featured="${featuredId}"]`).focus({preventScroll: true});
  }
  if (target.hasAttribute('data-mode')) updateMode(target);
  if (target.hasAttribute('data-compare')) toggleCompare(target.dataset.compare);
  if (target.hasAttribute('data-open')) {
    openDetails(target.dataset.open);
  }
  if (target.hasAttribute('data-close')) closeDialog();
});
$('#details-dialog').addEventListener('click', event => {
  if (event.target !== $('#details-dialog')) return;
  const box = event.target.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
});
$('#details-dialog').addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
$('#details-dialog').addEventListener('close', () => {
  disconnectPreviews($('#details-dialog'));
  $('#dialog-content').innerHTML = '';
  if (dialogOrigin?.isConnected) dialogOrigin.focus({preventScroll: true});
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !$('#details-dialog').open && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    $('#search').focus();
  }
});
renderFeatured();
render();
updateMotion();
