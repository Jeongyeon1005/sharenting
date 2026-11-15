// Adjust only comment artwork; the outer group keeps its scroll animation.
(() => {
  const scene = document.querySelector('.sharing-scene');
  if (!scene) return;
  const NS = 'http://www.w3.org/2000/svg', key = 'posted-by-comment-layout-v1';
  const groups = [...scene.querySelectorAll('.sharing-chat-reveal')];
  const entries = groups.map((group, id) => {
    const artwork = group.firstElementChild, image = artwork.querySelector('image');
    const x = +image.getAttribute('x'), y = +image.getAttribute('y');
    return { group, artwork, id, label: [...artwork.querySelector('text').childNodes].map(node => node.textContent).join(' '),
      cx: x + +image.getAttribute('width') / 2, cy: y + +image.getAttribute('height') / 2,
      opacity: +(artwork.getAttribute('opacity') || 1) };
  });
  const originalCount = entries.length;
  const templates = groups.map(group => group.cloneNode(true));
  const defaults = entries.map(e => ({ id: e.id, dx: 0, dy: 0, scale: 1, opacity: e.opacity, deleted: false, text: null }));
  const copy = data => JSON.parse(JSON.stringify(data));
  let values = copy(defaults), selected = 0, drag = null;
  const validValue = (v, i) => v.id === i && Number.isFinite(v.dx) && Math.abs(v.dx) <= 2000
    && Number.isFinite(v.dy) && Math.abs(v.dy) <= 2000 && Number.isFinite(v.scale) && v.scale >= .2 && v.scale <= 3
    && Number.isFinite(v.opacity) && v.opacity >= 0 && v.opacity <= 1
    && (v.text == null || typeof v.text === 'string' && v.text.length <= 160)
    && (v.deleted === undefined || typeof v.deleted === 'boolean');
  const valid = data => Array.isArray(data) && data.length === originalCount && data.every(validValue);
  const validSnapshot = data => data?.version === 2 && Array.isArray(data.comments) && Array.isArray(data.added)
    && data.added.length <= 200 && data.comments.length === originalCount + data.added.length && data.comments.every(validValue)
    && data.added.every(e => Number.isInteger(e.template) && e.template >= 0 && e.template < originalCount);
  const commentSuggestions = ["오늘은 왜 이렇게 안 웃음ㅋㅋ 기분 안 좋나", "애 표정에서 엄마 귀찮아하는 게 보이네", "이 집 애는 맨날 우는 것 같음", "또 삐졌네ㅋㅋ 이제 콘텐츠 됐네", "솔직히 우는 영상이 제일 재밌긴 함", "반응 웃겨서 자꾸 놀리고 싶을 듯ㅋㅋ", "다음에도 똑같이 해 보고 반응 올려 주세요", "놀라는 표정 슬로우로 보고 싶다ㅋㅋ", "애한텐 미안한데 너무 웃겨서 열 번 봄", "이거 평생 놀림감 확정ㅋㅋ", "졸업식 때 틀면 레전드겠다", "친구들아 이 영상 꼭 저장해 둬라ㅋㅋ", "나중에 애인 생기면 보여 줘야겠네", "엄마가 흑역사 제대로 적립해 주네ㅋㅋ", "이미 다 봤는데 지워도 의미 없을 듯", "저장한 사람 엄청 많을 것 같은데ㅋㅋ", "짤로 쓰기 딱 좋은 표정이다", "이 부분만 잘라서 단톡에 보냄ㅋㅋ", "우리 회사 단톡방에서도 얘 유명함", "이름은 몰라도 우는 얼굴은 알아ㅋㅋ", "실제로 보면 바로 알아볼 것 같아요", "이제 자기보다 유명한 애가 동생이네ㅋㅋ", "동생 나오니까 첫째 분량 확 줄었네", "둘째가 확실히 끼가 있긴 하다", "첫째는 좀 무뚝뚝하고 둘째가 귀여움", "언니보다 동생이 더 인기 많을 듯", "동생한테 질투하는 거 다 보이네ㅋㅋ", "이 집은 둘째 보려고 들어옴", "오늘 동생 안 나와요? 아쉽네", "엄마랑 있을 때랑 아빠랑 있을 때 표정이 다르네", "애가 누굴 더 좋아하는지 너무 티 남ㅋㅋ", "몇 초만 봐도 집에서 어떻게 지내는지 알 것 같음", "말투 보니까 고집 장난 아닐 듯", "친구들 사이에서도 대장 하려는 스타일 같다", "장난감 양보 안 하는 거 보니 성격 나오네", "밖에서 만나면 좀 피곤할 스타일ㅋㅋ", "귀여운 건 귀여운 거고 버릇은 잡아야 할 듯", "이 정도면 귀여운 게 아니라 혼나야 하는 거 아님?", "엄마 앞에서만 저러는 거겠죠?", "카메라 있는 거 알고 더 저러는 듯ㅋㅋ", "이젠 울면 찍어 주는 거 아는 거 아니냐", "관심 못 받으니까 바로 표정 바뀌네", "애가 벌써 방송을 아네ㅋㅋ", "이 정도면 거의 연기 아님?", "옛날처럼 자연스러운 맛은 없네"];
  const normalizeComment = text => text.replace(/\s+/g, '');
  const nextCommentText = () => {
    const used = new Set(entries.map((entry, i) => normalizeComment(values[i]?.text ?? entry.label)));
    return commentSuggestions.find(text => !used.has(normalizeComment(text))) || commentSuggestions[entries.length % commentSuggestions.length];
  };
  const addEntry = template => {
    const id = entries.length, group = templates[template].cloneNode(true);
    group.removeAttribute('transform'); group.removeAttribute('style');
    group.dataset.order = id;
    scene.insertBefore(group, groups[originalCount - 1]);
    const artwork = group.firstElementChild, image = artwork.querySelector('image');
    const base = entries[template];
    entries.push({ group, artwork, id, template, label: base.label, cx: base.cx, cy: base.cy, opacity: base.opacity });
    defaults.push({ id, dx: 30, dy: 70, scale: 1, opacity: base.opacity, deleted: false, text: nextCommentText() });
  };
  const loadSnapshot = data => {
    entries.splice(originalCount).forEach(e => e.group.remove()); defaults.splice(originalCount);
    data.added.forEach(e => addEntry(e.template)); values = copy(data.comments);
  };
  const snapshot = () => ({ version: 2, comments: values, added: entries.slice(originalCount).map(e => ({ template: e.template })) });
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (valid(saved)) values = saved;
    else if (validSnapshot(saved)) loadSnapshot(saved);
  } catch {}
  // Fill only blank or placeholder comments saved through the editor.
  let filledPending = false;
  values.forEach((value, i) => {
    if (i === originalCount - 1 || value.deleted) return;
    const text = (value.text ?? entries[i].label).trim();
    if (!text || ['새 댓글을 입력해주세요', '댓글내용', '새 댓글'].includes(text)) {
      value.text = nextCommentText(); filledPending = true;
    }
  });
  if (filledPending) { try { localStorage.setItem(key, JSON.stringify(snapshot())); } catch {} }
  const launcher = document.createElement('button'); launcher.type = 'button'; launcher.className = 'comment-editor-launch'; launcher.textContent = '댓글 배치 편집'; launcher.hidden = true; document.body.append(launcher);
  const dialog = document.createElement('dialog'); dialog.className = 'comment-editor-dialog'; dialog.setAttribute('aria-label', '댓글 크기 투명도 위치 편집');
  dialog.innerHTML = `<header><strong>댓글 배치 편집</strong><button data-action="add">댓글 추가</button><button data-action="delete">선택 댓글 삭제</button><button data-action="restore">삭제 취소</button><button data-action="save">저장</button><button data-action="export">파일 내보내기</button><button data-action="import">파일 불러오기</button><button data-action="reset">선택 댓글 초기화</button><button data-action="reset-all">전체 초기화</button><button data-action="close">편집 끝내기</button><input type="file" accept=".json,application/json" hidden></header><div class="comment-editor-settings"><label>댓글 선택 <select aria-label="편집할 댓글"></select></label><label>크기 <input data-field="scale" type="range" min="20" max="300" step="1"><output data-output="scale"></output></label><label>투명도 <input data-field="opacity" type="range" min="0" max="100" step="1"><output data-output="opacity"></output></label><label>가로 이동 <input data-field="dx" type="number" min="-2000" max="2000" step="1"></label><label>세로 이동 <input data-field="dy" type="number" min="-2000" max="2000" step="1"></label></div><label class="comment-editor-text-label">댓글 내용 <textarea data-comment-text maxlength="160" rows="2" placeholder="댓글 내용을 입력하세요"></textarea></label><p>댓글을 드래그해 옮기세요. 목록에서 선택하면 해당 댓글로 이동합니다. 방향키로 미세 이동 · Shift와 함께 누르면 10씩 이동</p><div class="comment-editor-canvas"></div><p class="comment-editor-status" role="status"></p>`;
  document.body.append(dialog);
  const canvas = dialog.querySelector('.comment-editor-canvas'), select = dialog.querySelector('select'), status = dialog.querySelector('.comment-editor-status');
  const preview = document.createElementNS(NS, 'svg'); preview.setAttribute('viewBox', '-180 1300 1360 2450'); preview.classList.add('comment-editor-preview'); preview.setAttribute('aria-label', '댓글 드래그 편집 영역');
  canvas.append(preview);
  const previews = [];
  const rebuildPreviews = () => {
    previews.splice(0).forEach(p => p.group.remove());
    entries.forEach(entry => {
      const group = document.createElementNS(NS, 'g'); group.dataset.commentId = entry.id; group.tabIndex = 0; group.setAttribute('role', 'button');
      const art = entry.artwork.cloneNode(true); group.append(art);
      const box = document.createElementNS(NS, 'rect'); box.classList.add('comment-editor-outline');
      const image = art.querySelector('image'); ['x','y','width','height'].forEach(a => box.setAttribute(a, image.getAttribute(a))); group.append(box); preview.append(group);
      previews.push({ group, art, box });
    });
  };
  rebuildPreviews();
  const textInput = dialog.querySelector('[data-comment-text]');
  const deletedHistory = [];
  const writeText = (art, text) => {
    const node = art.querySelector('text'), image = art.querySelector('image');
    const width = +image.getAttribute('width'), x = node.getAttribute('x');
    const lines = []; let line = '';
    for (const word of text.split(/\s+/)) {
      if (line && (line + ' ' + word).length > 23) { lines.push(line); line = word; }
      else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    const weight = str => [...str].reduce((n, c) => n + (c === ' ' ? .5 : c.charCodeAt(0) < 128 ? .6 : 1), 0);
    const size = Math.min(width * .048, width * .78 / Math.max(1, ...lines.map(weight)), width * .105 / Math.max(1, lines.length));
    node.setAttribute('font-size', size); node.setAttribute('y', +image.getAttribute('y') + +image.getAttribute('height') * .36);
    node.replaceChildren();
    lines.forEach((text, i) => { const span = document.createElementNS(NS, 'tspan'); span.setAttribute('x', x); span.setAttribute('dy', i ? size * 1.15 : 0); span.textContent = text; node.append(span); });
  };
  const fields = Object.fromEntries([...dialog.querySelectorAll('[data-field]')].map(input => [input.dataset.field, input]));
  const transform = (entry, v) => `translate(${v.dx} ${v.dy}) translate(${entry.cx} ${entry.cy}) scale(${v.scale}) translate(${-entry.cx} ${-entry.cy})`;
  const render = () => {
    entries.forEach((entry, i) => {
      const v = values[i], t = transform(entry, v);
      entry.group.dataset.commentDeleted = String(Boolean(v.deleted));
      entry.group.style.display = v.deleted ? 'none' : '';
      previews[i].group.style.display = v.deleted ? 'none' : '';
      if (v.text != null) { writeText(entry.artwork, v.text); writeText(previews[i].art, v.text); }
      else {
        const originalText = templates[entry.template ?? i].querySelector('text');
        entry.artwork.querySelector('text').replaceWith(originalText.cloneNode(true));
        previews[i].art.querySelector('text').replaceWith(originalText.cloneNode(true));
      }
      previews[i].group.setAttribute('aria-label', v.text ?? entry.label);
      entry.artwork.setAttribute('transform', t); entry.artwork.setAttribute('opacity', v.opacity);
      entry.group.dataset.commentOffsetY = v.dy;
      const shift = entry.group.getAttribute('transform')?.match(/translate\(([-\d.]+)/)?.[1] || 0;
      previews[i].group.setAttribute('transform', `translate(${shift} 0) ${t}`);
      previews[i].art.removeAttribute('transform'); previews[i].art.setAttribute('opacity', v.opacity);
      previews[i].group.classList.toggle('is-selected', i === selected);
    });
    if (!values[selected] || values[selected].deleted) selected = values.findIndex(v => !v.deleted);
    select.replaceChildren();
    entries.forEach((e, i) => {
      if (values[i].deleted) return;
      const option = document.createElement('option'); option.value = i; option.textContent = `${i + 1}. ${values[i].text ?? e.label}`; select.append(option);
    });
    Object.values(fields).forEach(input => { input.disabled = selected < 0; });
    textInput.disabled = selected < 0;
    dialog.querySelector('[data-action="delete"]').disabled = selected < 0;
    dialog.querySelector('[data-action="reset"]').disabled = selected < 0;
    dialog.querySelector('[data-action="restore"]').disabled = !deletedHistory.length;
    if (selected < 0) { textInput.value = ''; window.dispatchEvent(new Event('commentlayoutchange')); return; }
    const v = values[selected]; select.value = selected;
    const content = v.text ?? entries[selected].label;
    if (textInput.value !== content) textInput.value = content;
    fields.scale.value = Math.round(v.scale * 100); fields.opacity.value = Math.round(v.opacity * 100);
    fields.dx.value = Math.round(v.dx); fields.dy.value = Math.round(v.dy);
    dialog.querySelector('[data-output="scale"]').textContent = `${Math.round(v.scale * 100)}%`;
    dialog.querySelector('[data-output="opacity"]').textContent = `${Math.round(v.opacity * 100)}%`;
    window.dispatchEvent(new Event('commentlayoutchange'));
  };
  const focusSelected = () => previews[selected]?.group.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  select.addEventListener('change', () => { selected = +select.value; render(); focusSelected(); });
  Object.entries(fields).forEach(([field, input]) => input.addEventListener('input', () => {
    if (!input.value || !Number.isFinite(+input.value)) return;
    values[selected][field] = field === 'scale' ? Math.max(.2, Math.min(3, +input.value / 100)) : field === 'opacity' ? Math.max(0, Math.min(1, +input.value / 100)) : Math.max(-2000, Math.min(2000, +input.value));
    render(); status.textContent = '수정 중 · 저장하면 다음에도 유지됩니다.';
  }));
  textInput.addEventListener('input', () => { if (selected < 0) return; values[selected].text = textInput.value; render(); });
  const coords = event => new DOMPoint(event.clientX, event.clientY).matrixTransform(preview.getScreenCTM().inverse());
  preview.addEventListener('pointerdown', event => {
    const target = event.target.closest('[data-comment-id]'); if (!target || event.button !== 0) return;
    selected = +target.dataset.commentId; drag = { pointer: event.pointerId, start: coords(event), value: copy(values[selected]) };
    preview.setPointerCapture(event.pointerId); event.preventDefault(); render();
  });
  preview.addEventListener('pointermove', event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const p = coords(event); values[selected].dx = Math.max(-2000, Math.min(2000, drag.value.dx + p.x - drag.start.x)); values[selected].dy = Math.max(-2000, Math.min(2000, drag.value.dy + p.y - drag.start.y)); render();
  });
  const finish = event => { if (drag?.pointer === event.pointerId) { drag = null; if (preview.hasPointerCapture(event.pointerId)) preview.releasePointerCapture(event.pointerId); } };
  preview.addEventListener('pointerup', finish); preview.addEventListener('pointercancel', finish);
  preview.addEventListener('focusin', event => { const g = event.target.closest('[data-comment-id]'); if (g) { selected = +g.dataset.commentId; render(); } });
  preview.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const n = event.shiftKey ? 10 : 1;
    const field = ['ArrowLeft','ArrowRight'].includes(event.key) ? 'dx' : 'dy';
    values[selected][field] = Math.max(-2000, Math.min(2000, values[selected][field] + (['ArrowLeft','ArrowUp'].includes(event.key) ? -n : n))); render();
  });
  const save = () => { try { localStorage.setItem(key, JSON.stringify(snapshot())); status.textContent = '저장 완료 · 현재 브라우저에 적용됩니다. 다른 기기에서는 배치 파일을 불러오세요.'; } catch { status.textContent = '브라우저 저장을 사용할 수 없습니다. 배치 파일을 내보내 보관하세요.'; } };
  dialog.querySelector('header').addEventListener('click', event => {
    const action = event.target.dataset.action;
    if (action === 'add') {
      if (entries.length - originalCount >= 200) { status.textContent = '추가 댓글은 최대 200개까지 가능합니다.'; return; }
      const template = selected >= 0 ? (entries[selected].template ?? selected) : 0;
      addEntry(template); selected = entries.length - 1; values.push(copy(defaults[selected])); rebuildPreviews(); render(); focusSelected(); textInput.focus(); textInput.select();
      status.textContent = '새 댓글을 추가했습니다. 내용을 입력하고 위치를 조정하세요.';
    }
    if (action === 'delete' && selected >= 0) {
      deletedHistory.push(selected); values[selected].deleted = true; selected = values.findIndex(v => !v.deleted); render(); status.textContent = '댓글을 삭제했습니다. 삭제 취소로 복원할 수 있습니다.';
    }
    if (action === 'restore' && deletedHistory.length) { selected = deletedHistory.pop(); values[selected].deleted = false; render(); focusSelected(); }
    if (action === 'save') save();
    if (action === 'close') { save(); dialog.close(); }
    if (action === 'reset') { values[selected] = copy(defaults[selected]); render(); }
    if (action === 'reset-all') { values = copy(defaults); selected = 0; deletedHistory.length = 0; render(); }
    if (action === 'export') {
      const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}));
      const link = document.createElement('a'); link.href = url; link.download = 'posted-by-comments.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    }
    if (action === 'import') dialog.querySelector('input[type=file]').click();
  });
  dialog.querySelector('input[type=file]').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try { const data = JSON.parse(await file.text()); if (validSnapshot(data)) loadSnapshot(data); else if (data.version === 1 && valid(data.comments)) loadSnapshot({ added: [], comments: data.comments }); else throw new Error(); selected = 0; deletedHistory.length = 0; rebuildPreviews(); render(); save(); } catch { status.textContent = '이 페이지의 댓글 배치 JSON 파일을 선택해주세요.'; }
    event.target.value = '';
  });
  launcher.addEventListener('click', () => { document.body.classList.add('comment-layout-editing'); dialog.showModal(); render(); focusSelected(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('comment-layout-editing'); launcher.focus({preventScroll:true}); });
  new IntersectionObserver(entries => { launcher.hidden = !entries[0].isIntersecting; }).observe(scene.closest('.sharing-composition'));
  render();
})();
