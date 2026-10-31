// Shared pure model. The same functions run in tests and the offline developer editor.
// Scan objects are never mutated. Human assertions cannot carry source evidence.
export function createOverlayEngine() {
  const MAX = 1000;
  const fail = message => { throw new Error(message); };
  const text = (value, max = 4000) => typeof value === 'string' && value.length <= max ? value : fail('Invalid or oversized text');
  const identifier = value => typeof value === 'string' && /^(?:[a-f0-9]{24}|human:[a-z0-9-]{1,80})$/.test(value) ? value : fail('Invalid component or connection ID');
  const stamp = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fail('Invalid edit timestamp');
  const meta = item => ({ author: text(item.author, 100), updatedAt: stamp(item.updatedAt) });
  const anchor = value => value == null ? null : ({ fingerprint: text(value.fingerprint, 128), commit: text(value.commit, 64), scannerVersion: text(value.scannerVersion, 30) });
  const find = (scan, type, id) => (type === 'node' ? scan.nodes : scan.edges).find(n => n.id === id);
  const bind = (scan, entity) => entity ? { fingerprint: entity.fingerprint || '', commit: scan.commit, scannerVersion: scan.scannerVersion } : null;
  const fresh = scan => ({ schemaVersion: 1, repository: scan.repository, branch: scan.branch, overrides: [], nodes: [], edges: [], positions: [] });
  function validate(input, scan) {
    if (!input || input.schemaVersion !== 1 || input.repository !== scan.repository || input.branch !== scan.branch) fail('Edits belong to a different repository or branch');
    const result = fresh(scan);
    for (const name of ['overrides', 'nodes', 'edges', 'positions']) {
      if (!Array.isArray(input[name]) || input[name].length > MAX) fail('Too many edits or invalid edit file');
      const seen = new Set();
      result[name] = input[name].map(item => {
        if (!item || typeof item !== 'object') fail('Invalid edit');
        const key = name === 'overrides' || name === 'positions' ? identifier(item.targetId) : identifier(item.id);
        if (seen.has(key)) fail('Duplicate edit ID');
        seen.add(key);
        if (name === 'overrides') {
          if (!['node', 'edge'].includes(item.targetType)) fail('Invalid edit target');
          const value = { targetId: key, targetType: item.targetType, explanation: text(item.explanation), rationale: text(item.rationale), anchor: anchor(item.anchor), ...meta(item) };
          if (item.source !== undefined || item.target !== undefined) {
            if (item.targetType !== 'edge') fail('Only connections can be reconnected');
            value.source = identifier(item.source); value.target = identifier(item.target);
            value.sourceAnchor = anchor(item.sourceAnchor); value.targetAnchor = anchor(item.targetAnchor);
          }
          return value;
        }
        if (name === 'positions') {
          if (![item.x, item.y].every(n => Number.isFinite(n) && n >= 0 && n <= 20000)) fail('Invalid position');
          return { targetId: key, x: item.x, y: item.y, ...meta(item) };
        }
        if (!key.startsWith('human:')) fail('Human additions must have their own IDs');
        if (name === 'nodes' && !text(item.label, 160).trim()) fail('Enter a component name');
        if (name === 'nodes') return { id: key, label: text(item.label, 160), explanation: text(item.explanation), certainty: 'human-supplied', ...meta(item) };
        return { id: key, source: identifier(item.source), target: identifier(item.target), explanation: text(item.explanation), certainty: 'human-supplied', sourceAnchor: anchor(item.sourceAnchor), targetAnchor: anchor(item.targetAnchor), ...meta(item) };
      });
    }
    if (result.nodes.some(n => result.edges.some(e => e.id === n.id))) fail('Duplicate human ID');
    return result;
  }
  function conflicts(scan, input) {
    const state = validate(input, scan);
    const issues = [];
    const inspect = (key, targetId, type, saved, label) => {
      const entity = find(scan, type, targetId);
      if (!entity) {
        if (type === 'node' && state.nodes.some(n => n.id === targetId)) return;
        issues.push({ key, targetId, reason: `${label} is missing from this scan. Your edit is retained.` });
      } else if (!saved || saved.fingerprint !== entity.fingerprint || saved.scannerVersion !== scan.scannerVersion) {
        issues.push({ key, targetId, reason: `${label} has changed. Review your context against the current evidence.` });
      }
    };
    for (const item of state.overrides) {
      inspect(item.targetId, item.targetId, item.targetType, item.anchor, 'Source evidence');
      if (item.source) {
        inspect(item.targetId, item.source, 'node', item.sourceAnchor, 'Reconnected source');
        inspect(item.targetId, item.target, 'node', item.targetAnchor, 'Reconnected destination');
      }
    }
    for (const item of state.edges) {
      inspect(item.id, item.source, 'node', item.sourceAnchor, 'Connection source');
      inspect(item.id, item.target, 'node', item.targetAnchor, 'Connection destination');
    }
    for (const item of state.positions) {
      if (!scan.nodes.some(n => n.id === item.targetId) && !state.nodes.some(n => n.id === item.targetId)) issues.push({ key: item.targetId, targetId: item.targetId, reason: 'Moved component is missing. Its saved position is retained.' });
    }
    return issues;
  }
  function apply(scan, input, operation, author, now = new Date().toISOString()) {
    const state = validate(input, scan);
    const metadata = { author: text(author, 100), updatedAt: stamp(now) };
    if (!metadata.author.trim()) fail('Enter your name to label human edits');
    const upsert = (collection, key, value) => {
      const index = collection.findIndex(item => item[key] === value[key]);
      if (index < 0) collection.push(value); else collection[index] = value;
    };
    const nodeExists = id => scan.nodes.some(n => n.id === id) || state.nodes.some(n => n.id === id);
    if (operation.type === 'note') {
      const entity = find(scan, operation.targetType, operation.targetId);
      if (!entity) fail('Source target is missing; the previous edit has been retained');
      const previous = state.overrides.find(n => n.targetId === entity.id);
      upsert(state.overrides, 'targetId', { ...previous, targetId: entity.id, targetType: operation.targetType, explanation: operation.explanation, rationale: operation.rationale || '', anchor: bind(scan, entity), ...metadata });
    } else if (operation.type === 'node') {
      upsert(state.nodes, 'id', { id: operation.id, label: operation.label, explanation: operation.explanation || '', ...metadata });
    } else if (operation.type === 'edge' || operation.type === 'reconnect') {
      if (!nodeExists(operation.source) || !nodeExists(operation.target)) fail('Choose two existing components');
      const value = { source: operation.source, target: operation.target, explanation: operation.explanation || '', sourceAnchor: bind(scan, find(scan, 'node', operation.source)), targetAnchor: bind(scan, find(scan, 'node', operation.target)), ...metadata };
      if (operation.type === 'edge') upsert(state.edges, 'id', { id: operation.id, ...value });
      else {
        const entity = find(scan, 'edge', operation.targetId);
        if (!entity) fail('Source connection is missing');
        const previous = state.overrides.find(n => n.targetId === entity.id);
        upsert(state.overrides, 'targetId', { ...previous, ...value, targetId: entity.id, targetType: 'edge', rationale: operation.rationale || '', anchor: bind(scan, entity) });
      }
    } else if (operation.type === 'position') {
      if (!nodeExists(operation.targetId)) fail('Component is missing');
      upsert(state.positions, 'targetId', { targetId: operation.targetId, x: operation.x, y: operation.y, ...metadata });
    } else if (operation.type === 'review') {
      const item = state.overrides.find(n => n.targetId === operation.targetId) || state.edges.find(e => e.id === operation.targetId);
      if (!item) fail('Edit is missing');
      if (item.targetId) {
        const entity = find(scan, item.targetType, item.targetId);
        if (!entity) fail('Missing source evidence cannot be marked reviewed');
        item.anchor = bind(scan, entity);
      }
      if (item.source) {
        if (!nodeExists(item.source) || !nodeExists(item.target)) fail('Missing endpoints cannot be marked reviewed');
        item.sourceAnchor = bind(scan, find(scan, 'node', item.source)); item.targetAnchor = bind(scan, find(scan, 'node', item.target));
      }
      Object.assign(item, metadata);
    } else fail('Unsupported edit');
    return validate(state, scan);
  }
  function project(scan, input) {
    const state = validate(input, scan);
    const issues = conflicts(scan, state);
    const decorate = (entity, type) => {
      const edit = state.overrides.find(n => n.targetId === entity.id && n.targetType === type);
      return { ...entity, ...(edit?.source ? { source: edit.source, target: edit.target, certainty: 'human-supplied', evidence: undefined } : {}), human: edit || null, needsReview: issues.some(i => i.key === entity.id) };
    };
    return { nodes: [...scan.nodes.map(n => decorate(n, 'node')), ...state.nodes], edges: [...scan.edges.map(e => decorate(e, 'edge')), ...state.edges.map(e => ({ ...e, needsReview: issues.some(i => i.key === e.id) }))], issues, positions: state.positions };
  }
  return { fresh, validate, apply, conflicts, project };
}
