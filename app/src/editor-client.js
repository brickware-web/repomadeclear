// Bundled into the offline map. No requests, server endpoints, or repository execution.
export function editorClient(scan, engine) {
  const $ = id => document.getElementById(id);
  const key = 'rmc-edits-v1:' + JSON.stringify([scan.repository, scan.branch]);
  let state = engine.fresh(scan), selected = null, storageAvailable = true;
  const status = message => { $('status').textContent = message; };
  try {
    const saved = localStorage.getItem(key);
    if (saved) state = engine.validate(JSON.parse(saved), scan);
  } catch { storageAvailable = false; status('Saved browser edits could not be loaded. Load an edits file, or save your edits to a file before closing.'); }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const short = text => text.length > 29 ? '…' + text.slice(-28) : text;
  const uid = () => 'human:' + crypto.randomUUID();
  const current = () => engine.project(scan, state);
  const meta = item => item ? `<p class="muted">Human-supplied · ${esc(item.author)} · ${esc(new Date(item.updatedAt).toLocaleString())}</p>` : '';
  function apply(operation) {
    try {
      state = engine.apply(scan, state, operation, $('author').value.trim());
      try {
        if (!storageAvailable) throw new Error();
        localStorage.setItem(key, JSON.stringify(state));
        status('Edits saved in this browser. Save an edits file to keep a portable backup.');
      } catch { status('Edit kept in this tab. Use Save edits file before closing; browser storage is unavailable.'); }
      render();
      return true;
    } catch (error) { status(error.message); return false; }
  }
  function point(node, index) {
    const saved = state.positions.find(p => p.targetId === node.id);
    if (saved) return saved;
    const group = node.kind === 'package-reference' ? 1 : node.certainty === 'human-supplied' ? 2 : 0;
    const rows = current().nodes.slice(0, index).filter(n => (n.kind === 'package-reference' ? 1 : n.certainty === 'human-supplied' ? 2 : 0) === group).length;
    return { x: 30 + group * 350, y: 50 + rows * 100 };
  }
  function renderGraph(graph) {
    const positions = new Map(graph.nodes.map((n, i) => [n.id, point(n, i)]));
    const width = Math.max(720, ...[...positions.values()].map(p => p.x + 330));
    const height = Math.max(440, ...[...positions.values()].map(p => p.y + 110));
    const svg = $('graph');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.width = `${width}px`; svg.style.height = `${height}px`;
    svg.innerHTML = '<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#8c9ca5"/></marker></defs>' + graph.edges.map(e => {
      const a = positions.get(e.source), b = positions.get(e.target);
      if (!a || !b) return '';
      const x1 = a.x + 270, y1 = a.y + 31, x2 = b.x, y2 = b.y + 31;
      const human = e.certainty === 'human-supplied' || e.human?.source;
      return `<path class="connection ${human ? 'human-line' : ''} ${selected?.id === e.id ? 'selected-line' : ''}" d="M${x1} ${y1} C${x1 + 55} ${y1},${x2 - 55} ${y2},${x2} ${y2}" marker-end="url(#arrow)" data-edge="${esc(e.id)}"><title>${esc(e.kind || 'Human connection')}</title></path>`;
    }).join('') + graph.nodes.map(n => {
      const p = positions.get(n.id);
      return `<g class="component ${n.certainty === 'human-supplied' ? 'human-node' : ''} ${selected?.id === n.id ? 'selected' : ''}" data-node="${esc(n.id)}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${esc(n.label)}"><rect width="270" height="62" rx="10"/><text x="14" y="25">${esc(short(n.label))}</text><text class="node-kind" x="14" y="46">${n.needsReview ? 'Review needed · ' : ''}${n.certainty === 'human-supplied' ? 'Human-supplied' : n.kind === 'source' ? 'Source file' : 'Package reference'}</text><title>${esc(n.label)}</title></g>`;
    }).join('');
    svg.querySelectorAll('[data-node]').forEach(element => {
      element.onclick = () => { selected = { type: 'node', id: element.dataset.node }; render(); };
      element.onkeydown = event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selected = { type: 'node', id: element.dataset.node }; render(); }
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
          event.preventDefault(); const p = positions.get(element.dataset.node);
          apply({ type: 'position', targetId: element.dataset.node, x: Math.max(0, p.x + (event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0)), y: Math.max(0, p.y + (event.key === 'ArrowUp' ? -20 : event.key === 'ArrowDown' ? 20 : 0)) });
          svg.querySelector(`[data-node="${element.dataset.node}"]`)?.focus();
        }
      };
      element.onpointerdown = event => {
        if (event.button !== 0) return;
        const from = positions.get(element.dataset.node), start = { x: event.clientX, y: event.clientY };
        const scale = svg.viewBox.baseVal.width / svg.getBoundingClientRect().width;
        let moved = false, next = from;
        element.setPointerCapture(event.pointerId);
        element.onpointermove = event => {
          const dx = (event.clientX - start.x) * scale, dy = (event.clientY - start.y) * scale;
          moved ||= Math.abs(dx) + Math.abs(dy) > 5;
          next = { x: Math.min(20000, Math.max(0, from.x + dx)), y: Math.min(20000, Math.max(0, from.y + dy)) };
          if (moved) element.setAttribute('transform', `translate(${next.x} ${next.y})`);
        };
        element.onpointerup = () => {
          element.onpointermove = null; element.onpointerup = null;
          if (moved) { selected = { type: 'node', id: element.dataset.node }; if (!apply({ type: 'position', targetId: element.dataset.node, ...next })) render(); }
        };
        element.onpointercancel = () => { element.onpointermove = null; render(); };
      };
    });
    svg.querySelectorAll('[data-edge]').forEach(element => { element.onclick = () => { selected = { type: 'edge', id: element.dataset.edge }; render(); }; });
  }
  function options(nodes, value) { return nodes.map(n => `<option value="${esc(n.id)}" ${n.id === value ? 'selected' : ''}>${esc(n.label)}</option>`).join(''); }
  function renderInspector(graph) {
    const item = selected && (selected.type === 'node' ? graph.nodes : graph.edges).find(n => n.id === selected.id);
    if (!item) { $('inspector').innerHTML = '<h2>Explore a component</h2><p>Choose a component or connection to see its explanation, source evidence, and human context.</p><p class="muted">Move components by dragging, or focus one and use the arrow keys.</p>'; return; }
    const original = (selected.type === 'node' ? scan.nodes : scan.edges).find(n => n.id === item.id);
    const human = item.human || (item.certainty === 'human-supplied' ? item : null);
    const evidence = original?.evidence;
    $('inspector').innerHTML = `<span class="eyebrow">${original ? 'Detected in source' : 'Human-supplied'}</span><h2>${esc(item.label || 'Connection')}</h2>${item.needsReview ? '<p class="review-tag">Review needed after rescan</p>' : ''}<p>${esc(original?.explanation || item.explanation)}</p>${evidence ? `<details><summary>Source evidence</summary><p><code>${esc(evidence.file)}:${evidence.startLine}–${evidence.endLine}</code></p><p>${esc(evidence.repository)}<br>${esc(evidence.branch)}<br><code>${esc(evidence.commit)}</code></p></details>` : '<p class="muted">No direct source location for this component. Inspect its connections for evidence.</p>'}${original && selected.type === 'edge' ? `<p class="muted">Original connection:<br>${esc(scan.nodes.find(n => n.id === original.source)?.label)} → ${esc(scan.nodes.find(n => n.id === original.target)?.label)}</p>` : ''}<hr><h3>Your explanation</h3><p class="muted">Human context stays separate from detected facts.</p>${meta(human)}<form id="edit-form">${!original && selected.type === 'node' ? `<label>Component name<input id="edit-label" required maxlength="160" value="${esc(item.label)}"></label>` : ''}<label>Explanation<textarea id="explanation" maxlength="4000" rows="4">${esc(human?.explanation || '')}</textarea></label>${original ? `<label>Design rationale / notes<textarea id="rationale" maxlength="4000" rows="3">${esc(human?.rationale || '')}</textarea></label>` : ''}${selected.type === 'edge' ? `<label>From<select id="edit-source">${options(graph.nodes, item.source)}</select></label><label>To<select id="edit-target">${options(graph.nodes, item.target)}</select></label><p class="muted">Changing endpoints creates a human correction. The original source evidence stays above.</p>` : ''}<button type="submit">Save context</button></form>`;
    $('edit-form').onsubmit = event => {
      event.preventDefault(); const explanation = $('explanation').value, rationale = $('rationale')?.value || '';
      if (selected.type === 'edge') {
        const source = $('edit-source').value, target = $('edit-target').value;
        if (original && source === original.source && target === original.target && !item.human?.source) apply({ type: 'note', targetId: item.id, targetType: 'edge', explanation, rationale });
        else apply({ type: original ? 'reconnect' : 'edge', targetId: item.id, id: item.id, source, target, explanation, rationale });
      } else if (original) apply({ type: 'note', targetId: item.id, targetType: 'node', explanation, rationale });
      else apply({ type: 'node', id: item.id, label: $('edit-label').value, explanation });
    };
  }
  function render() {
    const graph = current();
    $('component-count').textContent = graph.nodes.length;
    $('connection-count').textContent = graph.edges.length;
    $('review-count').textContent = graph.issues.length;
    $('components').innerHTML = graph.nodes.map(n => `<button class="list-item ${selected?.id === n.id ? 'active' : ''}" data-id="${esc(n.id)}"><span>${esc(n.label)}</span><small>${n.needsReview ? 'Review needed' : n.certainty === 'human-supplied' ? 'Human-supplied' : n.kind === 'source' ? 'Source file' : 'Package reference'}</small></button>`).join('');
    $('components').querySelectorAll('button').forEach(button => { button.onclick = () => { selected = { type: 'node', id: button.dataset.id }; render(); }; });
    $('connections').innerHTML = graph.edges.map(e => `<button class="list-item" data-id="${esc(e.id)}"><span>${esc(graph.nodes.find(n => n.id === e.source)?.label || 'Missing source')} → ${esc(graph.nodes.find(n => n.id === e.target)?.label || 'Missing destination')}</span><small>${e.human?.source || e.certainty === 'human-supplied' ? 'Human-supplied connection' : esc(e.kind)}${e.needsReview ? ' · Review needed' : ''}</small></button>`).join('');
    $('connections').querySelectorAll('button').forEach(button => { button.onclick = () => { selected = { type: 'edge', id: button.dataset.id }; render(); }; });
    $('reviews').innerHTML = graph.issues.length ? graph.issues.map(issue => {
      const edit = state.overrides.find(e => e.targetId === issue.key) || state.edges.find(e => e.id === issue.key);
      const item = graph.nodes.find(n => n.id === issue.targetId) || graph.edges.find(e => e.id === issue.targetId);
      return `<article><b>${esc(item?.label || 'Retained edit')}</b><p>${esc(issue.reason)}</p>${edit ? `<blockquote>${esc(edit.explanation)}${edit.rationale ? '<br>' + esc(edit.rationale) : ''}</blockquote>${meta(edit)}<button data-review="${esc(issue.key)}">I reviewed this context</button>` : ''}</article>`;
    }).join('') : '<p class="muted">No saved context needs review.</p>';
    $('reviews').querySelectorAll('[data-review]').forEach(button => { button.onclick = () => apply({ type: 'review', targetId: button.dataset.review }); });
    const priorSource = $('new-source').value, priorTarget = $('new-target').value;
    $('new-source').innerHTML = options(graph.nodes, priorSource); $('new-target').innerHTML = options(graph.nodes, priorTarget);
    renderGraph(graph); renderInspector(graph);
  }
  $('add-node').onsubmit = event => { event.preventDefault(); const id = uid(); if (apply({ type: 'node', id, label: $('new-name').value.trim(), explanation: $('new-description').value })) { selected = { type: 'node', id }; $('add-node').reset(); render(); } };
  $('add-edge').onsubmit = event => { event.preventDefault(); const id = uid(); if (apply({ type: 'edge', id, source: $('new-source').value, target: $('new-target').value, explanation: $('new-edge-description').value })) { selected = { type: 'edge', id }; render(); } };
  $('save-edits').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'repo-made-clear-edits.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status('Edits file prepared. It contains human context and layout, separately from scan findings.');
  };
  $('load-edits').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Edit file exceeds the 2 MB limit');
      const loaded = engine.validate(JSON.parse(await file.text()), scan);
      // Explicit import replaces the working overlay; the user can save their current file first.
      state = loaded;
      try { if (storageAvailable) localStorage.setItem(key, JSON.stringify(state)); } catch { storageAvailable = false; }
      render(); status('Edits loaded. Check the review list for changed or missing evidence.' + (!storageAvailable ? ' Save an edits file before closing.' : ''));
    } catch (error) { status('Could not load edits: ' + error.message); }
    event.target.value = '';
  };
  render();
}
