// Restore the saved final-diagram layout.
(() => {
  const live = document.querySelector('.finale-detail-map');
  if (!live) return;
  const key = 'posted-by-diagram-layout-v1';
  const texts = [...live.querySelectorAll('text')];
  const paths = [...live.querySelectorAll('.map-linework path')];
  const initial = { version: 1, nodes: texts.map((text, id) => ({ id, label: text.textContent, category: text.classList.contains('map-category'), x: +text.getAttribute('x'), y: +text.getAttribute('y') })), edges: [] };
  let pathIndex = 0, textIndex = 0;
  [5, 5, 5, 4].forEach(count => {
    const parent = textIndex;
    for (let i = 0; i <= count; i++) {
      const path = paths[pathIndex++];
      const [sx, sy, ex, ey] = path.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number);
      const a = i === 0 ? null : parent, b = i === 0 ? parent : parent + i;
      initial.edges.push({ a, b, start: { x: sx - (a === null ? 0 : initial.nodes[a].x), y: sy - (a === null ? 0 : initial.nodes[a].y) }, end: { x: ex - initial.nodes[b].x, y: ey - initial.nodes[b].y }, control: null });
    }
    textIndex += count + 1;
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  let model = clone(initial);
  const valid = value => value?.version === 1 && value.nodes?.length === initial.nodes.length && value.edges?.length === initial.edges.length
    && value.nodes.every((n, i) => n.id === i && n.label === initial.nodes[i].label && Number.isFinite(n.x) && Number.isFinite(n.y) && Math.abs(n.x) <= 5000 && Math.abs(n.y) <= 5000)
    && value.edges.every((e, i) => e.a === initial.edges[i].a && e.b === initial.edges[i].b && [e.start, e.end, ...(e.control ? [e.control] : [])].every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) <= 5000 && Math.abs(p.y) <= 5000));
  try { const saved = JSON.parse(localStorage.getItem(key)); if (valid(saved)) model = saved; } catch {}
  const point = (edge, end) => {
    const id = end === 'start' ? edge.a : edge.b;
    const offset = edge[end];
    return { x: offset.x + (id === null ? 0 : model.nodes[id].x), y: offset.y + (id === null ? 0 : model.nodes[id].y) };
  };
  const edgeD = edge => {
    const a = point(edge, 'start'), b = point(edge, 'end');
    return edge.control ? `M${a.x} ${a.y} Q${edge.control.x} ${edge.control.y} ${b.x} ${b.y}` : `M${a.x} ${a.y} L${b.x} ${b.y}`;
  };
  // Preserve the previously saved arrangement without exposing editing tools.
  model.nodes.forEach((node, i) => {
    texts[i].setAttribute('x', node.x);
    texts[i].setAttribute('y', node.y);
  });
  model.edges.forEach((edge, i) => paths[i].setAttribute('d', edgeD(edge)));
  window.dispatchEvent(new Event('maplayoutchange'));
})();
