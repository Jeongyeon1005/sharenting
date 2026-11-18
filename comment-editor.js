// Restore saved comment artwork without changing its scroll animation.
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
  let values = defaults;
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
    const artwork = group.firstElementChild;
    const base = entries[template];
    entries.push({ group, artwork, id, template, label: base.label, cx: base.cx, cy: base.cy, opacity: base.opacity });
  };
  const loadSnapshot = data => {
    data.added.forEach(e => addEntry(e.template));
    values = data.comments;
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
    const size = Math.min(width * .048, width * .78 / Math.max(1, ...lines.map(weight)));
    node.setAttribute('font-size', size); node.setAttribute('y', +image.getAttribute('y') + +image.getAttribute('height') * .36);
    node.replaceChildren();
    lines.forEach((text, i) => { const span = document.createElementNS(NS, 'tspan'); span.setAttribute('x', x); span.setAttribute('dy', i ? size * 1.15 : 0); span.textContent = text; node.append(span); });
  };
  const fitBubble = art => {
    const image = art.querySelector('image');
    const [body, footer] = art.querySelectorAll('text');
    const baseHeight = Number(image.getAttribute('height'));
    const baseFooterY = Number(footer.getAttribute('y'));
    const extraLines = Math.max(0, body.querySelectorAll('tspan').length - 1);
    const extraHeight = extraLines * Number(body.getAttribute('font-size')) * 1.35;
    const height = baseHeight + extraHeight;
    image.setAttribute('height', height);
    if (extraLines) image.setAttribute('preserveAspectRatio', 'none');
    else image.removeAttribute('preserveAspectRatio');
    footer.setAttribute('y', baseFooterY + extraHeight);
  };
  entries.forEach((entry, i) => {
    const value = values[i];
    const { group, artwork, cx, cy } = entry;
    group.dataset.commentDeleted = String(Boolean(value.deleted));
    group.style.display = value.deleted ? 'none' : '';
    group.dataset.commentOffsetY = value.dy;
    if (value.text != null) writeText(artwork, value.text);
    fitBubble(artwork);
    artwork.setAttribute('transform', `translate(${value.dx} ${value.dy}) translate(${cx} ${cy}) scale(${value.scale}) translate(${-cx} ${-cy})`);
    artwork.setAttribute('opacity', value.opacity);
  });
  window.dispatchEvent(new Event('commentlayoutchange'));
})();
