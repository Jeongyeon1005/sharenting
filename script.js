// Play the opening, then settle the same wordmark above the scroll prompt.
(async function playIntro() {
  const screen = document.querySelector('.intro-screen');
  if (!screen) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const pageContent = [...document.body.children].filter(element => element !== screen);
  pageContent.forEach(element => { element.inert = true; });
  try {
    const sources = [...screen.querySelectorAll('image')].map(element => element.getAttribute('href'));
    await Promise.race([
      Promise.all(sources.map(src => new Promise(resolve => {
        const image = new Image();
        image.onload = image.onerror = resolve;
        image.src = src;
      }))),
      wait(1500)
    ]);
    const wordmark = screen.querySelector('.intro-wordmark');
    const entrance = wordmark.animate([
      { opacity: 0, transform: reducedMotion ? 'none' : 'translateY(70px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: reducedMotion ? 160 : 850, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    await entrance.finished;
    wordmark.style.opacity = '1';
    entrance.cancel();
    await wait(reducedMotion ? 80 : 250);
    const icons = [...screen.querySelectorAll('.intro-icons image')];
    for (const [index, icon] of icons.entries()) {
      const duration = reducedMotion ? 100 : 300;
      const previous = icons[index - 1];
      if (previous) {
        const exit = previous.animate([
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: reducedMotion ? 'none' : 'translateY(-85px)' }
        ], { duration, easing: 'ease-in' });
        await exit.finished;
        // Reset and cancel completed effects so earlier icons cannot remain visible.
        previous.style.opacity = '0';
        exit.cancel();
      }
      const enter = icon.animate([
        { opacity: 0, transform: reducedMotion ? 'none' : 'translateY(85px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      await enter.finished;
      icon.style.opacity = '1';
      enter.cancel();
      await wait(reducedMotion ? 100 : index === icons.length - 1 ? 570 : 220);
    }
    // Reveal the background as one continuous shrink begins.
    screen.classList.add('is-revealing');
    if (reducedMotion) await wait(80);
    const destination = document.querySelector('.hero-wordmark');
    if (destination && !reducedMotion) {
      const from = wordmark.getBoundingClientRect();
      const to = destination.getBoundingClientRect();
      // An HTML frame uses viewport pixels consistently, without SVG transform offsets.
      const frame = document.createElement('div');
      Object.assign(frame.style, {
        position: 'fixed',
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`
      });
      screen.append(frame);
      frame.append(wordmark);
      Object.assign(wordmark.style, {
        display: 'block', width: '100%', height: '100%', transform: 'none'
      });
      const settle = frame.animate([
        { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` },
        { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` }
      ], { duration: 800, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards' });
      screen.classList.add('is-settling');
      document.documentElement.classList.add('intro-settling');
      await settle.finished;
    } else {
      screen.classList.add('is-leaving');
      await wait(200);
    }
  } finally {
    clearTimeout(window.introSafetyTimer);
    screen.remove();
    document.documentElement.classList.remove('intro-active', 'intro-settling');
    pageContent.forEach(element => { element.inert = false; });
  }
})();

// One frame queue: collect layout reads before animation callbacks change styles.
const motionCallbacks = new Map();
const motionElements = new Set();
let motionBoundsCache = new Map();
const motionTopCache = new Map();
addEventListener('resize', () => motionTopCache.clear());
function motionStickyTop(element) {
  if (!motionTopCache.has(element)) motionTopCache.set(element, parseFloat(getComputedStyle(element).top) || 0);
  return motionTopCache.get(element);
}
let motionFrameId = 0;
let motionCallbackId = 0;
function motionFrame(callback) {
  const id = ++motionCallbackId;
  motionCallbacks.set(id, callback);
  if (!motionFrameId) motionFrameId = requestAnimationFrame(flushMotionFrame);
  return id;
}
function cancelMotionFrame(id) { motionCallbacks.delete(id); }
function motionBounds(element) {
  motionElements.add(element);
  if (!motionBoundsCache.has(element)) motionBoundsCache.set(element, element.getBoundingClientRect());
  return motionBoundsCache.get(element);
}
function flushMotionFrame(now) {
  motionFrameId = 0;
  motionBoundsCache = new Map();
  motionElements.forEach(element => {
    if (element.isConnected) motionBoundsCache.set(element, element.getBoundingClientRect());
    else motionElements.delete(element);
  });
  const callbacks = [...motionCallbacks.entries()];
  callbacks.forEach(([id]) => motionCallbacks.delete(id));
  callbacks.forEach(([, callback]) => {
    try { callback(now); } catch (error) { reportError(error); }
  });
}

// Fullscreen changes can settle over several frames, especially in Safari.
let storyViewportFrame = 0;
function refreshStoryViewport() {
  cancelAnimationFrame(storyViewportFrame);
  storyViewportFrame = requestAnimationFrame(() => {
    storyViewportFrame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--story-viewport-height', `${innerHeight}px`);
      motionTopCache.clear();
      motionBoundsCache.clear();
      stopPageScroll();
      dispatchEvent(new Event('storyviewportchange'));
    });
  });
}
document.documentElement.style.setProperty('--story-viewport-height', `${innerHeight}px`);
addEventListener('resize', refreshStoryViewport);
document.addEventListener('fullscreenchange', refreshStoryViewport);
document.addEventListener('webkitfullscreenchange', refreshStoryViewport);
window.visualViewport?.addEventListener('resize', refreshStoryViewport);

// Explicit pinning avoids Safari's fullscreen sticky-layer repositioning.
function pinStoryStage(stage, bounds, top) {
  const height = motionBounds(stage).height;
  if (reducedMotion.matches) {
    ['position', 'top', 'left', 'width'].forEach(property => { stage.style[property] = ''; });
    return { height, top };
  }
  const offset = Math.max(0, Math.min(Math.max(0, bounds.height - height), top - bounds.top));
  const pinned = bounds.top <= top && bounds.bottom >= top + height;
  stage.style.position = pinned ? 'fixed' : 'absolute';
  stage.style.top = `${pinned ? top : offset}px`;
  stage.style.left = pinned ? `${bounds.left}px` : '0';
  stage.style.width = `${bounds.width}px`;
  return { height, top };
}

const images = document.querySelectorAll(".image-frame img");

images.forEach((image) => {
  image.addEventListener("error", () => {
    image.closest(".image-frame")?.classList.add("image-missing");
    image.remove();
  }, { once: true });
});

const revealSections = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

  revealSections.forEach((section) => observer.observe(section));
} else {
  revealSections.forEach((section) => section.classList.add("is-visible"));
}


const impact = document.querySelector(".impact");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// One light page-level inertia; nested galleries/dialogs keep their own input behavior.
let pageScrollFrame = 0;
let pageScrollTarget = scrollY;
let pageScrollPosition = scrollY;
let pageScrollLastWritten = scrollY;
let pageScrollTime = 0;
function stopPageScroll() {
  if (pageScrollFrame) cancelMotionFrame(pageScrollFrame);
  pageScrollFrame = 0;
  pageScrollTime = 0;
  pageScrollTarget = pageScrollPosition = pageScrollLastWritten = scrollY;
}
function advancePageScroll(now) {
  pageScrollFrame = 0;
  if (reducedMotion.matches || document.querySelector('dialog[open]')) { stopPageScroll(); return; }
  const elapsed = pageScrollTime ? Math.min(64, now - pageScrollTime) : 16.67;
  pageScrollTime = now;
  const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  pageScrollTarget = Math.max(0, Math.min(maximum, pageScrollTarget));
  pageScrollPosition += (pageScrollTarget - pageScrollPosition) * (1 - Math.exp(-elapsed / 120));
  if (Math.abs(pageScrollTarget - pageScrollPosition) < .5) pageScrollPosition = pageScrollTarget;
  pageScrollLastWritten = pageScrollPosition;
  window.scrollTo({ top: pageScrollPosition, behavior: 'instant' });
  if (pageScrollPosition !== pageScrollTarget) pageScrollFrame = motionFrame(advancePageScroll);
  else pageScrollTime = 0;
}
addEventListener('wheel', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || reducedMotion.matches || document.documentElement.classList.contains('is-following-finale') || document.querySelector('dialog[open]')) return;
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  // Do not take over independently scrollable controls.
  let element = event.target instanceof Element ? event.target : null;
  while (element && element !== document.body && element !== document.documentElement) {
    const overflow = getComputedStyle(element).overflowY;
    if (/(auto|scroll)/.test(overflow) && element.scrollHeight > element.clientHeight + 1) return;
    element = element.parentElement;
  }
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
  const delta = event.deltaY * unit * .75;
  if (!delta) return;
  event.preventDefault();
  if (!pageScrollFrame) pageScrollTarget = pageScrollPosition = pageScrollLastWritten = scrollY;
  pageScrollTarget += delta;
  if (!pageScrollFrame) pageScrollFrame = motionFrame(advancePageScroll);
}, { passive: false });
addEventListener('scroll', () => {
  // Anchors, keyboard input, scrollbar dragging and automatic scenes take precedence.
  if (pageScrollFrame && Math.abs(scrollY - pageScrollLastWritten) > 2) stopPageScroll();
}, { passive: true });
addEventListener('touchstart', stopPageScroll, { passive: true });
addEventListener('pointerdown', stopPageScroll, { passive: true });
addEventListener('keydown', event => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stopPageScroll();
});
reducedMotion.addEventListener('change', stopPageScroll);


if (impact) {
  const revealFinale = () => impact.classList.add("finale-visible");
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const finaleObserver = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        revealFinale();
        finaleObserver.disconnect();
      }
    }, { threshold: 0.12 });
    finaleObserver.observe(impact);
  } else revealFinale();
}

const portraitInteraction = document.querySelector(".post-photo-interaction");
if (portraitInteraction) {
  const section = portraitInteraction.closest(".privacy");
  const panel = section.querySelector(".privacy-analysis");
  const rows = [...panel.querySelectorAll("[data-text]")];
  // Keep label and value styling throughout the typing animation.
  const analysisRows = new Map(rows.map((row) => {
    const label = document.createElement("strong");
    label.className = "analysis-label";
    const value = document.createElement("span");
    value.className = "analysis-value";
    row.replaceChildren(label, value);
    return [row, { label, value, split: row.dataset.text.indexOf(":") + 1 }];
  }));
  const renderAnalysisRow = (row, length, decodedText = null) => {
    const { label, value, split } = analysisRows.get(row);
    const text = decodedText ?? row.dataset.text.slice(0, length);
    label.textContent = text.slice(0, Math.max(0, split - 1));
    value.textContent = text.slice(split).trimStart();
  };
  const analysisHeading = panel.querySelector('h3');
  const headingLines = analysisHeading.innerHTML.split(/<br\s*\/?\s*>/i).map(line => {
    const span = document.createElement('span');
    span.innerHTML = line;
    return { span, text: span.textContent };
  });
  analysisHeading.replaceChildren();
  headingLines.forEach(({ span }, index) => {
    if (index) analysisHeading.append(document.createElement('br'));
    analysisHeading.append(span);
  });
  const codeAlphabet = '01{}[]<>/=$#_abcdefghijklmnopqrstuvwxyz';
  const decodeText = (text, progress) => [...text].map((letter, index) => {
    if (/\s/.test(letter) || index < Math.floor(progress * text.length)) return letter;
    return codeAlphabet[Math.floor(Math.random() * codeAlphabet.length)];
  }).join('');
  const landmarks = section.querySelector(".face-landmarks");
  // Landmark coordinates match the original photo, which keeps its native ratio.
  const contours = [
    [[626,312],[626,356],[639,404],[662,448],[700,480],[748,492],[796,480],[840,450],[870,408],[884,360],[884,312]],
    [[646,303],[670,290],[698,291],[719,302]],
    [[774,296],[800,283],[830,285],[851,297]],
    [[651,326],[675,316],[701,322],[679,333],[651,326]],
    [[782,320],[805,309],[831,314],[809,326],[782,320]],
    [[741,318],[739,343],[730,366],[749,374],[769,362]],
    [[682,396],[712,382],[748,379],[783,376],[815,386],[793,419],[755,436],[716,427],[682,396]],
    [[700,397],[736,399],[773,394],[800,389]],
    [[650,267],[686,249],[731,242],[776,239],[825,253],[859,270]]
  ];
  contours.forEach((points) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", points.map(([x,y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" "));
    landmarks.append(path);
    points.forEach(([x,y]) => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", x);
      dot.setAttribute("cy", y);
      dot.setAttribute("r", "3.2");
      landmarks.append(dot);
    });
  });
  let typingTimer;
  let active = false;
  let pinned = false;
  const codeCanvas = document.createElement('canvas');
  codeCanvas.className = 'privacy-code-field';
  codeCanvas.setAttribute('aria-hidden', 'true');
  document.body.append(codeCanvas);
  const codeContext = codeCanvas.getContext('2d');
  let codeTimer = 0;
  let codeStarted = 0;
  let codeCells = [];
  let codeWidth = 0, codeHeight = 0;
  let codeInView = true;
  const codeTokens = [
    ['function', '#20d7ed'], ['return', '#24c9e5'], ['const', '#56d8e9'],
    ['if', '#19d7ee'], ['else', '#24d9ed'], ['var', '#e4e9eb'],
    ['addEventListener', '#f0f0e9'], ['removeChild', '#e5edf0'], ['resolve', '#10d7a0'],
    ['"readystatechange"', '#10c88a'], ['"object"', '#30dcae'], ['"image"', '#22ce98'],
    ['length', '#edc16a'], ['setTimeout', '#e1b86b'], ['void', '#cc66d6'],
    ['(a,b,c)', '#a2acbd'], ['{ data: ', '#b5bdce'], ['[0] === ', '#b2bfcc'],
    ['.each()', '#ecf2f3'], ['.then(', '#98acbc'], ['readyState', '#8a9bb0'],
    ['});', '#8996ac'], ['return n;', '#37c5de'], ['0, 1, 2', '#20c7de']
  ];
  const makeCode = () => codeTokens[Math.floor(Math.random() * codeTokens.length)];
  const sizeCode = () => {
    codeWidth = innerWidth;
    codeHeight = innerHeight;
    codeCanvas.width = codeWidth;
    codeCanvas.height = codeHeight;
    codeCells = [];
    for (let row = 0, y = 20; y < codeHeight + 28; row++, y += 27) {
      for (let x = -40 + (row % 3) * 17; x < codeWidth + 60;) {
        const token = makeCode();
        const depth = Math.random();
        const size = depth < .2 ? 14 : depth > .8 ? 22 : 18;
        const distance = Math.min(Math.hypot(x, y), Math.hypot(codeWidth - x, y), Math.hypot(x, codeHeight - y), Math.hypot(codeWidth - x, codeHeight - y));
        codeCells.push({ x, y, distance: distance / Math.hypot(codeWidth / 2, codeHeight / 2), token, size, depth, changed: 0 });
        x += token[0].length * size * .61 + 9;
      }
    }
  };
  const drawCode = () => {
    codeTimer = 0;
    if (!active || !codeInView || document.hidden) return;
    const now = performance.now();
    const progress = reducedMotion.matches ? 1 : Math.min(1, (now - codeStarted) / 1500);
    codeContext.clearRect(0, 0, codeWidth, codeHeight);

    codeCells.forEach(cell => {
      const reveal = Math.max(0, Math.min(1, (progress * 1.12 - cell.distance) / .12));
      if (!reveal) return;
      if (!reducedMotion.matches && now - cell.changed > 180 + (Math.abs(cell.x) % 7) * 40) {
        const choices = codeTokens.filter(token => Math.abs(token[0].length - cell.token[0].length) <= 2);
        cell.token = choices[Math.floor(Math.random() * choices.length)];
        cell.changed = now;
      }
      // Keep the center quieter so the photograph and analysis stay legible.
      const center = Math.max(0, 1 - Math.hypot((cell.x - codeWidth / 2) / (codeWidth * .6), (cell.y - codeHeight / 2) / (codeHeight * .6)));
      const edge = Math.max(0, Math.min(1, (Math.abs(cell.x - codeWidth / 2) / codeWidth - .12) / .25));
      const alpha = reveal * (.025 + edge * .6) * (cell.depth < .2 ? .38 : 1);
      codeContext.font = `${cell.depth > .8 ? 600 : 400} ${cell.size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      codeContext.fillStyle = cell.token[1];
      // Cheap defocused echoes add depth without live CSS or canvas blur filters.
      if (cell.depth < .2 || cell.depth > .88) {
        codeContext.globalAlpha = alpha * .16;
        codeContext.fillText(cell.token[0], cell.x - 1.5, cell.y);
        codeContext.fillText(cell.token[0], cell.x + 1.5, cell.y + 1);
      }
      codeContext.globalAlpha = alpha;
      codeContext.fillText(cell.token[0], cell.x, cell.y);
    });
    codeContext.globalAlpha = 1;
    if (!reducedMotion.matches) codeTimer = setTimeout(drawCode, 40);
  };
  const toggleCode = () => {
    clearTimeout(codeTimer);
    codeTimer = 0;
    const show = active && codeInView && !document.hidden;
    codeCanvas.classList.toggle('is-visible', show);
    if (show) {
      sizeCode();
      codeStarted = performance.now();
      drawCode();
    }
  };
  addEventListener('resize', () => { if (active) sizeCode(); });
  document.addEventListener('visibilitychange', toggleCode);
  reducedMotion.addEventListener('change', toggleCode);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    codeInView = entries[0].isIntersecting;
    toggleCode();
  }).observe(section);
  const setAnalysis = (open) => {
    if (active === open) return;
    active = open;
    toggleCode();
    clearTimeout(typingTimer);
    section.classList.toggle("is-analyzing", open);
    portraitInteraction.classList.toggle("is-open", open);
    portraitInteraction.setAttribute("aria-pressed", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    rows.forEach((row) => { renderAnalysisRow(row, 0); row.classList.remove("is-typing"); });
    headingLines.forEach(({ span, text }) => { span.textContent = text; });
    rows.forEach(row => row.classList.remove('is-decoding'));
    if (!open) return;
    if (reducedMotion.matches) {
      rows.forEach((row) => { renderAnalysisRow(row, row.dataset.text.length); });
      return;
    }
    const decodeStarted = performance.now();
    const decode = () => {
      if (!active) return;
      const elapsed = performance.now() - decodeStarted;
      const titleProgress = Math.max(0, Math.min(1, elapsed / 1000));
      headingLines.forEach(({ span, text }) => { span.textContent = decodeText(text, titleProgress); });
      rows.forEach((row, index) => {
        const progress = Math.max(0, Math.min(1, (elapsed - 150 - index * 100) / 950));
        row.classList.toggle('is-decoding', progress < 1);
        renderAnalysisRow(row, row.dataset.text.length, decodeText(row.dataset.text, progress));
      });
      if (elapsed < 1500) typingTimer = setTimeout(decode, 50);
      else {
        headingLines.forEach(({ span, text }) => { span.textContent = text; });
        rows.forEach(row => {
          row.classList.remove('is-decoding');
          renderAnalysisRow(row, row.dataset.text.length);
        });
      }
    };
    decode();
  };
  const figure = portraitInteraction.closest(".social-figure");
  figure.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") setAnalysis(true);
  });
  figure.addEventListener("pointerleave", () => {
    if (!pinned && document.activeElement !== portraitInteraction) setAnalysis(false);
  });
  portraitInteraction.addEventListener("focus", () => setAnalysis(true));
  portraitInteraction.addEventListener("blur", () => {
    if (!pinned && !figure.matches(":hover")) setAnalysis(false);
  });
  const togglePortrait = () => { pinned = !pinned; setAnalysis(pinned); };
  portraitInteraction.addEventListener("click", togglePortrait);
  portraitInteraction.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePortrait();
    }
    if (event.key === "Escape") {
      pinned = false;
      setAnalysis(false);
      portraitInteraction.blur();
    }
  });
}


const rights = document.querySelector(".rights");
if (rights) {
  const regions = [...rights.querySelectorAll(".rights-region")];
  const figures = [...rights.querySelectorAll(".figure-slot")];
  const tracks = [...rights.querySelectorAll(".timeline-track > div")];
  const exploreAction = rights.querySelector(".explore-action");
  const updateHoverEnd = () => {
    if (!exploreAction) return;
    const sectionBounds = rights.getBoundingClientRect();
    const buttonBounds = exploreAction.getBoundingClientRect();
    const inset = Math.max(0, sectionBounds.bottom - (buttonBounds.top + buttonBounds.height / 2));
    rights.style.setProperty("--hover-bottom-inset", `${inset}px`);
  };
  const hoverResizeObserver = new ResizeObserver(updateHoverEnd);
  hoverResizeObserver.observe(rights);
  if (exploreAction) hoverResizeObserver.observe(exploreAction);
  window.addEventListener("resize", updateHoverEnd);
  updateHoverEnd();
  let selectedStage = -1;
  const showStage = (stage) => {
    regions.forEach((region, index) => {
      const active = index === stage;
      region.classList.toggle("is-active", active);
      region.setAttribute("aria-pressed", String(active));
      figures[index].classList.toggle("is-active", active);
      tracks[index].classList.toggle("is-active", active);
    });
  };
  regions.forEach((region, index) => {
    region.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") showStage(index);
    });
    region.addEventListener("pointerleave", () => showStage(selectedStage));
    region.addEventListener("focus", () => showStage(index));
    region.addEventListener("blur", () => showStage(selectedStage));
    region.addEventListener("click", () => {
      selectedStage = selectedStage === index ? -1 : index;
      showStage(selectedStage);
    });
    region.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        selectedStage = -1;
        showStage(-1);
        region.blur();
      }
    });
  });
}


const categoryLabels = {
  privacy: "개인정보 노출", crime: "범죄 악용",
  rights: "아동 권리 침해", footprint: "디지털 발자국과 후유증"
};
const formatCaseDate = (date) => date ? date.split("-").map((part, index) => `${Number(part)}${["년", "월", "일"][index]}`).join(" ") : "날짜 미상";
const sortedCases = [...archiveCases].sort((a, b) => {
  // Partial dates sort at the beginning of their known year/month; unknown dates go last.
  const key = (date) => date ? date.split("-").concat(["01", "01"]).slice(0, 3).join("-") : "9999-12-31";
  return key(a.date).localeCompare(key(b.date));
});
const caseExplorer = document.querySelector(".case-explorer");
if (caseExplorer) {
  const field = caseExplorer.querySelector(".case-field");
  sortedCases.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "case-card";
    card.setAttribute("role", "button");
    card.setAttribute("aria-haspopup", "dialog");
    card.tabIndex = 0;
    card.dataset.categories = item.categories.join(" ");
    card.style.setProperty("--delay", `${Math.min(index * 30, 350)}ms`);
    card.setAttribute("aria-label", item.title);
    const title = document.createElement("h3");
    title.textContent = item.title;
    if (item.image) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "case-thumbnail";
      thumbnail.src = item.image;
      thumbnail.alt = "";
      thumbnail.loading = "lazy";
      card.append(thumbnail);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "case-thumbnail case-thumbnail-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      card.append(placeholder);
    }
    card.append(title);
    field.append(card);
  });
}
if (caseExplorer) {
  const filters = [...caseExplorer.querySelectorAll('.case-filters button')];
  const cards = [...caseExplorer.querySelectorAll('.case-card')];
  const field = caseExplorer.querySelector('.case-field');
  const viewport = document.createElement('div');
  viewport.className = 'case-cylinder case-gallery is-ring';
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-label', '사례 아카이브. 스크롤, 드래그 또는 방향키로 탐색하고 사례를 클릭해 상세 내용을 확인하세요.');
  field.before(viewport);
  viewport.append(field);
  cards.forEach(card => {
    const front = document.createElement('div');
    front.className = 'case-card-front';
    front.append(...card.childNodes);
    card.append(front);
  });
  let visible = [...cards];
  let ringMode = true;
  let rendered = [];
  const wrap = (value, count) => ((value % count) + count) % count;
  const rebuildLoop = () => {
    field.querySelectorAll('[data-loop-copy]').forEach(card => card.remove());
    rendered = [...visible];
    if (!visible.length) return;
    const copies = ringMode ? 1 : Math.max(1, Math.ceil(18 / visible.length));
    for (let cycle = 1; cycle < copies; cycle++) visible.forEach(original => {
      const copy = original.cloneNode(true);
      copy.dataset.loopCopy = 'true';
      copy.tabIndex = -1;
      copy.setAttribute('aria-hidden', 'true');
      copy.addEventListener('click', () => original.click());
      field.append(copy);
      rendered.push(copy);
    });
  };
  rebuildLoop();
  let target = 0, current = 0, frame = 0, previous = 0;
  let pointer = null, suppressClick = false;
  const rearrangeAnimations = new Set();
  const paint = now => {
    frame = 0;
    const elapsed = previous ? Math.min(64, now - previous) : 16.67;
    previous = now;
    current = reducedMotion.matches ? target : current + (target - current) * (1 - Math.exp(-elapsed / 150));
    if (Math.abs(target - current) < .0001) current = target;
    const spacing = innerWidth > 760 ? 155 : 100;
    const radius = Math.min(viewport.clientWidth * .34, 490);
    rendered.forEach((card, index) => {
      if (ringMode) {
        const angle = (index - current) * Math.PI * 2 / rendered.length;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        card.style.visibility = 'visible';
        card.style.pointerEvents = 'auto';
        card.style.zIndex = String(1000 + Math.round(z));
        card.style.opacity = '1';
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, 0, ${z}px) rotateY(${angle * 180 / Math.PI + 90}deg)`;
        return;
      }
      const distance = wrap(index - current + 3, rendered.length) - 3;
      const onScreen = distance > -3 && distance < 13;
      card.style.visibility = onScreen ? 'visible' : 'hidden';
      card.style.pointerEvents = onScreen ? 'auto' : 'none';
      card.style.zIndex = String(1000 - Math.round(distance * 10));
      card.style.opacity = String(Math.max(0, Math.min(1, (distance + 3) / 1.2)));
      card.style.transform = `translate(-50%, -50%) translate3d(${distance * spacing}px, ${-distance * 36}px, ${-distance * 85}px) rotateY(-42deg) rotateX(-10deg) rotateZ(10deg)`;
    });
    caseExplorer.querySelector('.case-status').textContent = `${visible.length ? wrap(Math.round(current), visible.length) + 1 : 0} / ${visible.length}개 사례 · 스크롤하여 탐색`;
    if (current !== target) frame = motionFrame(paint);
    else previous = 0;
  };
  const schedule = () => { if (!frame) frame = motionFrame(paint); };
  const move = amount => {
    if (visible.length) target += amount;
    schedule();
  };
  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    move(Math.max(-250, Math.min(250, delta * unit)) / 230);
  }, { passive: false });
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('a')) return;
    suppressClick = false;
    pointer = { id: event.pointerId, x: event.clientX, startX: event.clientX };
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (Math.abs(event.clientX - pointer.startX) > 7) {
      suppressClick = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    if (suppressClick) move((pointer.x - event.clientX) / 155);
    pointer.x = event.clientX;
  });
  const release = event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    pointer = null;
    viewport.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, true);
  viewport.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = Math.max(0, visible.length - 1);
      else move(['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1);
      schedule();
    }
  });
  cards.forEach(card => card.addEventListener('focus', () => {
    if (card.matches(':focus-visible') && visible.includes(card)) {
      const index = visible.indexOf(card);
      target = index + Math.round((current - index) / visible.length) * visible.length;
      schedule();
    }
  }));
  filters.forEach(button => button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const category = button.dataset.filter;
    ringMode = category === 'all';
    viewport.classList.toggle('is-ring', ringMode);
    rearrangeAnimations.forEach(animation => animation.cancel());
    rearrangeAnimations.clear();
    if (frame) cancelMotionFrame(frame);
    frame = 0;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    visible = cards.filter(card => category === 'all' || card.dataset.categories.split(/\s+/).includes(category));
    cards.forEach(card => {
      const match = visible.includes(card);
      card.hidden = !match;
      card.setAttribute('aria-disabled', String(!match));
      card.tabIndex = match ? 0 : -1;
    });
    target = current = Math.floor(Math.max(0, visible.length - 1) / 2);
    rebuildLoop();
    paint(performance.now());
    const play = (element, keyframes, options, cleanup = () => {}) => {
      const animation = element.animate(keyframes, options);
      rearrangeAnimations.add(animation);
      animation.finished.catch(() => {}).finally(() => {
        rearrangeAnimations.delete(animation);
        cleanup();
      });
    };
    if (!reducedMotion.matches) {
      rendered.forEach((card, index) => {
        const transform = card.style.transform;
        const direction = index % 3;
        const travel = Math.min(innerWidth * .28, 380);
        const x = direction === 1 ? travel : direction === 2 ? -travel : 0;
        const y = direction === 0 ? -200 : -25;
        const opacity = Number(card.style.opacity);
        play(card, [
          { transform: `translate3d(${x}px, ${y}px, 0) ${transform} scale(.9)`, opacity: 0 },
          { transform: `translate3d(${x * .12}px, ${y * .12}px, 0) ${transform} scale(.985)`, opacity: opacity * .65, offset: .55 },
          { transform, opacity }
        ], { duration: 950, delay: index * Math.min(45, 1200 / Math.max(1, rendered.length - 1)), easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'backwards' });
      });
    }
  }));
  addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  new ResizeObserver(schedule).observe(viewport);
  schedule();
}


const exploreButton = document.querySelector(".explore-button");
const casesDialog = document.querySelector(".cases-dialog");
if (exploreButton && caseExplorer && casesDialog) {
  const archiveLink = document.querySelector(".archive-link");
  const openCases = (event) => {
    event.preventDefault();
    if (casesDialog.open) return;
    caseExplorer.hidden = false;
    caseExplorer.classList.remove("is-visible");
    exploreButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("cases-open");
    casesDialog.showModal();
    casesDialog.scrollTop = 0;
    motionFrame(() => {
      motionFrame(() => {
        caseExplorer.classList.add("is-visible");
        caseExplorer.focus({ preventScroll: true });
      });
    });
  };
  exploreButton.addEventListener("click", openCases);
  archiveLink?.addEventListener("click", openCases);
  if (location.hash === '#cases') openCases(new Event('click'));
  let returnTarget = "#footprint";
  casesDialog.querySelectorAll(".site-header a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = link.getAttribute("href");
      if (!target?.startsWith('#')) return;
      event.preventDefault();
      if (target === "#cases") {
        casesDialog.scrollTo({ top: 0, behavior: reducedMotion.matches ? "instant" : "smooth" });
        return;
      }
      returnTarget = target;
      casesDialog.close();
    });
  });
  casesDialog.addEventListener("close", () => {
    document.body.classList.remove("cases-open");
    exploreButton.setAttribute("aria-expanded", "false");
    caseExplorer.classList.remove("is-visible");
    caseExplorer.hidden = true;
    const destination = document.querySelector(returnTarget);
    const heading = destination?.querySelector("h1, h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    destination?.scrollIntoView({ behavior: "instant", block: "start" });
    history.replaceState(null, "", returnTarget);
    returnTarget = "#footprint";
  });
}


const caseDetail = document.querySelector(".case-detail");
if (caseExplorer && caseDetail) {
  caseDetail.querySelector(".case-detail-exit").addEventListener("click", () => caseDetail.close());
  const detailCards = [...caseExplorer.querySelectorAll(".case-card:not([data-loop-copy])")];
  const previousCase = caseDetail.querySelector(".case-detail-prev");
  const nextCase = caseDetail.querySelector(".case-detail-next");
  const position = caseDetail.querySelector(".case-detail-position");
  const availableCards = () => [...caseExplorer.querySelectorAll('.case-card:not([data-loop-copy]):not([aria-disabled="true"])')];
  let activeCard = null;
  const openCase = (card, index) => {
    if (card.getAttribute("aria-disabled") === "true") return;
    activeCard = card;
    const item = sortedCases[index];
    caseDetail.querySelector(".case-detail-id").textContent = `Case. ${String(index + 1).padStart(3, "0")}`;
    caseDetail.querySelector("#case-detail-title").textContent = item.title;
    const imageArea = caseDetail.querySelector(".case-detail-placeholder");
    imageArea.replaceChildren();
    imageArea.setAttribute("aria-label", item.image ? item.title : "사례 이미지 준비 중");
    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = "";
      imageArea.append(image);
    }
    caseDetail.querySelector("#case-detail-description").textContent = item.summary;
    caseDetail.querySelector(".case-detail-categories").textContent = item.categories.map((category) => `#${categoryLabels[category]}`).join("  ");
    caseDetail.querySelector(".case-detail-country").textContent = item.country;
    caseDetail.querySelector(".case-detail-date").textContent = `사건일 / 보도일: ${formatCaseDate(item.date)}`;
    caseDetail.querySelector(".case-detail-age").textContent = item.age;
    const sources = caseDetail.querySelector(".case-detail-sources");
    sources.replaceChildren();
    item.sources.forEach((url) => {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${new URL(url).hostname.replace(/^www\./, "")} · 원문 보기 ↗`;
      row.append(link);
      sources.append(row);
    });
    const available = availableCards();
    const current = available.indexOf(card);
    previousCase.disabled = current <= 0;
    nextCase.disabled = current >= available.length - 1;
    const selected = caseExplorer.querySelector('.case-filters button[aria-pressed="true"]');
    position.textContent = `${selected?.textContent || "모든 사례"} · ${current + 1} / ${available.length}`;
    if (!caseDetail.open) caseDetail.showModal();
    caseDetail.scrollTop = 0;
  };
  const moveCase = (direction) => {
    const available = availableCards();
    const card = available[available.indexOf(activeCard) + direction];
    if (card) openCase(card, detailCards.indexOf(card));
  };
  previousCase.addEventListener("click", () => moveCase(-1));
  nextCase.addEventListener("click", () => moveCase(1));
  caseDetail.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveCase(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  detailCards.forEach((card, index) => {
    card.addEventListener("click", () => openCase(card, index));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCase(card, index);
      }
    });
  });
  caseDetail.addEventListener("click", (event) => {
    const bounds = caseDetail.getBoundingClientRect();
    if (event.target === caseDetail && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) caseDetail.close();
  });
  caseDetail.addEventListener("close", () => activeCard?.focus({ preventScroll: true }));
}

// Keep the final archive action available without interrupting scrolling.
const finalExplore = document.querySelector(".final-explore");
if (finalExplore) finalExplore.classList.add("is-formed");

const storyCarousel = document.querySelector(".story-carousel");
if (storyCarousel) {
  const viewport = storyCarousel.querySelector(".story-viewport");
  const slides = [...viewport.querySelectorAll(".story-slide")];
  const dots = [...storyCarousel.querySelectorAll(".story-dots button")];
  const status = storyCarousel.querySelector(".story-status");
  let current = 0;
  const goToStory = (index) => {
    current = (index + slides.length) % slides.length;
    viewport.scrollTo({
      left: current * viewport.clientWidth,
      behavior: reducedMotion.matches ? "instant" : "smooth"
    });
  };
  dots.forEach((dot, index) => dot.addEventListener("click", () => goToStory(index)));
  storyCarousel.querySelector(".story-prev").addEventListener("click", () => goToStory(current - 1));
  storyCarousel.querySelector(".story-next").addEventListener("click", () => goToStory(current + 1));
  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goToStory(current + (event.key === "ArrowRight" ? 1 : -1));
  });
  viewport.addEventListener("scroll", () => {
    const visible = Math.round(viewport.scrollLeft / viewport.clientWidth);
    dots.forEach((dot, index) => {
      if (index === visible) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    current = visible;
    status.textContent = `${visible + 1} / ${slides.length}`;
  }, { passive: true });
  window.addEventListener("resize", () => {
    viewport.scrollTo({ left: current * viewport.clientWidth, behavior: "instant" });
  });
}


// Pin the opening scene until its network finishes, then follow the lower routes.
const sharingComposition = document.querySelector('.sharing-composition');
if (sharingComposition) {
  const viewport = sharingComposition.querySelector('.sharing-viewport');
  const camera = sharingComposition.querySelector('.sharing-camera');
  const scene = sharingComposition.querySelector('.sharing-scene');
  // Keep the detailed, static crowd outside the SVG that repaints its lines.
  const crowdSource = scene.querySelector('.sharing-crowd');
  const crowdLayer = document.createElement('img');
  crowdLayer.className = 'sharing-crowd-layer';
  crowdLayer.src = crowdSource.getAttribute('href');
  crowdLayer.alt = '';
  crowdLayer.setAttribute('aria-hidden', 'true');
  camera.prepend(crowdLayer);
  crowdSource.remove();
  const scrollLines = [...sharingComposition.querySelectorAll('.sharing-scroll-line')];
  const svgNS = 'http://www.w3.org/2000/svg';
  // Extra upward routes keep the original phone connections intact.
  const burstGroup = document.createElementNS(svgNS, 'g');
  burstGroup.setAttribute('class', 'sharing-upward-lines');
  scene.querySelector('.sharing-connections').prepend(burstGroup);
  const upwardSources = [{ x: 539, y: 480 }, ...scrollLines.slice(0, 24).map(line => {
    const point = line.getPointAtLength(line.getTotalLength());
    return { x: point.x, y: point.y };
  })];
  const upwardLines = Array.from({ length: 48 }, (_, index) => {
    const source = upwardSources[index % 3 === 0 ? 0 : 1 + (index * 7) % 24];
    const endX = -160 + (index * 173 % 1320);
    const endY = -140 + (index * 47 % 270);
    const bendX = source.x + (endX - source.x) * .28 + ((index % 5) - 2) * 70;
    const line = document.createElementNS(svgNS, 'path');
    line.setAttribute('d', `M${source.x} ${source.y} C${source.x} ${source.y - 120} ${bendX} ${endY + 40} ${endX} ${endY}`);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', ['#ff39c8', '#ef65c0', '#fa21c4', '#ba4ba4'][index % 4]);
    line.setAttribute('stroke-width', String(.65 + (index % 4) * .35));
    line.setAttribute('pathLength', '1');
    line.style.strokeDasharray = '1';
    line.style.strokeDashoffset = '1';
    line.style.opacity = '0';
    burstGroup.append(line);
    return { line, start: .06 + (index * 11 % 25) / 100,
      duration: .30 + (index * 13 % 35) / 100, opacity: .32 + (index % 5) * .13 };
  });
  const lightDefs = document.createElementNS(svgNS, 'defs');
  lightDefs.innerHTML = '<radialGradient id="sharing-line-light"><stop offset="0" stop-color="#fff5fe" stop-opacity="1"/><stop offset=".18" stop-color="#ffd4f5" stop-opacity=".9"/><stop offset=".45" stop-color="#ff62d4" stop-opacity=".5"/><stop offset="1" stop-color="#ff62d4" stop-opacity="0"/></radialGradient>';
  scene.prepend(lightDefs);
  const lineLights = scrollLines.map((line, index) => {
    const halo = line.cloneNode(false);
    halo.classList.remove('sharing-scroll-line');
    halo.classList.add('sharing-line-halo');
    halo.setAttribute('stroke', '#f961d0');
    halo.setAttribute('stroke-width', Number(line.getAttribute('stroke-width')) + 4);
    halo.style.opacity = '0';
    line.before(halo);
    let head = null;
    if (index % 4 === 0 || index >= 24) {
      head = document.createElementNS(svgNS, 'circle');
      head.setAttribute('r', '8');
      head.setAttribute('fill', 'url(#sharing-line-light)');
      head.style.opacity = '0';
      line.parentNode.append(head);
    }
    let samples = null;
    if (head && index < 24) {
      const length = line.getTotalLength();
      samples = Array.from({ length: 97 }, (_, i) => line.getPointAtLength(length * i / 96));
    }
    return { halo, head, samples, curve: null };
  });

  const people = [...sharingComposition.querySelectorAll('.sharing-person-reveal')].map(group => {
    const image = group.querySelector('image');
    const x = Number(image.getAttribute('x'));
    const y = Number(image.getAttribute('y'));
    const height = Number(image.getAttribute('height'));
    const width = Number(image.getAttribute('width'));
    const mirrored = image.hasAttribute('transform');
    return { group, y, reveal: 0, phoneX: mirrored ? x + width - 52 * height / 162 : x + 52 * height / 162,
      phoneY: y + 38 * height / 162 };
  });
  const comments = [...sharingComposition.querySelectorAll('.sharing-chat-reveal')].map(group => {
    const bubble = group.querySelector('image');
    const centerX = Number(bubble.getAttribute('x')) + Number(bubble.getAttribute('width')) / 2;
    return { group, centerX, width: Number(bubble.getAttribute('width')), shiftX: 0, y: Number(group.dataset.y), order: Number(group.dataset.order), reveal: 0 };
  });
  const clamp = value => Math.max(0, Math.min(1, value));
  sharingComposition.classList.add('has-scroll-lines');
  let sharingFrame = 0;
  let hasSharingScroll = false;
  let smoothDistance = null;
  let previousFrameTime = 0;
  let viewHeight = 1;
  let panDistance = 0;
  let holdDistance = 1;
  let travelDistance = 1;
  let completionPause = 1;
  let sceneScale = 1;
  const measureSharing = () => {
    const wide = innerWidth > 760;
    scene.setAttribute('viewBox', wide ? '-180 0 1360 4200' : '0 0 1000 4200');
    const commentCanvas = scene.viewBox.baseVal;
    comments.forEach(comment => {
      const halfWidth = comment.width / 2;
      const spreadCenter = 500 + (comment.centerX - 500) * (wide ? 1.65 : 1.2);
      const center = Math.max(commentCanvas.x + halfWidth + 24,
        Math.min(commentCanvas.x + commentCanvas.width - halfWidth - 24, spreadCenter));
      comment.shiftX = center - comment.centerX;
      comment.lastProgress = null;
    });
    const headerHeight = document.querySelector('body > .site-header')?.getBoundingClientRect().height || 0;
    viewHeight = Math.max(200, innerHeight - headerHeight);
    sharingComposition.style.setProperty('--sharing-top', `${headerHeight}px`);
    sharingComposition.style.setProperty('--sharing-height', `${viewHeight}px`);
    panDistance = Math.max(0, scene.getBoundingClientRect().height - viewHeight);
    sceneScale = scene.getBoundingClientRect().width / scene.viewBox.baseVal.width;
    const canvas = scene.viewBox.baseVal;
    crowdLayer.style.left = `${-canvas.x / canvas.width * 100}%`;
    crowdLayer.style.width = `${1000 / canvas.width * 100}%`;
    // The original SVG <image> used xMidYMid meet inside a taller image box.
    crowdLayer.style.top = `${(240 + (665.1227 - 1000 * 58 / 131) / 2) * sceneScale}px`;
    holdDistance = viewHeight * 1.5;
    completionPause = viewHeight * .2;
    travelDistance = Math.max(viewHeight * 1.8, panDistance * 1.5);
    sharingComposition.style.height = reducedMotion.matches ? 'auto' : `${viewHeight + holdDistance + completionPause + travelDistance}px`;
    if (sharingFrame) cancelMotionFrame(sharingFrame);
    sharingFrame = 0;
    previousFrameTime = 0;
    smoothDistance = null;
    scheduleSharingLines();
  };
  const updateSharingLines = (timestamp) => {
    sharingFrame = 0;
    const bounds = motionBounds(sharingComposition);
    const headerHeight = parseFloat(sharingComposition.style.getPropertyValue('--sharing-top')) || 0;
    // Use matching fixed/absolute coordinates at both boundaries. Returning
    // from fixed to sticky made Safari reposition the final comment frame.
    const stageTravel = Math.max(0, bounds.height - viewHeight);
    const stageOffset = Math.max(0, Math.min(stageTravel, headerHeight - bounds.top));
    const pinned = !reducedMotion.matches && bounds.top <= headerHeight
      && bounds.bottom >= headerHeight + viewHeight;
    if (reducedMotion.matches) {
      viewport.style.position = '';
      viewport.style.top = '';
      viewport.style.left = '';
      viewport.style.width = '';
    } else {
      viewport.style.position = pinned ? 'fixed' : 'absolute';
      viewport.style.top = `${pinned ? headerHeight : stageOffset}px`;
      viewport.style.left = pinned ? `${bounds.left}px` : '0';
      viewport.style.width = pinned ? `${bounds.width}px` : '100%';
    }
    if (bounds.bottom < 0 || bounds.top > innerHeight) { previousFrameTime = 0; return; }
    const targetDistance = hasSharingScroll ? Math.max(0, Math.min(holdDistance + completionPause + travelDistance, headerHeight - bounds.top)) : 0;
    const elapsed = previousFrameTime ? Math.min(64, timestamp - previousFrameTime) : 16.67;
    previousFrameTime = timestamp;
    // Time-based easing stays consistent across trackpads, mouse wheels and refresh rates.
    smoothDistance = targetDistance;
    const distance = smoothDistance;
    const openingProgress = clamp(distance / holdDistance);
    const followingProgress = clamp((distance - holdDistance - completionPause) / travelDistance);
    const scale = sceneScale;
    // Finish every person-to-person route before entering the comment scene.
    const routesProgress = clamp(followingProgress / .42);
    const commentsProgress = clamp((followingProgress - .50) / .50);
    const lastPhone = people[people.length - 1];
    const routesPanDistance = Math.min(panDistance, Math.max(0, lastPhone.phoneY * scale - viewHeight * .58));
    // Reach the final phone early, then hold the camera while the last line finishes.
    const openingComplete = openingProgress >= 1;
    const cameraPan = openingComplete
      ? clamp(routesProgress / .84) * routesPanDistance
        + commentsProgress * (panDistance - routesPanDistance)
      : 0;
    // Use the same progress calculation as the final phone-to-phone line.
    const finalRouteIndex = Math.max(0, scrollLines.length - 25);
    const finalRouteProgress = clamp((routesProgress - finalRouteIndex * .22) / .25);
    const commentsReady = hasSharingScroll && finalRouteProgress >= 1 && commentsProgress > 0;
    const anchors = [{ x: 539, y: 480 }];
    let peopleSettling = false;
    people.forEach(person => {
      const screenY = person.y * scale - cameraPan;
      const entrance = clamp(followingProgress / .08);
      const scrollReveal = entrance * entrance * (3 - 2 * entrance);
      const targetReveal = reducedMotion.matches ? 1 : scrollReveal * clamp((viewHeight * 1.05 - screenY) / (viewHeight * .48));
      if (reducedMotion.matches) person.reveal = 1;
      else person.reveal = targetReveal;
      if (Math.abs(targetReveal - person.reveal) < .0005) person.reveal = targetReveal;
      else peopleSettling = true;
      const reveal = person.reveal;
      // Float upward quickly at first, then settle softly; fade over a longer interval.
      const eased = 1 - Math.pow(1 - reveal, 3);
      const rise = Math.round((1 - eased) * 30000) / 100;
      const opacity = String(reveal * reveal * (3 - 2 * reveal));
      if (person.lastOpacity !== opacity) {
        person.group.style.opacity = opacity;
        person.lastOpacity = opacity;
      }
      if (person.lastRise !== rise) {
        person.group.setAttribute('transform', `translate(0 ${rise})`);
        person.lastRise = rise;
      }
      anchors.push({ x: person.phoneX, y: person.phoneY + rise });
    });
    let commentsSettling = false;
    const completion = clamp((commentsProgress - .65) / .35);
    const completionReveal = completion * completion * (3 - 2 * completion);
    comments.forEach(comment => {
      const screenY = comment.y * scale - cameraPan;
      const stagger = (comment.order % 4) * .025;
      const revealStart = .04 + comment.order / Math.max(1, comments.length - 1) * .5;
      const timelineReveal = clamp((commentsProgress - revealStart) / .4);
      const viewportReveal = Math.max(completionReveal,
        clamp((viewHeight * (1.02 - stagger) - screenY) / (viewHeight * .5)));
      const target = reducedMotion.matches ? 1
        : commentsReady ? Math.min(timelineReveal, viewportReveal) : 0;
      if (reducedMotion.matches) comment.reveal = 1;
      else comment.reveal = target;
      if (Math.abs(target - comment.reveal) < .003) comment.reveal = target;
      else commentsSettling = true;
      const progress = comment.reveal;
      if (comment.lastProgress === progress) return;
      comment.lastProgress = progress;
      const float = 1 - Math.pow(1 - progress, 3);
      comment.group.style.opacity = String(progress * progress * (3 - 2 * progress));
      comment.group.setAttribute('transform', `translate(${comment.shiftX} ${(1 - float) * 90})`);
    });
    // Anchor each route to the actual phone, including mirrored figures and their entrance motion.
    scrollLines.slice(24).forEach((line, index) => {
      const from = anchors[index];
      const to = anchors[index + 1];
      const curveY = Math.min(from.y, to.y) - 95;
      const light = lineLights[index + 24];
      const d = `M${from.x} ${from.y} C${from.x} ${curveY} ${to.x} ${curveY} ${to.x} ${to.y}`;
      if (light.d !== d) {
        line.setAttribute('d', d);
        light.halo.setAttribute('d', d);
        light.d = d;
        // Sample equal parameter steps, then use cumulative length to locate the head.
        const curve = [from, { x: from.x, y: curveY }, { x: to.x, y: curveY }, to];
        let total = 0;
        light.arcSamples = Array.from({ length: 65 }, (_, i) => {
          const t = i / 64, u = 1 - t;
          const [a, b, c, d] = curve;
          return { x: u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x,
            y: u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y, length: 0 };
        });
        light.arcSamples.forEach((point, i, samples) => {
          if (i) total += Math.hypot(point.x - samples[i-1].x, point.y - samples[i-1].y);
          point.length = total;
        });
        light.arcLength = total;
      }
    });
    upwardLines.forEach(({ line, start, duration, opacity }) => {
      const progress = reducedMotion.matches ? 1
        : hasSharingScroll ? clamp((openingProgress - start) / duration) : 0;
      line.style.strokeDashoffset = String(1 - progress);
      line.style.opacity = progress > 0 ? String(opacity) : '0';
    });
    scrollLines.forEach((line, index) => {
      const progress = index < 24
        ? clamp((openingProgress - (index * 7 % 23) / 100) / (.36 + (index * 13 % 37) / 100))
        : clamp((routesProgress - (index - 24) * .22) / .25);
      const visibleProgress = !hasSharingScroll ? 0 : reducedMotion.matches ? 1 : progress;
      const light = lineLights[index];
      const offset = (1 - visibleProgress).toFixed(4);
      if (light.offset !== offset) {
        line.style.strokeDashoffset = offset;
        light.halo.style.strokeDashoffset = offset;
        line.style.opacity = visibleProgress > 0 ? '1' : '0';
        light.halo.style.opacity = visibleProgress > 0 ? '.2' : '0';
        light.offset = offset;
      }
      if (light.head) {
        const moving = visibleProgress > 0 && visibleProgress < 1 && !reducedMotion.matches;
        light.head.style.opacity = moving ? String(Math.min(1, visibleProgress * 8, (1 - visibleProgress) * 8)) : '0';
        if (moving) {
          let position;
          if (light.samples) {
            const sample = visibleProgress * 96;
            const i = Math.min(95, Math.floor(sample));
            const fraction = sample - i;
            const a = light.samples[i], b = light.samples[i + 1];
            position = { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
          } else {
            const length = light.arcLength * visibleProgress;
            const samples = light.arcSamples;
            let low = 0, high = samples.length - 1;
            while (high - low > 1) {
              const middle = (low + high) >> 1;
              if (samples[middle].length < length) low = middle;
              else high = middle;
            }
            const a = samples[low], b = samples[high];
            const fraction = (length - a.length) / Math.max(.0001, b.length - a.length);
            position = { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
          }
          light.head.setAttribute('cx', position.x);
          light.head.setAttribute('cy', position.y);
        }
      }

    });
    const cameraTransform = reducedMotion.matches ? 'none' : `translate3d(0, ${-cameraPan}px, 0)`;
    if (camera.style.transform !== cameraTransform) camera.style.transform = cameraTransform;
    if ((Math.abs(targetDistance - smoothDistance) > .05 || peopleSettling || commentsSettling) && !reducedMotion.matches) {
      sharingFrame = motionFrame(updateSharingLines);
    } else previousFrameTime = 0;
  };
  const scheduleSharingLines = () => {
    if (!sharingFrame) sharingFrame = motionFrame(updateSharingLines);
  };
  addEventListener('scroll', () => {
    hasSharingScroll = true;
    scheduleSharingLines();
  }, { passive: true });
  addEventListener('resize', measureSharing);
  reducedMotion.addEventListener('change', measureSharing);
  measureSharing();
}

// The centered final network is drawn only by the user's scroll position.
const finaleDiagram = document.querySelector('.impact-finale');
if (finaleDiagram) {
  const map = finaleDiagram.querySelector('.finale-detail-map');
  const mapRunway = document.createElement('div');
  mapRunway.className = 'finale-map-runway';
  map.before(mapRunway);
  const mapStage = document.createElement('div');
  mapStage.className = 'finale-map-stage';
  mapRunway.append(mapStage);
  mapStage.append(finaleDiagram.querySelector('.finale-photo'), map);
  map.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  const primary = [...map.querySelectorAll('.map-primary')];
  const branches = [...map.querySelectorAll('.map-linework path:not(.map-primary)')];
  const titles = [...map.querySelectorAll('.map-category')];
  const details = [...map.querySelectorAll('.map-detail')];
  const threadSvg = finaleDiagram.querySelector('.finale-threads');
  const threads = [...threadSvg.querySelectorAll('path')];
  let followSamples = [];
  const alignThreads = () => {
    const mapBounds = map.getBoundingClientRect();
    if (!mapBounds.width || !mapBounds.height) return;
    const scale = Math.min(mapBounds.width / 1240, mapBounds.height / 480);
    // Remove the empty space beneath the diagram's SVG artwork.
    threadSvg.style.marginTop = `${-(mapBounds.height - 470 * scale)}px`;
    const bounds = threadSvg.getBoundingClientRect();
    const labels = [[240, 345], [455, 410], [755, 445], [1085, 330]];
    const insetX = (mapBounds.width - 1240 * scale) / 2;
    labels.forEach(([x, y], index) => {
      const startX = (mapBounds.left - bounds.left + insetX + x * scale) / bounds.width * 1240;
      const startY = (y + 16 - 470) * scale / bounds.height * 1040;
      threads[index].setAttribute('d', `M${startX} ${startY} C${startX} ${startY + 420} 620 440 620 650 L620 1040`);
    });
    const length = threads[0].getTotalLength();
    followSamples = Array.from({ length: 129 }, (_, i) => threads[0].getPointAtLength(length * i / 128));
  };
  alignThreads();
  addEventListener('resize', alignThreads);
  addEventListener('load', alignThreads, { once: true });
  document.fonts.ready.then(alignThreads);
  const button = finaleDiagram.querySelector('.explore-button');
  const border = button.querySelector('.explore-draw-border path');
  const label = button.querySelector('span');
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  finaleDiagram.classList.add('has-diagram-motion');
  [...primary, ...branches, ...threads, border].forEach(path => {
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1';
  });
  let frame = 0;
  let smoothMapProgress = null;
  let previousTime = 0;
  let autoStarted = false;
  let autoProgress = null;
  let autoButtonProgress = 0;
  let buttonFlashed = false;
  let cancelThreadFollow = null;
  const followThreads = () => {
    stopPageScroll();
    autoStarted = true;
    document.documentElement.classList.add('is-following-finale');
    const stop = event => event.preventDefault();
    const keys = event => {
      if (event.key === 'Escape') { cancelled = true; release(); }
      else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) event.preventDefault();
    };
    let cancelled = false;
    const release = () => {
      document.documentElement.classList.remove('is-following-finale');
      removeEventListener('wheel', stop);
      removeEventListener('touchmove', stop);
      removeEventListener('keydown', keys);
    };
    cancelThreadFollow = () => {
      cancelled = true;
      release();
      // A viewport change must not restart playback or pull the reader back down.
      autoProgress = 1;
      autoButtonProgress = 1;
      cancelThreadFollow = null;
    };
    addEventListener('wheel', stop, { passive: false });
    addEventListener('touchmove', stop, { passive: false });
    addEventListener('keydown', keys);
    let started;
    let previous;
    let cameraScroll = scrollY;
    const step = now => {
      if (cancelled) return;
      if (started === undefined) started = now;
      const elapsed = now - started;
      autoProgress = ease(elapsed / 3000);
      autoButtonProgress = clamp((elapsed - 3000) / 600);
      const sample = autoProgress * 128;
      const index = Math.min(127, Math.floor(sample));
      const fraction = sample - index;
      const a = followSamples[index], b = followSamples[index + 1];
      const threadBounds = motionBounds(threadSvg);
      const viewBox = threadSvg.viewBox.baseVal;
      const head = { y: threadBounds.top + (a.y + (b.y - a.y) * fraction - viewBox.y) / viewBox.height * threadBounds.height };
      const buttonBounds = motionBounds(button);
      const focusY = elapsed < 3000 ? head.y : buttonBounds.top + buttonBounds.height / 2;
      const delta = previous ? Math.min(64, now - previous) : 16.67;
      previous = now;
      const target = Math.max(scrollY, scrollY + focusY - innerHeight * .6);
      cameraScroll += (target - cameraScroll) * (1 - Math.exp(-delta / 180));
      window.scrollTo({ top: cameraScroll, behavior: 'instant' });
      schedule();
      if (elapsed < 3900) motionFrame(step);
      else { release(); cancelThreadFollow = null; }
    };
    motionFrame(step);
  };
  const update = now => {
    frame = 0;
    const threadBounds = motionBounds(threadSvg);
    const runwayBounds = motionBounds(mapRunway);
    const stickyTop = (document.querySelector('body > .site-header')?.getBoundingClientRect().height || 64) + 16;
    const stageGeometry = pinStoryStage(mapStage, runwayBounds, stickyTop);
    if (runwayBounds.top > innerHeight) { previousTime = 0; return; }
    const mapRange = Math.max(1, runwayBounds.height - stageGeometry.height);
    const targetMapProgress = reducedMotion.matches ? 1 : clamp((stickyTop - runwayBounds.top) / (mapRange * .92));
    const elapsed = previousTime ? Math.min(64, now - previousTime) : 16.67;
    previousTime = now;
    smoothMapProgress = targetMapProgress;
    const mapProgress = smoothMapProgress;
    const endingBounds = motionBounds(button);
    if (!autoStarted && !reducedMotion.matches && mapProgress >= .95
      && threadBounds.top < innerHeight * .85 && endingBounds.top > innerHeight * .95) followThreads();
    // Scrolling directly to the ending must reveal its label even if playback is skipped.
    const manualEndingProgress = clamp((innerHeight * .95 - endingBounds.top) / (innerHeight * .25));
    // Use one ordered sequence: the connector reaches the button before its outline starts.
    // Camera-follow scrolling must not advance the manual reveal ahead of playback.
    const threadProgress = reducedMotion.matches ? 1
      : autoProgress !== null ? autoProgress : clamp(manualEndingProgress / .8);
    primary.forEach(path => { path.style.strokeDashoffset = String(1 - clamp(mapProgress / .32)); });
    branches.forEach((path, index) => {
      path.style.strokeDashoffset = String(1 - clamp((mapProgress - .44 - (index % 5) * .02) / .26));
    });
    titles.forEach(element => { element.style.opacity = String(ease((mapProgress - .33) / .10)); });
    details.forEach(element => { element.style.opacity = String(ease((mapProgress - .79) / .15)); });
    threads.forEach(path => { path.style.strokeDashoffset = String(1 - threadProgress); });
    const buttonProgress = reducedMotion.matches ? 1 : threadProgress < 1 ? 0
      : autoProgress !== null ? autoButtonProgress : clamp((manualEndingProgress - .8) / .2);
    border.style.strokeDashoffset = String(1 - buttonProgress);
    label.style.opacity = String(ease((buttonProgress - .85) / .15));
    button.style.visibility = threadProgress > 0 || reducedMotion.matches ? 'visible' : 'hidden';
    button.disabled = buttonProgress < 1;
    if (buttonProgress === 1 && !buttonFlashed && !reducedMotion.matches) {
      buttonFlashed = true;
      const pink = getComputedStyle(button).getPropertyValue('--accent').trim() || '#ef65c0';
      button.animate([
        { backgroundColor: 'transparent', color: '#eee' },
        { backgroundColor: pink, color: '#1d191b', offset: .2 },
        { backgroundColor: pink, color: '#1d191b', offset: .55 },
        { backgroundColor: 'transparent', color: '#eee' }
      ], { duration: 1100, easing: 'ease-in-out' });
      border.animate([
        { stroke: '#aaa4a7' }, { stroke: pink, offset: .2 },
        { stroke: pink, offset: .55 }, { stroke: '#aaa4a7' }
      ], { duration: 1100, easing: 'ease-in-out' });
    }
    if (smoothMapProgress !== targetMapProgress) frame = motionFrame(update);
    else previousTime = 0;
  };
  const schedule = () => { if (!frame) frame = motionFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule, { once: true });
  addEventListener('storyviewportchange', () => {
    cancelThreadFollow?.();
    alignThreads();
    schedule();
  });
  const finaleResizeObserver = new ResizeObserver(() => { alignThreads(); schedule(); });
  finaleResizeObserver.observe(map);
  finaleResizeObserver.observe(threadSvg);
  reducedMotion.addEventListener('change', schedule);
  schedule();
}

// Drag a selection rectangle, then move selected photos together like desktop icons.
const photoDesktop = document.querySelector('.creative-monitor');
if (photoDesktop) {
  const computerSection = photoDesktop.closest('.creative-interface');
  const computerFrame = document.createElement('div');
  computerFrame.className = 'computer-scene-frame';
  photoDesktop.before(computerFrame);
  computerFrame.append(photoDesktop);
  const audience = document.createElement('div');
  audience.className = 'computer-audience';
  audience.setAttribute('aria-hidden', 'true');
  audience.innerHTML = '<span class="computer-person"></span>';
  computerSection.append(audience);
  const beam = document.createElement('div');
  beam.className = 'computer-projection';
  beam.setAttribute('aria-hidden', 'true');
  computerSection.append(beam);
  const projectedCases = document.createElement('div');
  projectedCases.className = 'computer-projected-cases';
  projectedCases.setAttribute('aria-label', '사진을 악용한 AI 합성 피해 사례');
  projectedCases.hidden = true;
  const projectionItems = archiveCases.filter(item => item.title.includes('AI 성착취')).slice(0, 3);
  while (projectionItems.length < 3) projectionItems.push({ title: '딥페이크 사례 · 준비 중', summary: '사례 이미지와 내용을 추가할 예정입니다.', sources: [] });
  projectionItems.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'computer-projected-case';
    card.tabIndex = 0;
    card.setAttribute('aria-label', item.title);
    const placeholder = document.createElement('div');
    placeholder.className = 'computer-case-placeholder';
    placeholder.textContent = `사례 0${index + 1}`;
    const copy = document.createElement('div');
    copy.className = 'computer-case-copy';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const summary = document.createElement('p');
    summary.textContent = item.summary;
    const source = document.createElement('a');
    source.textContent = '출처 보기 ↗';
    if (item.sources[0]) source.href = item.sources[0];
    else source.hidden = true;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    copy.append(title, summary, source);
    card.append(placeholder, copy);
    card.addEventListener('click', event => {
      if (!event.target.closest('a')) card.classList.toggle('is-open');
    });
    projectedCases.append(card);
  });
  computerSection.append(projectedCases);
  let projectionComplete = false;
  let projectionScrollOrigin = 0;
  let projectionFrame = 0;
  let projectionX = 0;
  let projectionTime = 0;
  const moveProjection = now => {
    projectionFrame = 0;
    const target = reducedMotion.matches ? 0 : Math.min(innerWidth * .85, Math.max(0, projectionScrollOrigin - scrollY) * .8);
    const elapsed = projectionTime ? Math.min(64, now - projectionTime) : 16.67;
    projectionTime = now;
    projectionX = reducedMotion.matches ? target
      : projectionX + (target - projectionX) * (1 - Math.exp(-elapsed / 85));
    if (Math.abs(target - projectionX) < .05) projectionX = target;
    const shift = `${projectionX.toFixed(3)}px`;
    if (computerSection.style.getPropertyValue('--projection-shift') !== shift) {
      computerSection.style.setProperty('--projection-shift', shift);
    }
    if (projectionX !== target) projectionFrame = motionFrame(moveProjection);
    else projectionTime = 0;
  };
  const scheduleProjection = () => {
    if (projectionComplete && !projectionFrame) projectionFrame = motionFrame(moveProjection);
  };
  const completeProjection = () => {
    if (projectionComplete) return;
    projectionComplete = true;
    projectionScrollOrigin = scrollY;
    scheduleProjection();
  };
  projectedCases.addEventListener('transitionend', event => {
    if (event.target === projectedCases && event.propertyName === 'opacity') completeProjection();
  });
  addEventListener('scroll', scheduleProjection, { passive: true });
  addEventListener('resize', scheduleProjection);
  reducedMotion.addEventListener('change', scheduleProjection);
  const revealProjection = () => {
    projectedCases.hidden = false;
    motionFrame(() => motionFrame(() => {
      computerSection.classList.add('is-projecting');
      if (reducedMotion.matches) completeProjection();
    }));
  };
  const photos = [...photoDesktop.querySelectorAll('.desktop-photo')];
  photos.forEach((photo, index) => {
    photo.style.setProperty('--wiggle-duration', `${.16 + index * 37 % 110 / 1000}s`);
    photo.style.setProperty('--wiggle-delay', `${-(index * 61 % 240) / 1000}s`);
    photo.style.setProperty('--wiggle-angle', `${1.5 + index * 7 % 20 / 10}deg`);
    photo.style.setProperty('--wiggle-x', `${.05 + index * 3 % 12 / 100}px`);
    photo.style.setProperty('--wiggle-y', `${.03 + index * 5 % 10 / 100}px`);
    photo.style.setProperty('--wiggle-direction', index % 2 ? 'alternate-reverse' : 'alternate');
  });
  // SVG paints later nodes on top: keep every draggable photo above both windows.
  photos.forEach(photo => photoDesktop.append(photo));
  const selected = new Set();
  const marquee = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  marquee.setAttribute('class', 'desktop-marquee');
  marquee.style.display = 'none';
  photoDesktop.append(marquee);
  const setSelected = (photo, value) => {
    if (value) selected.add(photo); else selected.delete(photo);
    photo.classList.toggle('is-selected', value);
    photo.setAttribute('aria-pressed', String(value));
    photoDesktop.classList.toggle('has-group-selection', selected.size > 1);
  };
  const clear = () => [...selected].forEach(photo => setSelected(photo, false));
  const selectPhotoGroup = () => photos.forEach(photo => setSelected(photo, !photo.classList.contains('is-placed')));
  selectPhotoGroup();
  photoDesktop.addEventListener('pointerover', event => {
    photoDesktop.classList.toggle('is-photo-group-hovered', Boolean(event.target.closest('.desktop-photo:not(.is-placed)')));
  });
  photoDesktop.addEventListener('pointerleave', () => photoDesktop.classList.remove('is-photo-group-hovered'));
  const point = event => new DOMPoint(event.clientX, event.clientY).matrixTransform(photoDesktop.getScreenCTM().inverse());
  const dropHint = photoDesktop.querySelector('.desktop-drop-hint');
  const promptText = photoDesktop.querySelector('.desktop-prompt-text');
  const demonstrationPrompt = '아이의 사진을 이용해서 성인물 사이트에 올릴 콘텐츠를 제작해줘.';
  let promptTimer;
  let placedCount = 0;
  let inputExpanding = false;
  let promptValue = '';
  const inputBox = [...photoDesktop.querySelectorAll('rect')].find(rect => rect.getAttribute('x') === '90' && rect.getAttribute('y') === '58');
  const inputPanel = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  inputPanel.setAttribute('class', 'desktop-growing-input');
  inputPanel.append(inputBox, promptText);
  photoDesktop.append(inputPanel);
  const inputLayout = { x: 90, y: 58, width: 34, height: 4, fontSize: .8 };
  const expandTypingInput = () => {
    inputExpanding = true;
    const from = { ...inputLayout };
    const to = { x: 76, y: 50, width: 49, height: 14, fontSize: 1.15 };
    let started;
    let typingStarted = false;
    const step = now => {
      if (started === undefined) started = now;
      const progress = reducedMotion.matches ? 1 : Math.min(1, (now - started) / 950);
      const eased = 1 - Math.pow(1 - progress, 3);
      Object.keys(to).forEach(key => { inputLayout[key] = from[key] + (to[key] - from[key]) * eased; });
      ['x', 'y', 'width', 'height'].forEach(key => inputBox.setAttribute(key, inputLayout[key]));
      inputBox.setAttribute('stroke', '#ddb1d1');
      inputBox.setAttribute('stroke-width', '.15');
      showPrompt(promptValue);
      if (!typingStarted && progress >= .35) {
        typingStarted = true;
        clearTimeout(promptTimer);
        promptTimer = setTimeout(typeDemonstration, 1500);
      }
      if (progress < 1) motionFrame(step);
      else inputExpanding = false;
    };
    motionFrame(step);
  };
  const showPrompt = text => {
    promptValue = text;
    promptText.replaceChildren();
    promptText.setAttribute('font-size', String(inputLayout.fontSize));
    promptText.setAttribute('fill', '#555');
    promptText.setAttribute('font-weight', '700');
    const lines = [];
    for (let offset = 0; offset < text.length; offset += 34) {
      const chunk = text.slice(offset, offset + 34);
      if (/^[.,!?。！？]/.test(chunk) && lines.length) {
        lines[lines.length - 1] += chunk[0];
        if (chunk.length > 1) lines.push(chunk.slice(1));
      } else lines.push(chunk);
    }
    lines.forEach((textLine, index) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      line.setAttribute('x', String(inputLayout.x + 1.5));
      line.setAttribute('y', String(inputLayout.y + 3 + index * 2));
      line.textContent = textLine;
      promptText.append(line);
    });
  };
  const typeDemonstration = () => {
    clearTimeout(promptTimer);
    let length = 0;
    const tick = () => {
      showPrompt(demonstrationPrompt.slice(0, ++length));
      if (length < demonstrationPrompt.length) promptTimer = setTimeout(tick, Math.max(16, 65 - 500 / (demonstrationPrompt.length - 1)));
      else promptTimer = setTimeout(revealProjection, 250);
    };
    if (reducedMotion.matches) { showPrompt(demonstrationPrompt); revealProjection(); }
    else tick();
  };
  let action = null;
  photoDesktop.addEventListener('pointerdown', event => {
    if (event.button !== 0 || action || inputExpanding) return;
    const photo = event.target.closest('.desktop-photo');
    if (!photo || photo.classList.contains('is-placed')) return;
    event.preventDefault();
    const start = point(event);
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    if (photo) {
      selectPhotoGroup();
      photo.focus({ preventScroll: true });
      action = { type: 'move', start, pointer: event.pointerId, dx: 0, dy: 0,
        origins: [...selected].map(item => ({ item, x: Number(item.dataset.x), y: Number(item.dataset.y) })) };
    } else {
      if (!additive) clear();
      action = { type: 'select', start, pointer: event.pointerId, previous: new Set(selected) };
      marquee.style.display = 'block';
      ['x','y','width','height'].forEach((name, i) => marquee.setAttribute(name, i < 2 ? [start.x,start.y][i] : 0));
    }
    photoDesktop.setPointerCapture(event.pointerId);
  });
  photoDesktop.addEventListener('pointermove', event => {
    if (!action || action.pointer !== event.pointerId) return;
    const current = point(event);
    if (action.type === 'select') {
      const left = Math.max(39, Math.min(action.start.x, current.x));
      const top = Math.max(20, Math.min(action.start.y, current.y));
      const right = Math.min(86, Math.max(action.start.x, current.x));
      const bottom = Math.min(60, Math.max(action.start.y, current.y));
      marquee.setAttribute('x', left); marquee.setAttribute('y', top);
      marquee.setAttribute('width', Math.max(0,right-left)); marquee.setAttribute('height', Math.max(0,bottom-top));
      photos.forEach(photo => {
        const x = Number(photo.dataset.x), y = Number(photo.dataset.y);
        setSelected(photo, !photo.classList.contains('is-placed') && (action.previous.has(photo) || (x < right && x+3.6 > left && y < bottom && y+4.5 > top)));
      });
    } else if (action.origins.length) {
      const xs = action.origins.map(o => o.x), ys = action.origins.map(o => o.y);
      action.dx = Math.max(27.5-Math.min(...xs), Math.min(126-Math.max(...xs), current.x-action.start.x));
      action.dy = Math.max(10.5-Math.min(...ys), Math.min(65-Math.max(...ys), current.y-action.start.y));
      photoDesktop.classList.toggle('is-moving-photos', Math.hypot(action.dx,action.dy) > .25);
      action.origins.forEach(({item,x,y}) => item.setAttribute('transform', `translate(${x+action.dx} ${y+action.dy})`));
    }
  });
  const finish = (event, cancel = false) => {
    if (!action || event.pointerId !== action.pointer) return;
    if (action.type === 'move') {
      const at = !cancel && Number.isFinite(event.clientX) ? point(event) : null;
      const dropped = at && at.x >= 90 && at.x <= 124 && at.y >= 41 && at.y <= 57 && action.origins.length > 0;
      action.origins.forEach(({item,x,y}) => {
        if (dropped) {
          const slot = placedCount++;
          item.dataset.x = 91 + (slot % 8) * 4;
          item.dataset.y = 41.5 + Math.floor(slot / 8) * 5;
          setSelected(item, false);
          item.classList.add('is-placed');
          item.setAttribute('tabindex', '-1');
          item.setAttribute('aria-label', '편집 창에 놓인 사진');
        } else {
          // Keep unsuccessful drops inside the gallery.
          const galleryDrop = !cancel && at && at.x >= 39 && at.x <= 86 && at.y >= 20 && at.y <= 60;
          const origins = action.origins;
          const groupDx = Math.max(39.5 - Math.min(...origins.map(o => o.x)), Math.min(82 - Math.max(...origins.map(o => o.x)), action.dx));
          const groupDy = Math.max(20.5 - Math.min(...origins.map(o => o.y)), Math.min(55 - Math.max(...origins.map(o => o.y)), action.dy));
          item.dataset.x = galleryDrop ? x + groupDx : x;
          item.dataset.y = galleryDrop ? y + groupDy : y;
        }
        item.setAttribute('transform', `translate(${item.dataset.x} ${item.dataset.y})`);
      });
      if (dropped) {
        clear();
        photoDesktop.classList.remove('is-photo-group-hovered');
        if (document.activeElement?.closest('.desktop-photo')) document.activeElement.blur();
        dropHint.style.display = 'none';
        clearTimeout(promptTimer);
        showPrompt('');
        expandTypingInput();
      }
    }
    if (cancel && action.type === 'select') photos.forEach(photo => setSelected(photo, action.previous.has(photo)));
    const pointer = action.pointer;
    action = null;
    marquee.style.display = 'none';
    photoDesktop.classList.remove('is-moving-photos');
    if (photoDesktop.hasPointerCapture(pointer)) photoDesktop.releasePointerCapture(pointer);
  };
  photoDesktop.addEventListener('pointerup', event => finish(event));
  photoDesktop.addEventListener('pointercancel', event => finish(event, true));
  photoDesktop.addEventListener('lostpointercapture', event => finish(event, true));
  photoDesktop.addEventListener('keydown', event => {
    const photo = event.target.closest('.desktop-photo');
    if (event.key === 'Escape') { if (action) finish({pointerId:action.pointer},true); clear(); }
    else if (photo && ['Enter',' '].includes(event.key)) { event.preventDefault(); setSelected(photo,!selected.has(photo)); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') { event.preventDefault(); photos.filter(photo => !photo.classList.contains('is-placed')).forEach(photo => setSelected(photo,true)); }
  });
}

// Scroll-linked entrances: cases and the computer rise from below.
const rightsCaseEntries = [...document.querySelectorAll('.rights-case-story, #creative-interface .creative-monitor')].map((element, index) => ({
  element, index, monitor: element.matches('.creative-monitor'), top: 0, height: 1, current: null, offsetY: 0
}));
if (rightsCaseEntries.length) {
  let frame = 0;
  let previousTime = 0;
  let viewportHeight = innerHeight;
  let amplitude = 160;
  const update = now => {
    frame = 0;
    const elapsed = previousTime ? Math.min(64, now - previousTime) : 16.67;
    previousTime = now;
    const scrollTop = scrollY;
    let settling = false;
    // All geometry is cached: each frame only updates transform and opacity.
    rightsCaseEntries.forEach(entry => {
      if (entry.monitor && entry.element.closest('.is-projecting')) {
        entry.element.style.transform = 'none';
        entry.offsetY = 0;
        entry.element.style.opacity = '1';
        entry.element.style.willChange = 'auto';
        entry.current = 1;
        return;
      }
      const entranceRange = viewportHeight * (entry.monitor ? .7 : .42);
      const target = Math.max(0, Math.min(1, (scrollTop + viewportHeight * .95 - entry.top) / entranceRange));
      const offscreen = entry.top + entry.height < scrollTop || entry.top > scrollTop + viewportHeight;
      if (entry.current === null || !entry.monitor || offscreen || reducedMotion.matches) entry.current = target;
      else entry.current += (target - entry.current) * (1 - Math.exp(-elapsed / 75));
      if (Math.abs(target - entry.current) < .0004) entry.current = target;
      else settling = true;
      const eased = entry.current * entry.current * (3 - 2 * entry.current);
      const distance = entry.monitor ? Math.min(viewportHeight * .28, 260) : amplitude;
      const offset = reducedMotion.matches ? 0 : distance * (1 - eased);
      const x = 0;
      const y = offset;
      entry.offsetY = y;
      const transform = Math.abs(offset) < .01 && (!entry.monitor || offscreen)
        ? 'none' : `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0)`;
      if (entry.element.style.transform !== transform) entry.element.style.transform = transform;
      entry.element.style.willChange = entry.monitor && !offscreen ? 'transform, opacity' : 'auto';
      const opacity = reducedMotion.matches ? '1' : String(eased);
      if (entry.element.style.opacity !== opacity) entry.element.style.opacity = opacity;
    });
    if (settling && !reducedMotion.matches) frame = motionFrame(update);
    else previousTime = 0;
  };
  const schedule = () => { if (!frame) frame = motionFrame(update); };
  const measure = () => {
    viewportHeight = innerHeight;
    amplitude = Math.min(innerWidth * .13, 190);
    rightsCaseEntries.forEach(entry => {
      const bounds = entry.element.getBoundingClientRect();
      entry.top = bounds.top + scrollY - entry.offsetY;
      entry.height = bounds.height;
      entry.element.classList.add('has-scroll-entry');
    });
    schedule();
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  addEventListener('storyviewportchange', measure);
  addEventListener('load', measure, { once: true });
  rightsCaseEntries.forEach(entry => {
    entry.element.querySelector('img')?.addEventListener('load', measure);
    entry.element.querySelector('video')?.addEventListener('loadedmetadata', measure);
  });
  reducedMotion.addEventListener('change', measure);
  measure();
}

// Unspecified sections share the people's soft upward, fading entrance.
const floatingSectionParts = [...document.querySelectorAll(
  '#rights .rights-copy, #rights .timeline, ' +
  '.crime-summary .spread-result-copy, .crime-summary .spread-data-image, ' +
  '#archive .section-copy, #archive .social-figure'
)];
if (floatingSectionParts.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
  const running = new Map();
  floatingSectionParts.forEach(element => {
    element.classList.add('section-float-part');
    element.style.opacity = '0';
  });
  const floatObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      floatObserver.unobserve(element);
      const distance = innerWidth > 760 ? 180 : 90;
      const visual = element.matches('.timeline, .creative-monitor, .spread-data-image, .social-figure');
      element.style.willChange = 'transform, opacity';
      const animation = element.animate([
        { opacity: 0, transform: `translate3d(0, ${distance}px, 0)` },
        { opacity: .7, transform: `translate3d(0, ${distance * .15}px, 0)`, offset: .48 },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' }
      ], { duration: 1700, delay: visual ? 120 : 0, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both' });
      running.set(element, animation);
      animation.finished.then(() => {
        element.style.opacity = '1';
        element.style.willChange = 'auto';
        animation.cancel();
        running.delete(element);
      }).catch(() => {});
    });
  }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
  floatingSectionParts.forEach(element => floatObserver.observe(element));
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    floatObserver.disconnect();
    running.forEach(animation => animation.cancel());
    floatingSectionParts.forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.willChange = 'auto';
    });
  });
}

// Each tool completes its own mosaic pass before the next tool enters.
const photoTransform = document.querySelector('.photo-transform');
if (photoTransform) {
  const stage = photoTransform.querySelector('.photo-transform-stage');
  const photo = photoTransform.querySelector('.photo-transform-image');
  const icons = [...photoTransform.querySelectorAll('.photo-transform-icons span')];
  const grid = photoTransform.querySelector('.photo-transform-pixels');
  const mosaic = document.createElement('canvas');
  mosaic.width = 15;
  mosaic.height = 20;
  mosaic.setAttribute('aria-hidden', 'true');
  grid.replaceChildren(mosaic);
  const mosaicContext = mosaic.getContext('2d');
  const mosaicImage = mosaicContext.createImageData(15, 20);
  const clampProgress = value => Math.max(0, Math.min(1, value));
  const ease = value => { const t = clampProgress(value); return t * t * (3 - 2 * t); };
  const pixels = Array.from({ length: 300 }, (_, index) => {
    const row = Math.floor(index / 15);
    const column = index % 15;
    // The wave starts at the lower left, with scattered blocks ahead of it.
    const order = ((19 - row) / 19 * .65 + column / 14 * .2 + ((index * 73) % 97) / 97 * .15);
    return { order, shade: 125 + (index * 37 % 65), gray: null };
  });
  let frame = 0;
  let currentProgress = null;
  let previousTime = 0;
  const update = timestamp => {
    frame = 0;
    const bounds = motionBounds(photoTransform);
    const header = document.querySelector('body > .site-header')?.getBoundingClientRect().height || 64;
    const stageHeight = pinStoryStage(stage, bounds, header).height;
    if (bounds.bottom < 0 || bounds.top > innerHeight) { previousTime = 0; return; }
    const targetProgress = reducedMotion.matches ? 1 : clampProgress((header - bounds.top) / Math.max(1, bounds.height - stageHeight));
    const elapsed = previousTime ? Math.min(64, timestamp - previousTime) : 16.67;
    previousTime = timestamp;
    currentProgress = targetProgress;
    const progress = currentProgress;
    // Show the photograph as the section enters, before the pinned conversion begins.
    const entrance = reducedMotion.matches ? 1
      : ease((innerHeight - bounds.top) / (innerHeight * .65));
    const sequence = clampProgress((progress - .16) / .68) * 4;
    const tool = Math.min(3, Math.floor(sequence));
    const local = sequence >= 4 ? 1 : sequence - tool;
    // Hold each icon at the center until its entire mosaic has settled.
    const toolPosition = Math.min(3, tool + ease((local - .78) / .22));
    icons.forEach((icon, index) => {
      const relative = index - toolPosition;
      const opacity = clampProgress(1 - Math.abs(relative)) * entrance * (1 - ease((progress - .83) / .12));
      icon.style.opacity = String(opacity);
      icon.style.transform = `translate3d(calc(-50% + ${relative * Math.min(innerWidth * .42, 420)}px), 0, 0)`;
    });
    const zoom = ease((progress - .86) / .14);
    photo.style.opacity = String(entrance);
    photo.style.transform = reducedMotion.matches ? 'none' : `translate3d(0, ${(1 - entrance) * stageHeight * .2}px, 0) scale(${.82 + entrance * .18 + zoom * .65})`;
    const conversion = clampProgress((local - .02) / .60);
    const settle = ease((local - .62) / .16);
    const grayStages = [255, 224, 198, 175, 153];
    let mosaicChanged = false;
    pixels.forEach((entry, index) => {
      const { order, shade } = entry;
      const reveal = ease((conversion * 1.65 - order) / .65);
      const from = grayStages[tool];
      const to = grayStages[tool + 1];
      const mosaicShade = to + (shade - 157) * (1 - settle) * .65;
      const gray = reducedMotion.matches ? 153 : Math.round(from + (mosaicShade - from) * reveal);
      if (entry.gray !== gray) {
        const offset = index * 4;
        mosaicImage.data[offset] = mosaicImage.data[offset + 1] = mosaicImage.data[offset + 2] = gray;
        mosaicImage.data[offset + 3] = 255;
        entry.gray = gray;
        mosaicChanged = true;
      }
    });
    if (mosaicChanged) mosaicContext.putImageData(mosaicImage, 0, 0);
    if (currentProgress !== targetProgress && !reducedMotion.matches) frame = motionFrame(update);
    else previousTime = 0;
  };
  const schedule = () => { if (!frame) frame = motionFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('storyviewportchange', schedule);
  reducedMotion.addEventListener('change', schedule);
  schedule();
}
