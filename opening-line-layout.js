(() => {
  const scene = document.querySelector('.sharing-scene');
  if (!scene) return;
  const NS = 'http://www.w3.org/2000/svg', key = 'posted-by-opening-lines-v1';
  const lines = [...scene.querySelectorAll('.sharing-scroll-line')].slice(0, 24).concat([...scene.querySelectorAll('.sharing-upward-lines path')]);
  const original = lines.map(line => ({ d: line.getAttribute('d'), points: line.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number), width: +line.getAttribute('stroke-width'), color: line.getAttribute('stroke') }));
  const originalCount = lines.length;
  const templates = lines.map(line => line.cloneNode(false));
  const defaults = original.map((v, id) => ({ id, angle: 0, length: 100, width: v.width, color: v.color, glow: 1, deleted: false, controls: [0, 0, 0, 0], anchors: [0, 0, 0, 0], position: [0, 0] }));
  let values = defaults;
  const validValue = (e,i) => e.id === i && Number.isFinite(e.angle) && Math.abs(e.angle) <= 180
    && Number.isFinite(e.length) && e.length >= 20 && e.length <= 250 && Number.isFinite(e.width) && e.width >= .2 && e.width <= 12
    && Number.isFinite(e.glow) && e.glow >= 0 && e.glow <= 5 && (e.color === undefined || typeof e.color === 'string' && /^#[0-9a-f]{6}$/i.test(e.color))
    && (e.deleted === undefined || typeof e.deleted === 'boolean')
    && (e.controls === undefined || Array.isArray(e.controls) && e.controls.length === 4 && e.controls.every(n => Number.isFinite(n) && Math.abs(n) <= 5000))
    && (e.anchors === undefined || Array.isArray(e.anchors) && e.anchors.length === 4 && e.anchors.every(n => Number.isFinite(n) && Math.abs(n) <= 5000))
    && (e.position === undefined || Array.isArray(e.position) && e.position.length === 2 && e.position.every(n => Number.isFinite(n) && Math.abs(n) <= 5000));
  const valid = v => Array.isArray(v) && v.length === originalCount && v.every(validValue);
  const validSnapshot = data => data?.version === 2 && Array.isArray(data.lines) && Array.isArray(data.added)
    && data.added.length <= 200 && data.lines.length === originalCount + data.added.length && data.lines.every(validValue)
    && data.added.every(e => Number.isInteger(e.template) && e.template >= 0 && e.template < originalCount);
  const applySnapshot = snapshot => {
    snapshot.added.forEach(({ template }) => {
      const line = templates[template].cloneNode(false);
      line.setAttribute('class', 'sharing-extra-opening-line');
      line.removeAttribute('style');
      scene.querySelector('.sharing-upward-lines').append(line);
      lines.push(line);
      original.push(original[template]);
    });
    values = snapshot.lines;
  };
  let saved;
  let beforeCurves;
  try {
    if (location.protocol !== 'file:') {
      saved = JSON.parse(localStorage.getItem(key));
      if (!localStorage.getItem(`${key}-restored-original-v1`)) {
        beforeCurves = JSON.parse(localStorage.getItem(`${key}-before-curves`));
      }
    }
  } catch {}
  try {
    const embedded = JSON.parse(document.getElementById('saved-layouts')?.textContent || 'null')?.openingLines;
    if (validSnapshot(beforeCurves)) applySnapshot(beforeCurves);
    else if (valid(saved)) values = saved;
    else if (validSnapshot(saved)) applySnapshot(saved);
    else if (validSnapshot(embedded)) applySnapshot(embedded);
  } catch {}
  const pathData = (base, v) => {
    const [sx,sy] = base.points, radians = v.angle * Math.PI / 180, factor = v.length / 100;
    const pts = [];
    for (let i = 0; i < base.points.length; i += 2) {
      const offsets = v.controls || [0, 0, 0, 0];
      const anchors = v.anchors || [0, 0, 0, 0];
      const ox = i === 2 || i === 4 ? offsets[i - 2] : anchors[i === 0 ? 0 : 2];
      const oy = i === 2 || i === 4 ? offsets[i - 1] : anchors[i === 0 ? 1 : 3];
      const dx = (base.points[i] + ox - sx) * factor, dy = (base.points[i+1] + oy - sy) * factor;
      pts.push(sx + dx * Math.cos(radians) - dy * Math.sin(radians) + (v.position?.[0] || 0), sy + dx * Math.sin(radians) + dy * Math.cos(radians) + (v.position?.[1] || 0));
    }
    return `M${pts[0]} ${pts[1]} C${pts.slice(2).join(' ')}`;
  };
  lines.forEach((line, index) => {
    const value = values[index];
    const base = original[index];
    const color = value.color || base.color;
    line.dataset.lineDeleted = String(Boolean(value.deleted));
    line.dataset.glow = value.glow;
    line.setAttribute('d', pathData(base, value));
    line.setAttribute('stroke-width', value.width);
    line.setAttribute('stroke', color);
    line.style.display = value.deleted ? 'none' : '';
    line.style.filter = value.glow ? `drop-shadow(0 0 ${value.glow * 1.8}px ${color})` : 'none';
  });
  window.dispatchEvent(new Event('openinglinesloaded'));
})();
