const G = window.GALLERY;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const state = {q:'', appearance:'all', motion:'all', css:'all', source:'all', tag:'all', sort:'installs', mode:'dark'};
const selected = new Set();
const previewModes = new Map();
const modal = $('#modal');
let returnFocus;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionEnabled = new Set();
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modesOf = skin => skin.modes || [skin.appearance || 'dark'];
const skinById = id => G.skins.find(s => s.id === id);
const isDual = skin => modesOf(skin).includes('dark') && modesOf(skin).includes('light');
const modeOf = skin => previewModes.get(skin.id) || (modesOf(skin).includes(state.mode) ? state.mode : modesOf(skin)[0]);
const downloadIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8m-3-3 3 3 3-3M3 11v3h10v-3"/></svg>';

function dateText(iso){
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en', {day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(d);
}

function matches(s){
  const text = [s.name,s.author,s.description,(s.tags || []).join(' '),s.source].join(' ').toLowerCase();
  return state.q.split(/\s+/).every(t => text.includes(t))
    && (state.appearance === 'all' || (state.appearance === 'dual' ? isDual(s) : modesOf(s).includes(state.appearance)))
    && (state.motion === 'all' || (state.motion === 'animated' ? s.animated : !s.animated))
    && (state.css === 'all' || (state.css === 'css' ? s.hasCss : !s.hasCss))
    && (state.source === 'all' || s.source === state.source)
    && (state.tag === 'all' || (s.tags || []).includes(state.tag));
}

function filtered(){
  const list = G.skins.filter(matches);
  const sorters = {
    installs:(a,b) => (b.installCount ?? -1) - (a.installCount ?? -1) || a.name.localeCompare(b.name),
    newest:(a,b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
    name:(a,b) => a.name.localeCompare(b.name),
    animated:(a,b) => Number(b.animated) - Number(a.animated) || a.name.localeCompare(b.name)
  };
  return list.sort(sorters[state.sort]);
}

function modeButtons(s, mode){
  return modesOf(s).length < 2 ? '' : `<div class="mode-toggle" role="group" aria-label="${escapeHTML(s.name)} preview mode">${modesOf(s).map(m => `<button type="button" data-mode="${m}" aria-pressed="${m === mode}">${m}</button>`).join('')}</div>`;
}

function preview(s, {interactive = false, spotlight = false} = {}){
  const mode = modeOf(s);
  let content = '<div class="preview-unavailable">Preview unavailable</div>';
  if(s.animated && reducedMotion.matches && !motionEnabled.has(s.id)){
    content = `<div class="motion-paused" style="--preview-color:${escapeHTML(s.palettes?.[mode]?.canvas || '#171720')}"><span>Motion paused</span><button type="button" class="button" data-play="${escapeHTML(s.id)}">Play live preview ▷</button><small>Respects your reduced motion setting</small></div>`;
  } else if(s.previews?.[mode]){
    content = `<div class="preview-stage"><iframe title="${escapeHTML(s.name)} ${mode} live preview" src="${escapeHTML(s.previews[mode])}" loading="${spotlight ? 'eager' : 'lazy'}" tabindex="${interactive ? '0' : '-1'}" data-live-preview></iframe></div>`;
  } else if(s.images?.[0]){
    content = `<img class="preview-image" src="${escapeHTML(s.images[0].src)}" alt="${escapeHTML(s.images[0].alt || s.name)}" loading="lazy">`;
  }
  return `<div class="preview-wrap" data-preview-for="${escapeHTML(s.id)}">${content}${interactive || (s.animated && reducedMotion.matches && !motionEnabled.has(s.id)) ? '' : `<button class="preview-shield" type="button" data-open="${escapeHTML(s.id)}" aria-label="Open ${escapeHTML(s.name)} details and full preview"></button>`}${s.animated && !interactive ? '<span class="motion-badge"><span class="green-dot"></span> Animated</span>' : ''}${modeButtons(s,mode)}</div>`;
}

function download(s, large = false){
  return s.jsonFile ? `<a class="${large ? 'button primary' : 'download-link'}" href="${escapeHTML(s.jsonFile)}" download="${escapeHTML(s.id)}.json">${large ? 'Download JSON' : 'Get skin'} ${downloadIcon}</a>` : `<span class="preview-only">Preview only</span>`;
}

function card(s){
  const source = s.sourceUrl ? `<a href="${escapeHTML(s.sourceUrl)}" target="_blank" rel="noopener" aria-label="${escapeHTML(s.name)} source on ${escapeHTML(s.source)}">${escapeHTML(s.source)} ↗</a>` : escapeHTML(s.source);
  return `<article class="card${selected.has(s.id) ? ' selected' : ''}" data-id="${escapeHTML(s.id)}"><div class="card-preview">${preview(s)}</div><div class="meta"><div class="title-row"><div><h3 class="skin-title"><button type="button" data-open="${escapeHTML(s.id)}">${escapeHTML(s.name)}</button></h3><p class="author">by ${escapeHTML(s.author)}${s.installCount != null ? ` · ${s.installCount} installs` : ''}</p></div><button class="compare-button" type="button" data-compare="${escapeHTML(s.id)}" aria-pressed="${selected.has(s.id)}" aria-label="Compare ${escapeHTML(s.name)}" title="Add to comparison">${selected.has(s.id) ? '✓' : '⊞'}</button></div><div class="card-swatches" aria-label="${escapeHTML(s.name)} palette">${(s.swatches || []).slice(0,6).map(sw => `<i style="background:${escapeHTML(sw.color)}" title="${escapeHTML(sw.label)}: ${escapeHTML(sw.color)}"></i>`).join('')}<span class="card-kind">${modesOf(s).length > 1 ? 'Dark + light' : modesOf(s)[0] === 'light' ? 'Light' : 'Dark'} · ${s.hasCss ? 'Custom CSS' : 'Palette'}</span></div><div class="card-bottom"><span class="card-source">${source}</span>${download(s)}</div></div></article>`;
}

const previewObserver = new ResizeObserver(entries => {
  for(const {target} of entries) scalePreview(target);
});
function scalePreview(wrap){
  const stage = $('.preview-stage',wrap);
  if(!stage || !wrap.clientWidth) return;
  const scale = wrap.clientWidth / 760;
  stage.style.height = `${wrap.clientHeight / scale}px`;
  stage.style.transform = `scale(${scale})`;
}
function observePreviews(root = document){
  $$('.preview-wrap',root).forEach(wrap => { previewObserver.observe(wrap); scalePreview(wrap); });
  $$('iframe[data-live-preview]',root).forEach(frame => frame.addEventListener('load',() => {
    try{
      const doc = frame.contentDocument;
      if(!doc) return;
      const style = doc.createElement('style');
      style.textContent = '.shell{display:grid;grid-template-columns:150px minmax(0,1fr)}' + (motionEnabled.has(frame.closest('[data-preview-for]').dataset.previewFor) ? '' : '@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}');
      doc.head.append(style);
    }catch{}
  }));
}
function removePreviews(root){
  $$('.preview-wrap',root).forEach(wrap => previewObserver.unobserve(wrap));
}
function render(){
  const list = filtered();
  removePreviews($('#grid'));
  $('#grid').innerHTML = list.map(card).join('') || '<div class="empty"><h3>No skins found.</h3><p>Try a different search, or make a little room in your filters.</p><button type="button" class="button" data-reset>Clear all filters</button></div>';
  $('#status').innerHTML = `Showing <strong>${list.length}</strong> of ${G.skins.length} skins`;
  observePreviews($('#grid'));
}
function badges(s){
  return `<div class="badges">${s.animated ? '<span class="badge anim">Animated</span>' : '<span class="badge">Static</span>'}<span class="badge">${s.hasCss ? 'Custom CSS' : 'Palette only'}</span>${modesOf(s).map(m => `<span class="badge">${escapeHTML(m)}</span>`).join('')}${(s.tags || []).map(t => `<span class="badge">${escapeHTML(t)}</span>`).join('')}</div>`;
}
function detail(s){
  const links = (s.links || []).map(l => `<a class="button" href="${escapeHTML(l.url)}" target="_blank" rel="noopener">${escapeHTML(l.label)} ↗</a>`).join('');
  const sourceLink = s.sourceUrl ? `<a class="button" href="${escapeHTML(s.sourceUrl)}" target="_blank" rel="noopener">View source ↗</a>` : '';
  const install = s.jsonFile ? `<div class="install-box"><h4>Make it yours</h4><p>Download the JSON. In T3 Code, open <strong>Settings → Appearance → Add</strong>, then drop in the file.</p><div class="install-command"><code>t3 theme set ${escapeHTML(s.id)}.json</code><button class="copy-command" type="button" data-command="t3 theme set ${escapeHTML(s.id)}.json">Copy command</button></div></div>` : '<div class="install-box"><h4>Preview only</h4><p>No public theme file was found. See the source for the original post.</p></div>';
  return `<section>${preview(s,{interactive:true})}<div class="detail-head"><div><h3>${escapeHTML(s.name)}</h3><p class="author">by ${escapeHTML(s.author)} · ${escapeHTML(s.source)}${s.createdAt ? ` · ${dateText(s.createdAt)}` : ''}${s.installCount != null ? ` · ${s.installCount} installs` : ''}</p></div>${download(s,true)}</div>${s.description ? `<p class="description">${escapeHTML(s.description)}</p>` : ''}${badges(s)}<div class="swatches">${(s.swatches || []).map(sw => `<span class="swatch"><i style="background:${escapeHTML(sw.color)}"></i>${escapeHTML(sw.label)} <span>${escapeHTML(sw.color)}</span></span>`).join('')}</div>${install}<div class="detail-links">${sourceLink}${links}</div></section>`;
}
function showModal(title, content){
  returnFocus = document.activeElement;
  removePreviews(modal);
  modal.innerHTML = `<div class="modal-header"><h2 id="modal-title">${escapeHTML(title)}</h2><button class="close" type="button" aria-label="Close details" data-close>×</button></div><div class="modal-content">${content}</div>`;
  if(!modal.open) modal.showModal();
  document.body.style.overflow = 'hidden';
  observePreviews(modal);
  $('.close',modal).focus();
}
function openModal(id){
  const s = skinById(id);
  if(s) showModal('A closer look',detail(s));
}
function closeModal(){
  modal.close();
}
modal.addEventListener('close',() => {
  document.body.style.overflow = '';
  removePreviews(modal);
  modal.innerHTML = '';
  if(returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
});
modal.addEventListener('click',e => {
  if(e.target !== modal) return;
  const r = modal.getBoundingClientRect();
  if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal();
});
function updateCompare(){
  for(const btn of $$('[data-compare]')){
    const on = selected.has(btn.dataset.compare);
    btn.setAttribute('aria-pressed',String(on));
    btn.textContent = on ? '✓' : '⊞';
    btn.closest('.card')?.classList.toggle('selected',on);
  }
  const bar = $('#compare-bar');
  bar.hidden = selected.size === 0;
  bar.innerHTML = `<span class="selected-names">${[...selected].map(id => escapeHTML(skinById(id).name)).join(' + ')}</span><button type="button" class="clear-compare" data-clear-compare>Clear</button><button type="button" class="button" data-open-compare ${selected.size < 2 ? 'disabled' : ''}>Compare ${selected.size}/2 <span aria-hidden="true">↗</span></button>`;
}
function announce(text){ $('#announcement').textContent = text; }
function reset(){
  Object.assign(state,{q:'',appearance:'all',motion:'all',css:'all',source:'all',tag:'all'});
  $('#search').value = '';
  $('#source').value = 'all';
  $('#tag').value = 'all';
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.value === 'all')));
  render();
}
function copyCommand(button){
  const code = button.parentElement.querySelector('code');
  const range = document.createRange();
  range.selectNodeContents(code);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  let copied = false;
  try{ copied = document.execCommand('copy'); }catch{}
  button.textContent = copied ? 'Copied ✓' : 'Command selected — copy';
  announce(copied ? 'Install command copied' : 'Install command selected. Use your copy shortcut.');
}

function boot(){
  const options = {
    appearance:[['all','All appearances',s=>true],['dark','Dark',s=>modesOf(s).includes('dark')],['light','Light',s=>modesOf(s).includes('light')],['dual','Dark + light',isDual]],
    motion:[['all','All skins',s=>true],['animated','Animated',s=>s.animated],['static','Static',s=>!s.animated]],
    css:[['all','All styles',s=>true],['css','Custom CSS',s=>s.hasCss],['palette','Palette only',s=>!s.hasCss]]
  };
  for(const [key,opts] of Object.entries(options)){
    $(`#${key}-filters`).innerHTML = opts.map(([value,label,test]) => `<button type="button" class="filter-option" data-filter="${key}" data-value="${value}" aria-pressed="${value === 'all'}"><span class="radio" aria-hidden="true"></span>${label}<span class="filter-count">${G.skins.filter(test).length}</span></button>`).join('');
  }
  const tags = new Map();
  G.skins.forEach(s => (s.tags || []).forEach(t => tags.set(t,(tags.get(t) || 0) + 1)));
  [...tags].sort((a,b) => a[0].localeCompare(b[0])).forEach(([tag,count]) => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = `${tag} (${count})`;
    $('#tag').append(option);
  });
  $('#total-count').textContent = G.skins.length;
  $('#hero-stat').textContent = `${G.skins.length} skins. All kinds of you.`;
  const spotlight = skinById('nyx') || G.skins[0];
  $('#spotlight').innerHTML = `<div class="spotlight-label"><span>IN THE SPOTLIGHT</span><span>01 / ${String(G.skins.length).padStart(2,'0')}</span></div>${preview(spotlight,{spotlight:true})}<div class="spotlight-caption"><div><strong>${escapeHTML(spotlight.name)}</strong><span>by ${escapeHTML(spotlight.author)} · A quieter kind of night.</span></div><button type="button" data-open="${escapeHTML(spotlight.id)}" aria-label="Explore ${escapeHTML(spotlight.name)}">↗</button></div>`;
  observePreviews($('#spotlight'));
  $('#search').addEventListener('input',e => {state.q = e.target.value.trim().toLowerCase();render();});
  for(const key of ['source','tag','sort']) $(`#${key}`).addEventListener('change',e => {state[key] = e.target.value;render();});
  $('#reset').addEventListener('click',reset);
  $('#mobile-filters').addEventListener('click',e => {
    const expanded = e.currentTarget.getAttribute('aria-expanded') !== 'true';
    e.currentTarget.setAttribute('aria-expanded',String(expanded));
    $('#filter-panel').classList.toggle('is-open',expanded);
  });
  document.addEventListener('click',e => {
    const btn = e.target.closest('button');
    if(!btn) return;
    if(btn.dataset.play){
      motionEnabled.add(btn.dataset.play);
      $$(`[data-preview-for="${btn.dataset.play}"]`).forEach(wrap => {
        const s = skinById(btn.dataset.play);
        const interactive = Boolean(wrap.closest('dialog'));
        previewObserver.unobserve(wrap);
        const container = document.createElement('div');
        container.innerHTML = preview(s,{interactive});
        const next = container.firstElementChild;
        wrap.replaceWith(next);
        observePreviews(next.parentElement);
      });
    }else if(btn.dataset.filter){
      state[btn.dataset.filter] = btn.dataset.value;
      $$(`[data-filter="${btn.dataset.filter}"]`).forEach(b => b.setAttribute('aria-pressed',String(b === btn)));
      render();
    }else if(btn.dataset.globalMode){
      state.mode = btn.dataset.globalMode;
      previewModes.clear();
      $$('[data-global-mode]').forEach(b => b.setAttribute('aria-pressed',String(b === btn)));
      for(const wrap of $$('.preview-wrap')) switchPreview(wrap,state.mode);
      announce(`Previews set to ${state.mode} where available`);
    }else if(btn.dataset.mode){
      const wrap = btn.closest('[data-preview-for]');
      previewModes.set(wrap.dataset.previewFor,btn.dataset.mode);
      $$(`[data-preview-for="${wrap.dataset.previewFor}"]`).forEach(w => switchPreview(w,btn.dataset.mode));
    }else if(btn.dataset.open){
      openModal(btn.dataset.open);
    }else if(btn.hasAttribute('data-close')){
      closeModal();
    }else if(btn.dataset.compare){
      const id = btn.dataset.compare;
      if(selected.has(id)) selected.delete(id);
      else if(selected.size < 2) selected.add(id);
      else{ announce('Two skins selected. Remove one to compare another.'); return; }
      updateCompare();
      announce(`${selected.size} of 2 skins selected for comparison`);
    }else if(btn.hasAttribute('data-clear-compare')){
      selected.clear();updateCompare();
    }else if(btn.hasAttribute('data-open-compare') && selected.size === 2){
      showModal('Find your feeling. Side by side.',`<div class="compare-grid">${[...selected].map(id => detail(skinById(id))).join('')}</div>`);
    }else if(btn.hasAttribute('data-reset')){
      reset();$('#search').focus();
    }else if(btn.dataset.command){
      copyCommand(btn);
    }
  });
  document.addEventListener('keydown',e => {
    if(e.key === '/' && !modal.open && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest('input,textarea,select,[contenteditable=true]')){e.preventDefault();$('#search').focus();}
  });
  render();
}
function switchPreview(wrap,preferred){
  const s = skinById(wrap.dataset.previewFor);
  const mode = modesOf(s).includes(preferred) ? preferred : modesOf(s)[0];
  const frame = $('iframe',wrap);
  if(frame && s.previews?.[mode] && frame.getAttribute('src') !== s.previews[mode]){
    frame.src = s.previews[mode];
    frame.title = `${s.name} ${mode} live preview`;
  }
  $$('[data-mode]',wrap).forEach(b => b.setAttribute('aria-pressed',String(b.dataset.mode === mode)));
}
boot();
