(() => {
  const scene = document.querySelector('.sharing-scene');
  if (!scene) return;
  const NS = 'http://www.w3.org/2000/svg', key = 'posted-by-opening-lines-v1';
  const lines = [...scene.querySelectorAll('.sharing-scroll-line')].slice(0, 24).concat([...scene.querySelectorAll('.sharing-upward-lines path')]);
  const original = lines.map(line => ({ d: line.getAttribute('d'), points: line.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number), width: +line.getAttribute('stroke-width'), color: line.getAttribute('stroke') }));
  const originalCount = lines.length;
  const templates = lines.map(line => line.cloneNode(false));
  const defaults = original.map((v, id) => ({ id, angle: 0, length: 100, width: v.width, color: v.color, glow: 1, deleted: false, controls: [0, 0, 0, 0], anchors: [0, 0, 0, 0], position: [0, 0] }));
  const copy = v => JSON.parse(JSON.stringify(v));
  let values = copy(defaults), selected = 0, referenceCurvesApplied = false;
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
  const added = [];
  const appendLine = template => {
    const id = lines.length, line = templates[template].cloneNode(false);
    line.setAttribute('class', 'sharing-extra-opening-line'); line.removeAttribute('style');
    scene.querySelector('.sharing-upward-lines').append(line);
    lines.push(line); original.push(copy(original[template]));
    defaults.push({ ...copy(defaults[template]), id, deleted: false }); added.push({ template });
  };
  const loadSnapshot = data => {
    lines.splice(originalCount).forEach(line => line.remove()); original.splice(originalCount); defaults.splice(originalCount); added.length = 0;
    data.added.forEach(e => appendLine(e.template)); values = copy(data.lines); referenceCurvesApplied = data.curvePreset === 'sweeping-v1';
  };
  const snapshot = () => ({ version: 2, lines: values, added, curvePreset: referenceCurvesApplied ? 'sweeping-v1' : null });
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (valid(saved)) values = saved;
    else if (validSnapshot(saved)) loadSnapshot(saved);
  } catch {}
  const launcher = document.createElement('button'); launcher.type = 'button'; launcher.className = 'opening-line-launch'; launcher.textContent = '첫 화면 선 편집'; launcher.hidden = true; document.body.append(launcher);
  const dialog = document.createElement('dialog'); dialog.className = 'opening-line-dialog'; dialog.setAttribute('aria-label', '첫 화면 선의 방향 두께 길이 발광 편집');
  dialog.innerHTML = `<header><strong>첫 화면 선 편집</strong><button data-action="add">선 추가</button><button data-action="delete">선택 선 삭제</button><button data-action="restore">삭제 취소</button><button data-action="reference">사진처럼 구부리기</button><button data-action="before-reference">곡선 변경 전 복원</button><button data-action="bend-reset">구부림 초기화</button><button data-action="save">저장</button><button data-action="reset">선택 선 초기화</button><button data-action="reset-all">전체 초기화</button><button data-action="export">파일 내보내기</button><button data-action="import">파일 불러오기</button><button data-action="close">편집 끝내기</button><input type="file" accept=".json,application/json" hidden></header><div class="opening-line-settings"><label>선 선택 <select></select></label><label><input type="checkbox" data-all> 모든 선에 적용</label><label>색상 <input data-color type="color" value="#ef65c0" aria-label="선 색상"></label><label>방향 <input data-field="angle" type="range" min="-180" max="180" step="1"><output data-output="angle"></output></label><label>두께 <input data-field="width" type="range" min="0.2" max="12" step="0.1"><output data-output="width"></output></label><label>길이 <input data-field="length" type="range" min="20" max="250" step="1"><output data-output="length"></output></label><label>발광 <input data-field="glow" type="range" min="0" max="5" step="0.1"><output data-output="glow"></output></label></div><div class="opening-line-view-tools"><button data-view="out" aria-label="축소">−</button><output data-zoom>100%</output><button data-view="in" aria-label="확대">＋</button><button data-view="all">전체 보기</button><button data-view="selected">선택한 선 크게 보기</button><span>빈 공간 드래그: 화면 이동 · 휠: 확대/축소</span></div><p>선을 잡고 드래그하면 전체 이동 · 파란 점은 시작점과 끝점 이동 · 분홍 점은 곡선 조절. 선택한 점은 방향키로 미세 이동할 수 있습니다. (Shift: 10씩 이동)</p><div class="opening-line-canvas"></div><p role="status"></p>`;
  document.body.append(dialog);
  const select = dialog.querySelector('select'), status = dialog.querySelector('[role=status]');
  const svg = document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','-240 -220 1480 1100'); svg.classList.add('opening-line-preview');
  const liveCrowd = scene.closest('.sharing-camera').querySelector('.sharing-crowd-layer');
  if (liveCrowd) {
    const crowd = document.createElementNS(NS, 'image');
    crowd.setAttribute('href', liveCrowd.getAttribute('src'));
    crowd.setAttribute('y', liveCrowd.dataset.sceneTop);
    crowd.setAttribute('width', liveCrowd.dataset.sceneWidth);
    crowd.setAttribute('height', liveCrowd.dataset.sceneHeight);
    crowd.classList.add('sharing-crowd-art');
    svg.append(crowd);
  }
  const previews = [], deletedHistory = [];
  const rebuildPreviews = () => {
    previews.splice(0).forEach(p => p.g.remove());
    lines.forEach((line, i) => {
      const g = document.createElementNS(NS,'g'), hit = line.cloneNode(false), visible = line.cloneNode(false);
      hit.removeAttribute('class'); visible.removeAttribute('class'); hit.removeAttribute('style'); visible.removeAttribute('style');
      g.dataset.line = i; g.tabIndex = 0; g.setAttribute('role','button'); g.setAttribute('aria-label', `선 ${i + 1} 선택`);
      hit.classList.add('opening-line-hit'); visible.classList.add('opening-line-art'); g.append(hit,visible); svg.append(g);
      previews.push({ g, hit, visible });
    });
  };
  const handles = document.createElementNS(NS, 'g'); handles.classList.add('opening-curve-handles');
  let controlDrag = null;
  rebuildPreviews();
  dialog.querySelector('.opening-line-canvas').append(svg);
  const colorInput = dialog.querySelector('[data-color]');
  let view = { x: -240, y: -220, width: 1480, height: 1100 };
  const fields = [...dialog.querySelectorAll('[data-field]')];
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
  const applyReferenceCurves = () => {
    // Work in visible coordinates, then convert the two handles back to local offsets.
    values.forEach((v, i) => {
      if (v.deleted) return;
      const points = pathData(original[i], v).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
      const [sx, sy] = points, ex = points[6], ey = points[7], dx = ex - sx;
      const spread = Math.max(180, Math.min(700, Math.hypot(dx, ey - sy)));
      const random = ((i * 73 + 29) % 101) / 100, side = i % 2 ? 1 : -1;
      const rise = 170 + random * 310;
      const handles = [
        { x: sx + dx * .08 + side * spread * (.12 + random * .22), y: sy - rise },
        { x: ex - dx * .18 - side * spread * (.28 + random * .28), y: Math.min(sy, ey) - rise * (.45 + random * .5) }
      ];
      const angle = -v.angle * Math.PI / 180, factor = v.length / 100, base = original[i].points;
      v.controls = handles.flatMap((p, j) => {
        const x = p.x - base[0] - (v.position?.[0] || 0), y = p.y - base[1] - (v.position?.[1] || 0);
        return [(x * Math.cos(angle) - y * Math.sin(angle)) / factor + base[0] - base[2 + j * 2],
          (x * Math.sin(angle) + y * Math.cos(angle)) / factor + base[1] - base[3 + j * 2]].map(n => Math.max(-5000,Math.min(5000,n)));
      });
    });
    referenceCurvesApplied = true;
  };
  const render = () => {
    lines.forEach((line,i) => {
      const v = values[i], d = pathData(original[i],v);
      line.dataset.lineDeleted = String(Boolean(v.deleted)); line.style.display = v.deleted ? 'none' : '';
      previews[i].g.style.display = v.deleted ? 'none' : '';
      line.setAttribute('d',d); line.setAttribute('stroke-width',v.width); line.dataset.glow = v.glow;
      const color = v.color || original[i].color;
      line.setAttribute('stroke', color); previews[i].visible.setAttribute('stroke', color);
      const filter = v.glow ? `drop-shadow(0 0 ${v.glow * 1.8}px ${color})` : 'none';
      line.style.filter = filter;
      previews[i].hit.setAttribute('d',d); previews[i].visible.setAttribute('d',d); previews[i].visible.setAttribute('stroke-width',v.width); previews[i].visible.style.filter = filter;
      previews[i].g.classList.toggle('is-selected', i === selected);
    });
    if (!values[selected] || values[selected].deleted) selected = values.findIndex(v => !v.deleted);
    handles.replaceChildren(); svg.append(handles);
    if (selected >= 0) {
      const points = pathData(original[selected], values[selected]).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
      [0, 1].forEach(index => {
        const anchor = index === 0 ? 0 : 6, control = index * 2 + 2;
        const tether = document.createElementNS(NS, 'line');
        for (const [attr, value] of Object.entries({x1:points[anchor], y1:points[anchor+1], x2:points[control], y2:points[control+1]})) tether.setAttribute(attr, value);
        handles.append(tether);
        const end = document.createElementNS(NS, 'circle');
        end.setAttribute('cx', points[anchor]); end.setAttribute('cy', points[anchor + 1]); end.setAttribute('r', '11');
        end.dataset.anchor = index; end.tabIndex = 0; end.setAttribute('role', 'button');
        end.setAttribute('aria-label', index === 0 ? '시작점 이동' : '끝점 이동'); handles.append(end);
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', points[control]); dot.setAttribute('cy', points[control+1]); dot.setAttribute('r', '10');
        dot.dataset.control = index; dot.tabIndex = 0; dot.setAttribute('role', 'button'); dot.setAttribute('aria-label', `곡선 조절점 ${index + 1}. 드래그하거나 방향키로 이동`);
        handles.append(dot);
      });
    }
    select.replaceChildren();
    lines.forEach((line, i) => {
      if (values[i].deleted) return;
      const option = document.createElement('option'); option.value = i;
      option.textContent = i >= originalCount ? `추가한 선 ${i - originalCount + 1}` : i < 24 ? `휴대폰 연결선 ${i + 1}` : `바깥으로 뻗는 선 ${i - 23}`;
      select.append(option);
    });
    select.value = selected;
    fields.forEach(input => { input.disabled = selected < 0; });
    colorInput.disabled = selected < 0;
    dialog.querySelector('[data-view="selected"]').disabled = selected < 0;
    dialog.querySelector('[data-action="delete"]').disabled = selected < 0;
    dialog.querySelector('[data-action="reset"]').disabled = selected < 0;
    dialog.querySelector('[data-action="bend-reset"]').disabled = selected < 0;
    dialog.querySelector('[data-action="restore"]').disabled = !deletedHistory.length;
    if (selected < 0) { window.dispatchEvent(new Event('openinglineschange')); return; }
    colorInput.value = values[selected].color || original[selected].color;
    fields.forEach(input => { const field = input.dataset.field; input.value = values[selected][field]; dialog.querySelector(`[data-output="${field}"]`).textContent = `${values[selected][field]}${field==='angle'?'°':field==='length'?'%':field==='glow'?'×':''}`; });
    if (dialog.open) updateView();
    window.dispatchEvent(new Event('openinglineschange'));
  };
  const controlPosition = index => {
    const points = pathData(original[selected], values[selected]).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
    return { x: points[2 + index * 2], y: points[3 + index * 2] };
  };
  const moveControl = (index, point) => {
    const v = values[selected], base = original[selected].points, angle = -v.angle * Math.PI / 180, factor = v.length / 100;
    const dx = point.x - base[0] - (v.position?.[0] || 0), dy = point.y - base[1] - (v.position?.[1] || 0);
    v.controls = [...(v.controls || [0, 0, 0, 0])];
    v.controls[index * 2] = Math.max(-5000, Math.min(5000, (dx * Math.cos(angle) - dy * Math.sin(angle)) / factor + base[0] - base[2 + index * 2]));
    v.controls[index * 2 + 1] = Math.max(-5000, Math.min(5000, (dx * Math.sin(angle) + dy * Math.cos(angle)) / factor + base[1] - base[3 + index * 2]));
    render(); status.textContent = '곡선 수정 중 · 저장하면 구부림도 함께 유지됩니다.';
  };
  const moveAnchor = (index, point) => {
    const v = values[selected], base = original[selected].points, angle = -v.angle * Math.PI / 180, factor = v.length / 100;
    const dx = point.x - base[0] - (v.position?.[0] || 0), dy = point.y - base[1] - (v.position?.[1] || 0);
    v.anchors = [...(v.anchors || [0,0,0,0])]; v.controls = [...(v.controls || [0,0,0,0])];
    const at = index * 2, baseAt = index === 0 ? 0 : 6;
    const x = Math.max(-5000, Math.min(5000, (dx * Math.cos(angle) - dy * Math.sin(angle)) / factor + base[0] - base[baseAt]));
    const y = Math.max(-5000, Math.min(5000, (dx * Math.sin(angle) + dy * Math.cos(angle)) / factor + base[1] - base[baseAt + 1]));
    v.controls[at] = Math.max(-5000, Math.min(5000, v.controls[at] + x - v.anchors[at]));
    v.controls[at + 1] = Math.max(-5000, Math.min(5000, v.controls[at + 1] + y - v.anchors[at + 1]));
    v.anchors[at] = x; v.anchors[at + 1] = y; render();
  };
  const mousePoint = event => new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const target = event.target.closest('[data-control], [data-anchor]'), line = event.target.closest('[data-line]');
    if (!target && !line) {
      event.preventDefault(); controlDrag = { pointer: event.pointerId, type: 'pan', startClient: { x: event.clientX, y: event.clientY }, view: {...view} };
      svg.setPointerCapture(event.pointerId); return;
    }
    if (line) selected = +line.dataset.line;
    if (selected < 0) return;
    const type = target ? target.dataset.anchor !== undefined ? 'anchor' : 'control' : 'line';
    event.preventDefault();
    controlDrag = { pointer: event.pointerId, type, index: target ? +(target.dataset.anchor ?? target.dataset.control) : 0,
      start: mousePoint(event), position: [...(values[selected].position || [0,0])] };
    svg.setPointerCapture(event.pointerId); render();
  });
  svg.addEventListener('pointermove', event => {
    if (!controlDrag || controlDrag.pointer !== event.pointerId) return;
    if (controlDrag.type === 'pan') {
      const bounds = svg.getBoundingClientRect(), factor = Math.max(controlDrag.view.width / bounds.width, controlDrag.view.height / bounds.height);
      view.x = controlDrag.view.x - (event.clientX - controlDrag.startClient.x) * factor;
      view.y = controlDrag.view.y - (event.clientY - controlDrag.startClient.y) * factor;
      updateView(); return;
    }
    const point = mousePoint(event);
    if (controlDrag.type === 'control') moveControl(controlDrag.index, point);
    else if (controlDrag.type === 'anchor') moveAnchor(controlDrag.index, point);
    else {
      values[selected].position = [Math.max(-5000, Math.min(5000, controlDrag.position[0] + point.x - controlDrag.start.x)), Math.max(-5000, Math.min(5000, controlDrag.position[1] + point.y - controlDrag.start.y))];
      render();
    }
    status.textContent = '위치와 방향 수정 중 · 저장하면 그대로 유지됩니다.';
  });
  const finishControl = event => {
    if (controlDrag?.pointer !== event.pointerId) return;
    controlDrag = null; if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
  };
  svg.addEventListener('pointerup', finishControl); svg.addEventListener('pointercancel', finishControl);
  svg.addEventListener('keydown', event => {
    const target = event.target.closest('[data-control], [data-anchor]');
    if (!target || selected < 0 || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const type = target.dataset.anchor !== undefined ? 'anchor' : 'control', index = +(target.dataset.anchor ?? target.dataset.control);
    const points = pathData(original[selected], values[selected]).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
    const offset = type === 'control' ? 2 + index * 2 : index === 0 ? 0 : 6;
    const point = {x: points[offset], y: points[offset + 1]}, step = event.shiftKey ? 10 : 1;
    point.x += event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    point.y += event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    if (type === 'anchor') moveAnchor(index, point); else moveControl(index, point);
    handles.querySelector(`[data-${type}="${index}"]`).focus();
  });
  select.addEventListener('change',()=>{ selected=+select.value;render(); });
  svg.addEventListener('click', event=>{ const g=event.target.closest('[data-line]');if(g){selected=+g.dataset.line;render();} });
  svg.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){const g=event.target.closest('[data-line]');if(g){event.preventDefault();selected=+g.dataset.line;render();}}});
  fields.forEach(input=>input.addEventListener('input',()=>{const field=input.dataset.field; if(dialog.querySelector('[data-all]').checked) values.filter(v=>!v.deleted).forEach(v=>v[field]=+input.value); else values[selected][field]=+input.value;render();status.textContent='수정 중 · 저장하면 현재 브라우저에 유지됩니다.';}));
  colorInput.addEventListener('input', () => {
    if (selected < 0) return;
    if (dialog.querySelector('[data-all]').checked) values.filter(v => !v.deleted).forEach(v => v.color = colorInput.value);
    else values[selected].color = colorInput.value;
    render(); status.textContent = '선과 발광 색상을 변경했습니다. 저장하면 유지됩니다.';
  });
  const updateView = () => {
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
    dialog.querySelector('[data-zoom]').textContent = `${Math.round(1480 / view.width * 100)}%`;
    const bounds = svg.getBoundingClientRect(), unit = Math.max(view.width / Math.max(1, bounds.width), view.height / Math.max(1, bounds.height));
    handles.querySelectorAll('circle').forEach(dot => dot.setAttribute('r', unit * 8));
  };
  const zoom = (factor, center = { x: view.x + view.width / 2, y: view.y + view.height / 2 }) => {
    const width = Math.max(150, Math.min(8000, view.width * factor)), ratio = width / view.width;
    view = { x: center.x + (view.x - center.x) * ratio, y: center.y + (view.y - center.y) * ratio, width, height: view.height * ratio }; updateView();
  };
  const fitView = onlySelected => {
    const coordinates = [];
    values.forEach((v, i) => {
      if (v.deleted || onlySelected && i !== selected) return;
      const pts = pathData(original[i], v).match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g).map(Number);
      for (let j = 0; j < pts.length; j += 2) coordinates.push({ x: pts[j], y: pts[j + 1] });
    });
    if (!coordinates.length) return;
    if (!onlySelected) coordinates.push({x:0,y:240},{x:1000,y:905});
    const left = Math.min(...coordinates.map(p=>p.x)), right = Math.max(...coordinates.map(p=>p.x)), top = Math.min(...coordinates.map(p=>p.y)), bottom = Math.max(...coordinates.map(p=>p.y));
    const padding = onlySelected ? 60 : 90;
    view = { x:left-padding, y:top-padding, width:Math.max(150,right-left+padding*2), height:Math.max(150,bottom-top+padding*2) }; updateView();
  };
  dialog.querySelector('.opening-line-view-tools').addEventListener('click', event => {
    const action = event.target.dataset.view;
    if (action === 'in') zoom(.8); if (action === 'out') zoom(1.25);
    if (action === 'all') fitView(false); if (action === 'selected') fitView(true);
  });
  svg.addEventListener('wheel', event => { if (controlDrag) return; event.preventDefault(); zoom(Math.exp(Math.max(-100,Math.min(100,event.deltaY)) * .003), mousePoint(event)); }, {passive:false});
  new ResizeObserver(updateView).observe(svg);
  const save = ()=>{try{localStorage.setItem(key,JSON.stringify(snapshot()));status.textContent='저장 완료 · 현재 브라우저에 적용됩니다.';}catch{status.textContent='브라우저 저장을 사용할 수 없습니다. 파일로 내보내 보관하세요.';}};
  dialog.querySelector('header').addEventListener('click',event=>{
    const action=event.target.dataset.action;
    if(action==='add'){
      if(added.length>=200){status.textContent='추가 선은 최대 200개까지 가능합니다.';return;}
      const source = selected >= 0 ? selected : 0;
      const template = source < originalCount ? source : added[source - originalCount].template;
      const value = copy(values[source]); appendLine(template); selected = lines.length - 1;
      values.push({...value,id:selected,angle:Math.min(180,value.angle+12),deleted:false});
      rebuildPreviews();render();status.textContent='새 선을 추가했습니다. 방향과 길이를 조정하세요.';
    }
    if(action==='delete' && selected>=0){deletedHistory.push(selected);values[selected].deleted=true;render();status.textContent='선을 삭제했습니다. 삭제 취소로 복원할 수 있습니다.';}
    if(action==='restore' && deletedHistory.length){selected=deletedHistory.pop();values[selected].deleted=false;render();}
    if(action==='bend-reset' && selected>=0){values[selected].controls=[0,0,0,0];render();}
    if(action==='reference'){
      try{localStorage.setItem(`${key}-before-curves`,JSON.stringify(snapshot()));}catch{}
      applyReferenceCurves();render();save();
    }
    if(action==='before-reference'){
      try{const previous=JSON.parse(localStorage.getItem(`${key}-before-curves`));if(!validSnapshot(previous))throw new Error();loadSnapshot(previous);referenceCurvesApplied=true;rebuildPreviews();render();save();}catch{status.textContent='복원할 이전 배치가 없습니다.';}
    }
    if(action==='save')save();
    if(action==='close'){save();dialog.close();}
    if(action==='reset'){values[selected]=copy(defaults[selected]);render();}
    if(action==='reset-all'){values=copy(defaults);selected=0;deletedHistory.length=0;render();}
    if(action==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='posted-by-opening-lines.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    if(action==='import')dialog.querySelector('input[type=file]').click();
  });
  dialog.querySelector('input[type=file]').addEventListener('change',async event=>{const f=event.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(validSnapshot(data))loadSnapshot(data);else if(data.version===1&&valid(data.lines))loadSnapshot({added:[],lines:data.lines});else throw new Error();referenceCurvesApplied=true;selected=0;deletedHistory.length=0;rebuildPreviews();render();save();}catch{status.textContent='올바른 선 배치 JSON 파일을 선택해주세요.';}event.target.value='';});
  launcher.addEventListener('click',()=>{dialog.showModal();document.body.classList.add('opening-lines-editing');render();fitView(false);});
  dialog.addEventListener('close',()=>{document.body.classList.remove('opening-lines-editing');launcher.focus({preventScroll:true});});
  new IntersectionObserver(entries=>{launcher.hidden=!entries[0].isIntersecting;}).observe(scene.closest('.sharing-composition'));
  // Restore the user's arrangement once; never reapply the reference preset on load.
  try {
    const restoreKey = `${key}-restored-original-v1`;
    if (!localStorage.getItem(restoreKey)) {
      const before = JSON.parse(localStorage.getItem(`${key}-before-curves`));
      if (validSnapshot(before)) {
        loadSnapshot(before);
        referenceCurvesApplied = true;
        rebuildPreviews();
        localStorage.setItem(key, JSON.stringify(snapshot()));
        localStorage.setItem(restoreKey, 'true');
      }
    }
  } catch {}
  render();
})();
