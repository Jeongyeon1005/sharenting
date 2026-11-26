const sceneSounds = new Map([
  'deep_hover.wav', 'photo.wav', 'comment.mp3', 'deep_photo.wav', 'keyboard.wav',
  'line.mp3', 'baby_photo.wav', 'coding.mp3', 'generate.wav', 'click.wav'
].map(file => {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = `./audio/${file}`;
  return [file, audio];
}));
const backgroundMusic = new Audio('./audio/back.mp3');
backgroundMusic.loop = true;
backgroundMusic.preload = 'auto';
backgroundMusic.volume = 0;
let backgroundMusicBlocked = false;
let blockedSceneSound;
const sceneSoundButton = document.createElement('button');
sceneSoundButton.type = 'button';
sceneSoundButton.className = 'scene-sound-button';
sceneSoundButton.textContent = '소리 켜기';
sceneSoundButton.hidden = true;
document.body.append(sceneSoundButton);
sceneSoundButton.addEventListener('click', () => {
  startBackgroundMusic();
  if (blockedSceneSound) playSceneSound(blockedSceneSound);
});

function updateSceneSoundButton() {
  const host = document.querySelector('dialog:modal') || document.body;
  if (sceneSoundButton.parentElement !== host) host.append(sceneSoundButton);
  sceneSoundButton.hidden = !backgroundMusicBlocked && !blockedSceneSound;
}

function startBackgroundMusic() {
  if (!backgroundMusic.paused) return;
  backgroundMusic.play().then(() => {
    backgroundMusicBlocked = false;
    updateSceneSoundButton();
    const fadeStarted = performance.now();
    const fadeIn = now => {
      const progress = Math.max(0, Math.min(1, (now - fadeStarted) / 2000));
      backgroundMusic.volume = .06 * progress;
      if (progress < 1) requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);
  }).catch(error => {
    if (error.name === 'NotAllowedError') {
      backgroundMusicBlocked = true;
      updateSceneSoundButton();
    }
  });
}

function playSceneSound(file) {
  if (document.hidden) return;
  const audio = sceneSounds.get(file);
  const restart = file === 'deep_hover.wav' || file === 'click.wav';
  const player = audio.paused || restart ? audio : audio.cloneNode();
  if (file === 'baby_photo.wav') player.volume = .5;
  if (file === 'comment.mp3') player.volume = .5;
  if (file === 'photo.wav') player.volume = .5;
  if (file === 'click.wav') player.volume = .5;
  if (file === 'deep_hover.wav') {
    player.volume = .75;
    player.playbackRate = 1.15;
  }
  player.currentTime = 0;
  player.play().then(() => {
    blockedSceneSound = undefined;
    updateSceneSoundButton();
  }).catch(error => {
    if (error.name === 'NotAllowedError') {
      blockedSceneSound = file;
      updateSceneSoundButton();
    }
  });
  return player;
}

document.addEventListener('pointerdown', event => {
  if (event.isTrusted && event.pointerType === 'mouse' && event.button === 0) {
    playSceneSound('click.wav');
  }
}, true);

// Play the opening, then settle the same wordmark above the scroll prompt.
(async function playIntro() {
  const screen = document.querySelector('.intro-screen');
  if (!screen) {
    startBackgroundMusic();
    return;
  }
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
    startBackgroundMusic();
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
  const portrait = portraitInteraction.querySelector(".portrait-default");
  const hoverDot = document.createElement('span');
  hoverDot.className = 'privacy-hover-dot';
  hoverDot.setAttribute('aria-hidden', 'true');
  portraitInteraction.append(hoverDot);
  let portraitInView = false;
  const dismissHoverDot = () => {
    hoverDot.classList.remove('is-in-view');
  };
  const updateHoverDot = () => {
    const show = portraitInView && !document.hidden && !section.classList.contains('is-analyzing')
      && !portrait.matches(':hover') && !portraitInteraction.matches(':focus-within');
    hoverDot.classList.toggle('is-in-view', show);
  };
  portrait.addEventListener('pointerenter', dismissHoverDot);
  portrait.addEventListener('pointerdown', dismissHoverDot);
  portraitInteraction.addEventListener('focus', dismissHoverDot);
  portrait.addEventListener('pointerleave', updateHoverDot);
  portraitInteraction.addEventListener('blur', updateHoverDot);
  document.addEventListener('visibilitychange', updateHoverDot);
  if ('IntersectionObserver' in window) {
    const handObserver = new IntersectionObserver(entries => {
      portraitInView = entries[0].isIntersecting;
      updateHoverDot();
    }, { threshold: .25 });
    handObserver.observe(portraitInteraction);
  } else {
    portraitInView = true;
    updateHoverDot();
  }
  const panel = section.querySelector(".privacy-analysis");
  const analysisTokens = [...panel.querySelectorAll('[data-decode]')].map(span => ({
    span,
    text: span.textContent
  }));
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
    for (let row = 0, y = 20; y < codeHeight + 28; row++, y += 40) {
      for (let x = -40 + (row % 3) * 17; x < codeWidth + 60;) {
        const token = makeCode();
        const depth = Math.random();
        const size = depth < .2 ? 14 : depth > .8 ? 22 : 18;
        const distance = Math.min(Math.hypot(x, y), Math.hypot(codeWidth - x, y), Math.hypot(x, codeHeight - y), Math.hypot(codeWidth - x, codeHeight - y));
        codeCells.push({ x, y, distance: distance / Math.hypot(codeWidth / 2, codeHeight / 2), token, size, depth, changed: 0 });
        x += token[0].length * size * .61 + 36;
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
      const edge = Math.max(0, Math.min(1, (Math.abs(cell.x - codeWidth / 2) / codeWidth - .12) / .25));
      const alpha = reveal * (.02 + edge * .35) * (cell.depth < .2 ? .38 : 1);
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
    const wasShowing = codeCanvas.classList.contains('is-visible');
    codeCanvas.classList.toggle('is-visible', show);
    if (show) {
      sizeCode();
      codeStarted = performance.now();
      drawCode();
      if (!wasShowing) playSceneSound('coding.mp3');
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
    if (open) dismissHoverDot();
    else updateHoverDot();
    portraitInteraction.classList.toggle("is-open", open);
    portraitInteraction.setAttribute("aria-pressed", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    analysisTokens.forEach(({ span, text }) => { span.textContent = text; });
    if (!open || reducedMotion.matches) return;
    const decodeStarted = performance.now();
    const decode = () => {
      if (!active) return;
      const elapsed = performance.now() - decodeStarted;
      analysisTokens.forEach(({ span, text }, index) => {
        const progress = Math.max(0, Math.min(1, (elapsed - index * 45) / 950));
        span.textContent = decodeText(text, progress);
      });
      if (elapsed < 1500) typingTimer = setTimeout(decode, 50);
    };
    decode();
  };
  const dismissPhotoAnalysis = () => {
    if (!pinned && document.activeElement !== portraitInteraction) setAnalysis(false);
  };
  // Layout changes during analysis can move the photo under a stationary pointer.
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    if (event.target === portrait) setAnalysis(true);
    else if (active) dismissPhotoAnalysis();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", dismissPhotoAnalysis);
  portraitInteraction.addEventListener("focus", () => setAnalysis(true));
  portraitInteraction.addEventListener("blur", () => {
    if (!pinned && !portrait.matches(":hover")) setAnalysis(false);
  });
  const togglePortrait = () => { pinned = !pinned; setAnalysis(pinned); };
  portrait.addEventListener("click", togglePortrait);
  portrait.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') playSceneSound('baby_photo.wav');
  });
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
  const panel = rights.querySelector(".rights-stage");
  const header = document.querySelector("body > .site-header");
  const regions = [...rights.querySelectorAll(".rights-region")];
  const figures = [...rights.querySelectorAll(".figure-slot")];
  const tracks = [...rights.querySelectorAll(".timeline-track > div")];
  let stageFrame = 0;
  let activeStage = -1;
  const updateStages = () => {
    stageFrame = 0;
    const bounds = motionBounds(rights);
    const travel = Math.max(1, bounds.height - motionBounds(panel).height);
    const headerHeight = header ? motionBounds(header).height : 0;
    const distance = headerHeight - bounds.top;
    const pinned = distance >= 0 && distance <= travel;
    panel.classList.toggle("is-pinned", pinned);
    panel.style.top = `${pinned ? headerHeight : Math.max(0, Math.min(travel, distance))}px`;
    panel.style.left = pinned ? `${bounds.left}px` : "";
    panel.style.width = pinned ? `${bounds.width}px` : "";
    const progress = distance / travel;
    const intro = .08;
    const stage = Math.max(-1, Math.min(regions.length - 1,
      Math.floor((progress - intro) / (1 - intro) * regions.length)));
    if (stage === activeStage) return;
    activeStage = stage;
    regions.forEach((region, index) => {
      const active = index === stage;
      region.classList.toggle("is-active", active);
      figures[index].classList.toggle("is-active", active);
      tracks[index].classList.toggle("is-active", active);
    });
    if (pinned && stage >= 0) playSceneSound('comment.mp3');
  };
  const scheduleStages = () => {
    if (!stageFrame) stageFrame = motionFrame(updateStages);
  };
  rights.classList.add("has-stage-scroll");
  addEventListener("scroll", scheduleStages, { passive: true });
  addEventListener("resize", scheduleStages);
  addEventListener("storyviewportchange", scheduleStages);
  scheduleStages();
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
let playCaseGalleryEntrance;
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
  let selectedCategory = 'all';
  const categoryOrder = filters.map(button => button.dataset.filter).filter(category => category !== 'all');
  const rendered = [];
  const categoryPositions = new Map();
  const usedCards = new Set();
  const wrap = (value, count) => ((value % count) + count) % count;
  // A multi-category case appears in each relevant section of the same ring.
  categoryOrder.forEach(category => {
    const positions = [];
    cards.filter(card => card.dataset.categories.split(/\s+/).includes(category)).forEach(original => {
      let card = original;
      if (usedCards.has(original)) {
        card = original.cloneNode(true);
        card.dataset.loopCopy = 'true';
        card.tabIndex = -1;
        card.setAttribute('aria-hidden', 'true');
        card.addEventListener('click', () => original.click());
        field.append(card);
      }
      usedCards.add(original);
      card.dataset.ringCategory = category;
      positions.push(rendered.length);
      rendered.push(card);
    });
    categoryPositions.set(category, positions);
  });
  let target = 0, current = 0, frame = 0, previous = 0;
  let categoryAnimations = [];
  let ringEntranceStart = null;
  const ringEntranceDuration = 2050;
  const cardEntranceDuration = 510;
  const cardEntranceStagger = 58;
  let ringEntrancePending = false;
  let pointer = null, suppressClick = false;
  let viewportWidth = 1, windowWidth = innerWidth, paintedRing = true, lastStatus = '';
  const styleCache = new WeakMap();
  const writeCardStyle = (card, property, value) => {
    let cache = styleCache.get(card);
    if (!cache) { cache = {}; styleCache.set(card, cache); }
    if (cache[property] !== value) { card.style[property] = value; cache[property] = value; }
  };
  const measureGallery = () => { viewportWidth = viewport.clientWidth; windowWidth = innerWidth; schedule(); };
  const statusElement = caseExplorer.querySelector('.case-status');
  const paint = now => {
    frame = 0;
    const elapsed = previous ? Math.min(64, now - previous) : 16.67;
    previous = now;
    current = reducedMotion.matches ? target : current + (target - current) * (1 - Math.exp(-elapsed / 150));
    if (Math.abs(target - current) < .01) current = target;
    const showRing = selectedCategory === 'all';
    if (ringEntrancePending) {
      ringEntranceStart = now;
      ringEntrancePending = false;
    }
    const ringEntranceElapsed = ringEntranceStart === null ? ringEntranceDuration : now - ringEntranceStart;
    const enteringRing = showRing && !reducedMotion.matches && ringEntranceElapsed < ringEntranceDuration;
    if (!enteringRing) ringEntranceStart = null;
    if (paintedRing !== showRing) { viewport.classList.toggle('is-ring', showRing); paintedRing = showRing; }
    const blend = showRing ? 0 : 1;
    const spacing = windowWidth > 760 ? 155 : 100;
    const radius = Math.min(viewportWidth * .34, 490);
    const baseWidth = windowWidth > 760 ? Math.max(78, Math.min(145, windowWidth * .1)) : Math.max(54, Math.min(90, windowWidth * .12));
    const fullWidth = windowWidth > 760 ? Math.max(230, Math.min(370, windowWidth * .24)) : 210;
    const cardScale = 1 + (fullWidth / baseWidth - 1) * blend;
    const entranceScale = ringEntranceDuration / (cardEntranceDuration + Math.max(0, rendered.length - 1) * cardEntranceStagger);
    const horizontal = Math.min(viewportWidth * .24, 260);
    const vertical = Math.min(viewport.clientHeight * .24, 220);
    rendered.forEach((card, index) => {
      const distance = wrap(index - current + rendered.length / 2, rendered.length) - rendered.length / 2;
      const angle = distance * Math.PI * 2 / rendered.length;
      const ringX = Math.sin(angle) * radius, ringZ = Math.cos(angle) * radius;
      const progress = enteringRing ? Math.max(0, Math.min(1, (ringEntranceElapsed / entranceScale - index * cardEntranceStagger) / cardEntranceDuration)) : 1;
      const remaining = (1 - progress) ** 3;
      const direction = index % 4;
      const x = ringX * (1 - blend) + distance * spacing * blend + (direction === 0 ? horizontal : direction === 1 ? -horizontal : 0) * remaining;
      const y = -distance * 36 * blend + (direction === 2 ? -vertical : direction === 3 ? vertical : 0) * remaining;
      const z = ringZ * (1 - blend) - distance * 85 * blend;
      const match = selectedCategory === 'all' || card.dataset.ringCategory === selectedCategory;
      const onScreen = distance > -4 && distance < 14;
      const opacity = match ? progress ** 2 : 1 - blend;
      const hidden = opacity === 0 || (blend > .995 && (!match || !onScreen));
      writeCardStyle(card, 'visibility', hidden ? 'hidden' : 'visible');
      writeCardStyle(card, 'pointerEvents', !hidden && (showRing || onScreen) ? 'auto' : 'none');
      if (hidden) return;
      writeCardStyle(card, 'zIndex', String(Math.round((1000 + ringZ) * (1 - blend) + (1000 - distance * 10) * blend)));
      writeCardStyle(card, 'opacity', String(opacity));
      writeCardStyle(card, 'transform', `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${((angle * 180 / Math.PI + 90) * (1 - blend) - 42 * blend).toFixed(2)}deg) rotateX(${(-10 * blend).toFixed(2)}deg) rotateZ(${(10 * blend).toFixed(2)}deg) scale(${cardScale.toFixed(4)})`);
    });
    const status = `${selectedCategory === 'all' ? '모든 사례' : categoryLabels[selectedCategory]} · ${visible.length}개 사례 · 드래그하여 탐색`;
    if (status !== lastStatus) { statusElement.textContent = status; lastStatus = status; }
    if (current !== target || enteringRing) frame = motionFrame(paint);
    else previous = 0;
  };
  const schedule = () => { if (!frame) frame = motionFrame(paint); };
  const move = amount => {
    if (visible.length) target += amount;
    if (selectedCategory !== 'all') {
      const positions = categoryPositions.get(selectedCategory);
      const start = positions[0] + Math.round((current - positions[0]) / rendered.length) * rendered.length;
      target = Math.max(start, Math.min(start + positions.length - 1, target));
    }
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
      if (event.key === 'Home') target = selectedCategory === 'all' ? 0 : categoryPositions.get(selectedCategory)[0];
      else if (event.key === 'End') target = selectedCategory === 'all' ? rendered.length - 1 : categoryPositions.get(selectedCategory).at(-1);
      else move(['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1);
      schedule();
    }
  });
  cards.forEach(card => card.addEventListener('focus', () => {
    if (card.matches(':focus-visible') && visible.includes(card)) {
      const index = selectedCategory === 'all' ? rendered.indexOf(card) : rendered.findIndex(candidate => candidate.dataset.ringCategory === selectedCategory && candidate.getAttribute('aria-label') === card.getAttribute('aria-label'));
      target = index + Math.round((current - index) / rendered.length) * rendered.length;
      schedule();
    }
  }));
  const animateCardsIn = entering => {
    categoryAnimations.forEach(animation => animation.cancel());
    categoryAnimations = [];
    if (reducedMotion.matches) return;

    const horizontal = Math.min(viewportWidth * .24, 260);
    const vertical = Math.min(viewport.clientHeight * .24, 220);
    const directions = [`${horizontal}px 0px`, `${-horizontal}px 0px`, `0px ${-vertical}px`, `0px ${vertical}px`];
    categoryAnimations = entering.map((card, index) => card.animate([
      { translate: directions[index % directions.length], opacity: 0 },
      { translate: '0px 0px', opacity: 1 }
    ], { duration: cardEntranceDuration, delay: index * cardEntranceStagger, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'backwards' }));
  };
  const showAllCases = () => {
    categoryAnimations.forEach(animation => animation.cancel());
    categoryAnimations = [];
    current = target = 0;
    ringEntrancePending = !reducedMotion.matches;
    ringEntranceStart = null;
    measureGallery();
    cancelMotionFrame(frame);
    paint(performance.now());
  };
  playCaseGalleryEntrance = () => {
    const positions = categoryPositions.get(selectedCategory);
    if (positions) {
      measureGallery();
      animateCardsIn(positions.map(index => rendered[index]));
    } else showAllCases();
  };
  filters.forEach(button => button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    selectedCategory = button.dataset.filter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    visible = cards.filter(card => selectedCategory === 'all' || card.dataset.categories.split(/\s+/).includes(selectedCategory));
    cards.forEach(card => {
      const match = visible.includes(card);
      card.setAttribute('aria-disabled', String(!match));
      card.tabIndex = match ? 0 : -1;
    });
    const positions = categoryPositions.get(selectedCategory);
    if (selectedCategory === 'all') {
      showAllCases();
      return;
    }
    ringEntrancePending = false;
    ringEntranceStart = null;
    const destination = positions?.length ? positions[0] + Math.min(2, positions.length - 1) : 0;
    target = destination + Math.round((current - destination) / rendered.length) * rendered.length;
    current = target;
    schedule();
    if (positions) animateCardsIn(positions.map(index => rendered[index]));
  }));
  addEventListener('resize', measureGallery);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      ringEntrancePending = false;
      ringEntranceStart = null;
      categoryAnimations.forEach(animation => animation.cancel());
      categoryAnimations = [];
    }
    schedule();
  });
  new ResizeObserver(measureGallery).observe(viewport);
  measureGallery();
}


const exploreButton = document.querySelector(".explore-button");
const casesDialog = document.querySelector(".cases-dialog");
if (exploreButton && caseExplorer && casesDialog) {
  const archiveLink = document.querySelector(".archive-link");
  const openCases = (event) => {
    event.preventDefault();
    if (casesDialog.open) return;
    caseExplorer.hidden = false;
    exploreButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("cases-open");
    casesDialog.showModal();
    updateSceneSoundButton();
    casesDialog.scrollTop = 0;
    caseExplorer.classList.add("is-visible");
    playCaseGalleryEntrance();
    caseExplorer.focus({ preventScroll: true });
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
    updateSceneSoundButton();
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
  const cover = caseDetail.querySelector('.case-detail-cover');
  const sheet = caseDetail.querySelector('.case-detail-sheet');
  const detailScroll = caseDetail.querySelector('.case-detail-scroll');
  sheet.tabIndex = 0;
  sheet.setAttribute('aria-label', '사례 카드. 클릭하거나 Enter 키를 누르면 사진과 설명을 전환합니다.');
  let flipAnimation = null, flipping = false, flipVersion = 0;
  const cancelFlip = () => {
    flipVersion++; flipping = false;
    flipAnimation?.cancel(); flipAnimation = null;
  };
  const flipCard = async showCover => {
    if (flipping || caseDetail.classList.contains('is-cover') === showCover) return;
    const version = ++flipVersion;
    flipping = true;
    const applyFace = () => {
      caseDetail.classList.toggle('is-cover', showCover);
      detailScroll.scrollTop = 0;
      (showCover ? cover : sheet).focus({ preventScroll: true });
    };
    if (reducedMotion.matches) { applyFace(); flipping = false; return; }
    const direction = showCover ? -1 : 1;
    try {
      flipAnimation = sheet.animate([
        { transform: 'rotateY(0deg)', opacity: 1 },
        { transform: `rotateY(${direction * 90}deg)`, opacity: .7 }
      ], { duration: 240, easing: 'ease-in', fill: 'forwards' });
      await flipAnimation.finished;
      if (version !== flipVersion || !caseDetail.open) return;
      applyFace();
      flipAnimation.cancel();
      flipAnimation = sheet.animate([
        { transform: `rotateY(${-direction * 90}deg)`, opacity: .7 },
        { transform: 'rotateY(0deg)', opacity: 1 }
      ], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
      await flipAnimation.finished;
      if (version === flipVersion) { flipAnimation.cancel(); flipAnimation = null; }
    } catch { /* Closing or selecting another card cancels the current flip. */ }
    finally { if (version === flipVersion) flipping = false; }
  };
  const returnToCover = () => flipCard(true);
  sheet.addEventListener('click', event => {
    if (caseDetail.classList.contains('is-cover') || event.target.closest('button, a') || window.getSelection()?.toString()) return;
    returnToCover();
  });
  sheet.addEventListener('keydown', event => {
    if (event.target !== sheet || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    if (!caseDetail.classList.contains('is-cover')) returnToCover();
  });
  cover.addEventListener('click', () => flipCard(false));
  caseDetail.querySelector(".case-detail-exit").addEventListener("click", () => caseDetail.close());
  const detailCards = [...caseExplorer.querySelectorAll(".case-card:not([data-loop-copy])")];
  const previousCase = caseDetail.querySelector(".case-detail-prev");
  const nextCase = caseDetail.querySelector(".case-detail-next");
  const position = caseDetail.querySelector(".case-detail-position");
  const availableCards = () => [...caseExplorer.querySelectorAll('.case-card:not([data-loop-copy]):not([aria-disabled="true"])')];
  let activeCard = null;
  const openCase = (card, index) => {
    if (card.getAttribute("aria-disabled") === "true") return;
    cancelFlip();
    activeCard = card;
    const item = sortedCases[index];
    caseDetail.classList.add('is-cover');
    cover.querySelector('.case-detail-cover-title').textContent = item.title;
    caseDetail.querySelector('#case-detail-title').textContent = item.title;
    const coverImage = cover.querySelector('img');
    if (item.image) coverImage.src = item.image;
    else coverImage.removeAttribute('src');
    coverImage.hidden = !item.image;
    caseDetail.querySelector(".case-detail-id").textContent = `Case. ${String(index + 1).padStart(3, "0")}`;
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
    caseDetail.querySelector('.case-detail-categories').replaceChildren(...item.categories.map(category => {
      const tag = document.createElement('span');
      tag.textContent = `#${categoryLabels[category]}`;
      return tag;
    }));
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
    cover.focus({ preventScroll: true });
    detailScroll.scrollTop = 0;
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
  const gallery = caseExplorer.querySelector('.case-gallery');
  caseDetail.addEventListener("close", () => {
    cancelFlip();
    gallery.classList.add('is-returning');
    gallery.focus({ preventScroll: true });
    document.addEventListener('pointermove', () => gallery.classList.remove('is-returning'), { once: true });
  });
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
  crowdLayer.className = 'sharing-crowd-layer sharing-crowd-art';
  crowdLayer.src = crowdSource.getAttribute('href');
  // The composited image and editor use the same rectangle in scene coordinates.
  const crowdWidth = Number(crowdSource.getAttribute('width'));
  const crowdTop = 240 + (665.1227 - crowdWidth * 58 / 131) / 2;
  crowdLayer.dataset.sceneWidth = crowdWidth;
  crowdLayer.dataset.sceneTop = crowdTop;
  crowdLayer.dataset.sceneHeight = crowdWidth * 954 / 1649;
  crowdLayer.alt = '';
  crowdLayer.setAttribute('aria-hidden', 'true');
  camera.prepend(crowdLayer);
  crowdSource.remove();
  const scrollLines = [...sharingComposition.querySelectorAll('.sharing-scroll-line')];
  const svgNS = 'http://www.w3.org/2000/svg';
  // Extra upward routes keep the original phone connections intact.
  const burstGroup = document.createElementNS(svgNS, 'g');
  burstGroup.setAttribute('class', 'sharing-upward-lines');
  const connections = scene.querySelector('.sharing-connections');
  connections.prepend(burstGroup);
  const peopleLayer = scene.querySelector('.sharing-people');
  connections.after(peopleLayer);
  const foregroundRoutes = document.createElementNS(svgNS, 'g');
  foregroundRoutes.setAttribute('class', 'sharing-connections');
  foregroundRoutes.setAttribute('fill', 'none');
  foregroundRoutes.setAttribute('stroke-linecap', 'round');
  peopleLayer.after(foregroundRoutes);
  const receivedPhotos = document.createElementNS(svgNS, 'g');
  foregroundRoutes.after(receivedPhotos);
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
  let extraOpeningLines = [];
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
    // Keep the incoming and outgoing routes at the third phone above the figures.
    if (index === 26 || index === 27) foregroundRoutes.append(halo, line, head);
    return { halo, head, samples, curve: null };
  });

  const revealSounds = new Map();
  const playRevealSound = sound => {
    if (!sound.revealed || !sound.inView || sound.played) return;
    sound.played = true;
    playSceneSound(sound.file);
  };
  const soundObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const sound = revealSounds.get(entry.target);
      if (!sound) return;
      sound.inView = entry.isIntersecting;
      playRevealSound(sound);
    });
  }) : null;
  const observeRevealSound = (element, file) => {
    if (revealSounds.has(element)) return;
    revealSounds.set(element, { file, revealed: false, inView: !soundObserver, played: false });
    soundObserver?.observe(element);
  };
  const updateRevealSound = (element, revealed) => {
    const sound = revealSounds.get(element);
    sound.revealed = revealed;
    if (!revealed) sound.played = false;
    playRevealSound(sound);
  };

  const people = [...sharingComposition.querySelectorAll('.sharing-person-reveal')].map((group, index) => {
    const image = group.querySelector('image');
    const x = Number(image.getAttribute('x'));
    const y = Number(image.getAttribute('y'));
    const height = Number(image.getAttribute('height'));
    const width = Number(image.getAttribute('width'));
    const mirrored = image.hasAttribute('transform');
    const phoneX = mirrored ? x + width - 52 * height / 162 : x + 52 * height / 162;
    const phoneY = y + 38 * height / 162;
    // Align the top of the phone artwork to the existing route endpoint.
    const artworkWidth = Number(image.dataset.artworkWidth);
    const artworkAnchorX = Number(image.dataset.artworkPhoneX);
    const artworkScale = Math.min(width / artworkWidth, height / 287.66);
    const artworkPhoneX = x + width / 2 + (mirrored ? -1 : 1) * (artworkAnchorX - artworkWidth / 2) * artworkScale;
    const artworkPhoneY = y + (height - 287.66 * artworkScale) / 2 + 48 * artworkScale;
    const silhouette = document.createElementNS(svgNS, 'g');
    silhouette.setAttribute('transform', `translate(${phoneX} ${phoneY}) scale(1.2) translate(${-artworkPhoneX} ${-artworkPhoneY})`);
    group.append(silhouette);
    silhouette.append(image);
    const photo = document.createElementNS(svgNS, 'image');
    const portraitNumber = String(index + 1).padStart(2, '0');
    photo.setAttribute('href', `./images/portrait-${portraitNumber}.svg`);
    photo.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const portraitWidth = 52;
    const portraitHeight = 72;
    photo.setAttribute('x', String(phoneX - portraitWidth / 2));
    photo.setAttribute('y', String(phoneY - portraitHeight - 24));
    photo.setAttribute('width', String(portraitWidth));
    photo.setAttribute('height', String(portraitHeight));
    photo.setAttribute('class', 'sharing-received-photo');
    const photoGroup = document.createElementNS(svgNS, 'g');
    photoGroup.append(photo);
    receivedPhotos.append(photoGroup);
    observeRevealSound(photoGroup, 'photo.wav');
    return { group, photo, photoGroup, y, reveal: 0, phoneX, phoneY };
  });
  let comments = [];
  const collectComments = () => {
    const previous = new Map(comments.map(comment => [comment.group, comment]));
    comments = [...sharingComposition.querySelectorAll('.sharing-chat-reveal')].filter(group => group.dataset.commentDeleted !== 'true').map((group, index) => {
      const oldComment = previous.get(group);
      const bubble = group.querySelector('image');
      const centerX = Number(bubble.getAttribute('x')) + Number(bubble.getAttribute('width')) / 2;
      return { ...oldComment, group, centerX, width: Number(bubble.getAttribute('width')), shiftX: 0, y: Number(group.dataset.y), order: index, reveal: oldComment?.reveal || 0 };
    });
  };
  collectComments();
  const clamp = value => Math.max(0, Math.min(1, value));
  sharingComposition.classList.add('has-scroll-lines');
  let sharingFrame = 0;
  let hasSharingScroll = false;
  let openingSoundPlayed = false;
  let smoothDistance = null;
  let previousFrameTime = 0;
  let viewHeight = 1;
  let panDistance = 0;
  let holdDistance = 1;
  let travelDistance = 1;
  const commentScrollFactor = 1.7;
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
    crowdLayer.style.width = `${crowdWidth / canvas.width * 100}%`;
    crowdLayer.style.top = `${crowdTop * sceneScale}px`;
    holdDistance = viewHeight * 1.5;
    completionPause = viewHeight * .2;
    travelDistance = Math.max(viewHeight * 1.8, panDistance * 1.5);
    const extendedTravel = travelDistance * .5 * (1 + commentScrollFactor);
    sharingComposition.style.height = reducedMotion.matches ? 'auto' : `${viewHeight + holdDistance + completionPause + extendedTravel}px`;
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
    const extendedTravel = travelDistance * .5 * (1 + commentScrollFactor);
    const targetDistance = hasSharingScroll ? Math.max(0, Math.min(holdDistance + completionPause + extendedTravel, headerHeight - bounds.top)) : 0;
    const elapsed = previousFrameTime ? Math.min(64, timestamp - previousFrameTime) : 16.67;
    previousFrameTime = timestamp;
    // Time-based easing stays consistent across trackpads, mouse wheels and refresh rates.
    smoothDistance = targetDistance;
    const distance = smoothDistance;
    // Frame the foreground phone near the lower fifth of the opening viewport.
    const openingPan = reducedMotion.matches ? 0
      : Math.max(-viewHeight * .34, Math.min(viewHeight * .18, 480 * sceneScale - viewHeight * .79));
    const openingProgress = clamp((headerHeight - bounds.top) / holdDistance);
    const followingDistance = Math.max(0, distance - holdDistance - completionPause);
    // Keep the phone connections unchanged; slow only the comment portion.
    const followingProgress = clamp(followingDistance <= travelDistance * .5
      ? followingDistance / travelDistance
      : .5 + (followingDistance - travelDistance * .5) / (travelDistance * commentScrollFactor));
    const scale = sceneScale;
    // Finish every person-to-person route before entering the comment scene.
    const routesProgress = clamp(followingProgress / .42);
    const commentsProgress = clamp((followingProgress - .50) / .50);
    const topOpacity = clamp(routesProgress / .2).toFixed(3);
    if (viewport.style.getPropertyValue('--sharing-top-opacity') !== topOpacity) {
      viewport.style.setProperty('--sharing-top-opacity', topOpacity);
    }
    people.forEach((person, index) => {
      const arrival = clamp((routesProgress - index * .22) / .25);
      person.photo.classList.toggle('is-received', hasSharingScroll && (reducedMotion.matches || arrival >= 1));
    });
    const lastPhone = people[people.length - 1];
    const routesPanDistance = Math.min(panDistance, Math.max(0, lastPhone.phoneY * scale - viewHeight * .58));
    // Reach the final phone early, then hold the camera while the last line finishes.
    const openingComplete = openingProgress >= 1;
    const routePanProgress = openingComplete ? clamp(routesProgress / .84) : 0;
    const cameraPan = openingPan + routePanProgress * (routesPanDistance - openingPan)
      + commentsProgress * (panDistance - routesPanDistance);
    // Use the same progress calculation as the final phone-to-phone line.
    const finalRouteIndex = Math.max(0, scrollLines.length - 25);
    const finalRouteProgress = clamp((routesProgress - finalRouteIndex * .22) / .25);
    const commentsReady = hasSharingScroll && finalRouteProgress >= 1 && commentsProgress > 0;
    // Branch from inside the opening bundle, just above its phone connection.
    const anchors = [{ x: 553, y: 452 }];
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
        person.photoGroup.style.opacity = opacity;
        person.lastOpacity = opacity;
      }
      if (person.lastRise !== rise) {
        const transform = `translate(0 ${rise})`;
        person.group.setAttribute('transform', transform);
        person.photoGroup.setAttribute('transform', transform);
        person.lastRise = rise;
      }
      anchors.push({ x: person.phoneX, y: person.phoneY + rise });
      updateRevealSound(person.photoGroup, hasSharingScroll && reveal > 0 && person.photo.classList.contains('is-received'));
    });
    let commentsSettling = false;
    const completion = clamp((commentsProgress - .65) / .35);
    const completionReveal = completion * completion * (3 - 2 * completion);
    comments.forEach(comment => {
      const screenY = (comment.y + Number(comment.group.dataset.commentOffsetY || 0)) * scale - cameraPan;
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
    // Keep the route anchors on their existing trajectories during the entrance.
    scrollLines.slice(24).forEach((line, index) => {
      const from = anchors[index];
      const to = anchors[index + 1];
      const curveY = Math.min(from.y, to.y) - 95;
      const control1 = { x: from.x, y: index === 0 ? from.y + 65 : curveY };
      const control2 = { x: to.x, y: index === 0 ? to.y - 95 : curveY };
      const light = lineLights[index + 24];
      const d = `M${from.x} ${from.y} C${control1.x} ${control1.y} ${control2.x} ${control2.y} ${to.x} ${to.y}`;
      if (light.d !== d) {
        line.setAttribute('d', d);
        light.halo.setAttribute('d', d);
        light.d = d;
        // Sample equal parameter steps, then use cumulative length to locate the head.
        const curve = [from, control1, control2, to];
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
    let allOpeningLinesConnected = hasSharingScroll && bounds.top <= headerHeight;
    extraOpeningLines.forEach(line => {
      const progress = reducedMotion.matches ? 1 : hasSharingScroll ? clamp((openingProgress - .12) / .55) : 0;
      if (progress < 1) allOpeningLinesConnected = false;
      line.style.strokeDasharray = '1';
      line.style.strokeDashoffset = String(1 - progress);
      line.style.opacity = progress > 0 ? '.75' : '0';
    });
    upwardLines.forEach(({ line, start, duration, opacity }) => {
      const progress = reducedMotion.matches ? 1
        : hasSharingScroll ? clamp((openingProgress - start) / duration) : 0;
      if (progress < 1) allOpeningLinesConnected = false;
      line.style.strokeDashoffset = String(1 - progress);
      line.style.opacity = progress > 0 ? String(opacity) : '0';
    });
    scrollLines.forEach((line, index) => {
      const progress = index < 24
        ? clamp((openingProgress - (index * 7 % 23) / 100) / (.36 + (index * 13 % 37) / 100))
        : clamp((routesProgress - (index - 24) * .22) / .25);
      const visibleProgress = !hasSharingScroll ? 0 : reducedMotion.matches ? 1 : progress;
      if (index < 24 && visibleProgress < 1 && line.dataset.lineDeleted !== 'true') {
        allOpeningLinesConnected = false;
      }
      const light = lineLights[index];
      const offset = (1 - visibleProgress).toFixed(4);
      if (light.offset !== offset) {
        line.style.strokeDashoffset = offset;
        light.halo.style.strokeDashoffset = offset;
        line.style.opacity = visibleProgress > 0 ? '1' : '0';
        light.halo.style.opacity = visibleProgress > 0 ? String(Math.min(1, .2 * Number(line.dataset.glow ?? 1))) : '0';
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
    if (allOpeningLinesConnected && !openingSoundPlayed) playSceneSound('line.mp3');
    openingSoundPlayed = allOpeningLinesConnected;
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
  addEventListener('commentlayoutchange', () => { collectComments(); measureSharing(); });
  addEventListener('openinglinesloaded', () => {
    extraOpeningLines = [...scene.querySelectorAll('.sharing-extra-opening-line')];
    scrollLines.slice(0, 24).forEach((line, index) => {
      const light = lineLights[index];
      const deleted = line.dataset.lineDeleted === 'true';
      light.halo.style.display = deleted ? 'none' : '';
      if (light.head) light.head.style.display = deleted ? 'none' : '';
      light.halo.setAttribute('d', line.getAttribute('d'));
      const color = line.getAttribute('stroke');
      light.halo.setAttribute('stroke', color);
      if (light.head) {
        const id = `opening-head-color-${index}`;
        let gradient = lightDefs.querySelector(`#${id}`);
        if (!gradient) {
          gradient = lightDefs.querySelector('#sharing-line-light').cloneNode(true);
          gradient.id = id; lightDefs.append(gradient);
        }
        gradient.querySelectorAll('stop').forEach(stop => stop.setAttribute('stop-color', color));
        light.head.setAttribute('fill', `url(#${id})`);
      }
      const glow = Number(line.dataset.glow ?? 1);
      light.halo.setAttribute('stroke-width', Number(line.getAttribute('stroke-width')) + 4 * glow);
      light.halo.style.filter = glow ? `blur(${glow}px)` : 'none';
      light.offset = null;
      if (light.head) {
        light.head.setAttribute('r', 8 * glow);
        const length = line.getTotalLength();
        light.samples = Array.from({ length: 97 }, (_, i) => line.getPointAtLength(length * i / 96));
      }
    });
    scheduleSharingLines();
  });
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
  mapStage.append(
    finaleDiagram.querySelector('.finale-heading'),
    finaleDiagram.querySelector('.finale-photo'),
    map
  );
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
    const labels = [4, 9, 14, 18].map(index => [Number(details[index].getAttribute('x')), Number(details[index].getAttribute('y'))]);
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
  addEventListener('maplayoutchange', alignThreads);
  addEventListener('load', alignThreads, { once: true });
  document.fonts.ready.then(alignThreads);
  const button = finaleDiagram.querySelector('.explore-button');
  const scrollCue = document.querySelector('.scroll-cue');
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
  let autoStarted = false;
  let autoProgress = null;
  let autoButtonProgress = 0;
  let completedStage = false;
  let buttonFlashed = false;
  let cancelThreadFollow = null;
  const completeFinaleStage = () => {
    if (completedStage) return;
    const previousScroll = scrollY;
    const previousHeight = mapRunway.getBoundingClientRect().height;
    completedStage = true;
    autoProgress = autoButtonProgress = 1;
    mapRunway.classList.add('is-complete');
    ['position', 'top', 'left', 'width'].forEach(property => { mapStage.style[property] = ''; });
    alignThreads();
    const removedHeight = previousHeight - mapRunway.getBoundingClientRect().height;
    // Keep the Explore button at the same viewport position as the runway collapses.
    if (removedHeight > 0) window.scrollTo({ top: previousScroll - removedHeight, behavior: 'instant' });
  };
  const followThreads = () => {
    stopPageScroll();
    autoStarted = true;
    document.documentElement.classList.add('is-following-finale');
    let cancelled = false, started, previous, cameraScroll = scrollY;
    const stop = event => event.preventDefault();
    const keys = event => {
      if (event.key === 'Escape') cancelThreadFollow?.();
      else if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) event.preventDefault();
    };
    const release = () => {
      document.documentElement.classList.remove('is-following-finale');
      removeEventListener('wheel', stop);
      removeEventListener('touchmove', stop);
      removeEventListener('keydown', keys);
    };
    cancelThreadFollow = () => {
      cancelled = true;
      release();
      completeFinaleStage();
      cancelThreadFollow = null;
      schedule();
    };
    addEventListener('wheel', stop, { passive: false });
    addEventListener('touchmove', stop, { passive: false });
    addEventListener('keydown', keys);
    const threadDuration = 1000;
    const buttonDuration = 600;
    const cameraSettleDuration = 300;
    const step = now => {
      if (cancelled) return;
      if (started === undefined) started = now;
      const elapsed = now - started;
      autoProgress = ease(elapsed / threadDuration);
      autoButtonProgress = clamp((elapsed - threadDuration) / buttonDuration);
      const sample = autoProgress * 128, index = Math.min(127, Math.floor(sample)), fraction = sample - index;
      const a = followSamples[index], b = followSamples[index + 1];
      const bounds = motionBounds(threadSvg), viewBox = threadSvg.viewBox.baseVal;
      const headY = bounds.top + (a.y + (b.y - a.y) * fraction - viewBox.y) / viewBox.height * bounds.height;
      const buttonBounds = motionBounds(button);
      const focusY = elapsed < threadDuration ? headY : buttonBounds.top + buttonBounds.height / 2;
      const delta = previous ? Math.min(64, now - previous) : 16.67;
      previous = now;
      const target = Math.max(scrollY, scrollY + focusY - innerHeight * .6);
      cameraScroll += (target - cameraScroll) * (1 - Math.exp(-delta / 85));
      window.scrollTo({ top: cameraScroll, behavior: 'instant' });
      schedule();
      if (elapsed < threadDuration + buttonDuration + cameraSettleDuration) motionFrame(step);
      else { release(); cancelThreadFollow = null; completeFinaleStage(); }
    };
    motionFrame(step);
  };
  const update = () => {
    frame = 0;
    const threadBounds = motionBounds(threadSvg);
    const runwayBounds = motionBounds(mapRunway);
    const stickyTop = (document.querySelector('body > .site-header')?.getBoundingClientRect().height || 64) + 16;
    const stageGeometry = completedStage
      ? { height: motionBounds(mapStage).height }
      : pinStoryStage(mapStage, runwayBounds, stickyTop);
    if (runwayBounds.top > innerHeight) {
      if (scrollCue) scrollCue.hidden = false;
      return;
    }
    const mapRange = Math.max(1, runwayBounds.height - stageGeometry.height);
    const stageAtRunwayEnd = runwayBounds.bottom <= stickyTop + stageGeometry.height;
    const mapProgress = completedStage || reducedMotion.matches ? 1 : clamp((stickyTop - runwayBounds.top) / (mapRange * .92));
    const endingBounds = motionBounds(button);
    if (!completedStage && !autoStarted && !reducedMotion.matches && stageAtRunwayEnd
      && threadBounds.top < innerHeight * .85 && endingBounds.top > innerHeight * .95) followThreads();
    const manualEndingProgress = clamp((innerHeight * .95 - endingBounds.top) / (innerHeight * .25));
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
    if (scrollCue) scrollCue.hidden = buttonProgress > 0 && endingBounds.top < innerHeight;
    border.style.strokeDashoffset = String(1 - buttonProgress);
    label.style.opacity = String(ease((buttonProgress - .85) / .15));
    button.style.visibility = threadProgress > 0 || reducedMotion.matches ? 'visible' : 'hidden';
    button.disabled = buttonProgress < 1;
    if (buttonProgress === 1 && !autoStarted && !reducedMotion.matches && stageAtRunwayEnd) completeFinaleStage();
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
  const computerMotion = document.createElement('div');
  computerMotion.className = 'computer-scene-motion';
  photoDesktop.before(computerMotion);
  computerMotion.append(computerFrame);
  computerFrame.append(photoDesktop);
  const beam = document.createElement('div');
  beam.className = 'computer-projection';
  beam.setAttribute('aria-hidden', 'true');
  computerSection.append(beam);
  const projectedCases = document.createElement('div');
  projectedCases.className = 'computer-projected-cases';
  projectedCases.setAttribute('aria-label', '사진을 악용한 AI 합성 피해 사례');
  projectedCases.hidden = true;
  const projectedTitleLines = {
    kaylin: ['인스타그램 사진을 이용한', 'AI 성착취 이미지 제작'],
    grok: ['어린 시절 사진을 이용한', 'AI 성착취 이미지 제작·유포'],
    pittman: ['실제 아동 사진과 영상을', 'AI로 합성해 유포']
  };
  const projectionItems = Object.keys(projectedTitleLines)
    .map(id => archiveCases.find(item => item.id === id))
    .filter(Boolean);
  const projectedPreview = document.createElement('img');
  projectedPreview.className = 'computer-case-preview';
  projectedPreview.alt = '';
  projectedPreview.decoding = 'async';
  computerSection.append(projectedPreview);
  const appendTypedText = (element, text) => [...text].flatMap(character => {
    if (character === '\n') {
      element.append(document.createElement('br'));
      return [];
    }
    const letter = document.createElement('span');
    letter.className = 'computer-case-letter';
    letter.textContent = character;
    element.append(letter);
    return letter;
  });
  let openProjectedCard = null;
  let projectedPreviewEntrance;
  let projectedPreviewRequest = 0;
  const setOpenProjectedCard = card => {
    if (openProjectedCard === card) return;
    const request = ++projectedPreviewRequest;
    openProjectedCard?.classList.remove('is-open');
    openProjectedCard = card;
    openProjectedCard?.classList.add('is-open');
    const image = card?.querySelector('.computer-case-image');
    const previewSource = image?.getAttribute('src');
    projectedPreviewEntrance?.cancel();
    if (!previewSource) {
      projectedPreview.removeAttribute('src');
      return;
    }
    image.decode().then(() => {
      if (request !== projectedPreviewRequest) return;
      projectedPreview.src = previewSource;
      if (reducedMotion.matches) return;
      projectedPreviewEntrance = projectedPreview.animate([
        { transform: 'translate(-50%, calc(-50% + 28px))', opacity: 0 },
        { transform: 'translate(-50%, -50%)', opacity: 1 }
      ], { duration: 650, easing: 'cubic-bezier(.25, .55, .35, 1)' });
    }).catch(() => {
      if (request === projectedPreviewRequest) projectedPreview.removeAttribute('src');
    });
  };
  projectionItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'computer-projected-case';
    card.tabIndex = 0;
    card.setAttribute('aria-label', item.title);
    const title = document.createElement('h3');
    title.className = 'computer-case-title';
    for (const line of projectedTitleLines[item.id] ?? [item.title]) {
      const titleLine = document.createElement('span');
      titleLine.textContent = line;
      title.append(titleLine);
    }
    const copy = document.createElement('div');
    copy.className = 'computer-case-copy';
    const summary = document.createElement('p');
    const summaryLetters = appendTypedText(summary, item.summary);
    const source = document.createElement('a');
    const sourceLetters = appendTypedText(source, '원문 보기 ↗');
    if (item.sources[0]) source.href = item.sources[0];
    else source.hidden = true;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    copy.append(summary);
    if (item.image) {
      const image = document.createElement('img');
      image.className = 'computer-case-image';
      image.src = item.image;
      image.alt = '';
      image.decoding = 'async';
      copy.append(image);
    }
    copy.append(source);
    card.append(title, copy);
    let typingStarted = false;
    const startTyping = () => {
      if (typingStarted) return;
      typingStarted = true;
      const letters = [...summaryLetters, ...sourceLetters];
      if (reducedMotion.matches) {
        card.classList.add('is-typed');
        return;
      }
      let started;
      let shown = 0;
      const type = now => {
        started ??= now;
        const count = Math.min(letters.length, Math.max(0, Math.floor((now - started - 200) / 9)));
        while (shown < count) letters[shown++].classList.add('is-visible');
        if (shown < letters.length) motionFrame(type);
        else card.classList.add('is-typed');
      };
      motionFrame(type);
    };
    const openCard = () => {
      setOpenProjectedCard(card);
      startTyping();
    };
    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') {
        if (!projectedCases.hidden) playSceneSound('deep_hover.wav');
        openCard();
      }
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && openProjectedCard === card &&
          !card.querySelector(':focus-visible') && !card.matches(':focus-visible')) {
        setOpenProjectedCard(null);
      }
    });
    card.addEventListener('focusin', event => {
      if (event.target.matches(':focus-visible')) openCard();
    });
    card.addEventListener('focusout', event => {
      if (openProjectedCard === card && !card.contains(event.relatedTarget)) {
        setOpenProjectedCard(null);
      }
    });
    card.addEventListener('click', event => {
      if (event.pointerType === 'mouse' || event.target.closest('a')) return;
      if (openProjectedCard === card) setOpenProjectedCard(null);
      else openCard();
    });
    projectedCases.append(card);
  });
  document.addEventListener('pointerdown', event => {
    if (openProjectedCard && !openProjectedCard.contains(event.target)) setOpenProjectedCard(null);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpenProjectedCard(null);
  });
  computerSection.append(projectedCases);
  const revealProjection = async () => {
    if (!reducedMotion.matches) {
      const background = photoDesktop.querySelector('.desktop-background');
      const fade = background.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 260,
        easing: 'ease-out',
        fill: 'forwards'
      });
      await fade.finished.catch(() => {});
    }
    computerSection.classList.add('is-desktop-hidden');
    const enlargeEditor = () => {
      const start = editor.getBoundingClientRect();
      computerSection.classList.add('is-projecting');
      photoDesktop.style.transform = 'none';
      photoDesktop.style.opacity = '1';
      photoDesktop.style.willChange = 'auto';
      const showCases = () => {
        projectedCases.hidden = false;
        computerSection.classList.add('has-projected-cases');
      };
      const end = editor.getBoundingClientRect();
      if (reducedMotion.matches || !start.width || !end.width) {
        showCases();
        return;
      }

      // Animate the finished layout as one layer, starting at the editor's old bounds.
      const origin = computerMotion.getBoundingClientRect();
      const scale = start.width / end.width;
      const x = start.left - origin.left - (end.left - origin.left) * scale;
      const y = start.top - origin.top - (end.top - origin.top) * scale;
      const slide = computerMotion.animate([
        { transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})` },
        { transform: 'translate3d(0, 0, 0) scale(1)' }
      ], { duration: 560, easing: 'cubic-bezier(.45,0,.22,1)' });
      slide.finished.then(showCases, showCases);
    };
    enlargeEditor();
  };
  const generateButton = photoDesktop.querySelector('.desktop-generate');
  const editor = photoDesktop.querySelector('.desktop-editor');
  let generating = false;
  const readyToGenerate = () => {
    generateButton.setAttribute('aria-disabled', 'false');
  };
  const resultArea = photoDesktop.querySelector('.desktop-results');
  const resultSlot = resultArea.lastElementChild;
  const resultX = resultSlot.x.baseVal.value;
  const pixelWidth = resultSlot.width.baseVal.value / 10;
  const processTemplate = photoDesktop.querySelector('.desktop-process-entry');
  const processArea = photoDesktop.querySelector('.desktop-process');
  processTemplate.remove();
  const codeLines = [
    'const source =', '  uploadedPhotos;', '', 'analyze(source);', 'extractFeatures();', '',
    'const output =', '  compose({', '    reference: source,', '    background: newScene', '  });', '',
    'render(output);', 'saveToHistory();'
  ];
  const createResult = seed => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'desktop-generated-panel');
    group.setAttribute('transform', `translate(${resultX} 37)`);
    resultArea.append(group);
    const pixels = Array.from({ length: 150 }, (_, index) => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(index % 10 * pixelWidth));
      rect.setAttribute('y', String(Math.floor(index / 10) * (26.6 / 15)));
      rect.setAttribute('width', String(pixelWidth + .02));
      rect.setAttribute('height', String(26.6 / 15 + .02));
      rect.setAttribute('fill', '#121516');
      group.append(rect);
      // Spread outward from the lower-left corner, with a slightly uneven edge.
      const column = index % 10;
      const row = Math.floor(index / 10);
      const distance = Math.hypot(column / 9, (14 - row) / 14) / Math.SQRT2;
      const variation = (index * 37 + seed * 19) % 53 / 53;
      return { rect, order: distance * .94 + variation * .06, shade: 158 + (index * 31 + seed * 17) % 70 };
    });
    return { group, pixels };
  };
  const generate = () => {
    if (generating || generateButton.getAttribute('aria-disabled') === 'true') return;
    generating = true;
    playSceneSound('generate.wav');
    generateButton.setAttribute('aria-disabled', 'true');
    expandTypingInput(false);
    photoDesktop.classList.add('is-generating');
    const status = photoDesktop.querySelector('.desktop-process-status');
    const progressBar = photoDesktop.querySelector('.desktop-process-progress');
    let previousResult = null;
    let previousLog = null;
    const nextResult = number => {
      const result = createResult(number);
      const log = processTemplate.cloneNode(true);
      processArea.append(log);
      const processCode = log.querySelector('.desktop-process-code');
      const started = performance.now();
      let pixelSoundPlayed = false;
      const draw = now => {
        const progress = reducedMotion.matches ? 1 : Math.min(1, (now - started) / 2200);
        status.textContent = `이미지 ${number + 1} / 3 · ${Math.round(progress * 100)}%`;
        progressBar.setAttribute('width', String(7.55 * (number + progress) / 3));
        processCode.replaceChildren();
        codeLines.slice(0, Math.ceil(progress * codeLines.length)).forEach((text, index) => {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          line.setAttribute('x', processCode.getAttribute('x'));
          line.setAttribute('y', String(23 + index * .85));
          line.textContent = text;
          processCode.append(line);
        });
        result.pixels.forEach(({ rect, order, shade }) => {
          const reveal = Math.max(0, Math.min(1, (progress * 1.5 - order) * 3));
          const gray = Math.round(20 + (shade - 20) * reveal);
          rect.setAttribute('fill', `rgb(${gray},${gray},${gray})`);
          if (!pixelSoundPlayed && gray > 24) {
            pixelSoundPlayed = true;
            playSceneSound('photo.wav');
          }
        });
        if (progress < 1) { motionFrame(draw); return; }
        if (number === 2) {
          status.textContent = '3개 이미지 생성 완료';
          photoDesktop.classList.add('is-generated');
          setTimeout(revealProjection, reducedMotion.matches ? 0 : 300);
          return;
        }
        // Scroll full-size results through the clipped viewport.
        const scrollDistance = 26.6 + .5;
        let slideStarted;
        const slide = time => {
          slideStarted ??= time;
          const t = reducedMotion.matches ? 1 : Math.min(1, (time - slideStarted) / 420);
          const eased = t * t * (3 - 2 * t);
          const offset = eased * scrollDistance;
          result.group.setAttribute('transform', `translate(${resultX} ${37 - offset})`);
          log.setAttribute('transform', `translate(0 ${18 * (1 - eased)})`);
          previousResult?.setAttribute('transform', `translate(${resultX} ${37 - scrollDistance - offset})`);
          if (previousLog) previousLog.style.opacity = String(1 - eased);
          if (t < 1) motionFrame(slide);
          else {
            previousResult?.remove();
            previousLog?.remove();
            previousResult = result.group;
            previousLog = log;
            nextResult(number + 1);
          }
        };
        setTimeout(() => motionFrame(slide), reducedMotion.matches ? 0 : 120);
      };
      motionFrame(draw);
    };
    nextResult(0);
  };
  generateButton.addEventListener('click', generate);
  generateButton.addEventListener('keydown', event => {
    if (['Enter', ' '].includes(event.key)) { event.preventDefault(); generate(); }
  });
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
  photoDesktop.addEventListener('pointerover', event => {
    photoDesktop.classList.toggle('is-photo-group-hovered', Boolean(event.target.closest('.desktop-photo:not(.is-placed)')));
  });
  photoDesktop.addEventListener('pointerleave', () => photoDesktop.classList.remove('is-photo-group-hovered'));
  const point = event => new DOMPoint(event.clientX, event.clientY).matrixTransform(photoDesktop.getScreenCTM().inverse());
  const galleryBounds = photoDesktop.querySelector('.desktop-selection-surface').getBBox();
  const dropHint = photoDesktop.querySelector('.desktop-drop-hint');
  const dropZone = photoDesktop.querySelector('.desktop-drop-zone');
  const dragGuide = photoDesktop.querySelector('.desktop-drag-guide');
  const guideX = Number(photos[0].dataset.x) + 1.65;
  const guideY = Number(photos[0].dataset.y) + 2.075;
  dragGuide.setAttribute('cx', guideX);
  dragGuide.setAttribute('cy', guideY);
  const alignDragGuide = () => {
    const desktopMatrix = photoDesktop.getScreenCTM();
    const hintMatrix = dropHint.getScreenCTM();
    if (!desktopMatrix || !hintMatrix || dropHint.style.display === 'none') return;
    const { x, y, width, height } = dropHint.getBBox();
    const hintToDesktop = desktopMatrix.inverse().multiply(hintMatrix);
    const guideTarget = new DOMPoint(x + width / 2, y + height / 2).matrixTransform(hintToDesktop);
    dragGuide.style.setProperty('--guide-drag-x', `${guideTarget.x - guideX}px`);
    dragGuide.style.setProperty('--guide-drag-y', `${guideTarget.y - guideY}px`);
  };
  alignDragGuide();
  if (document.fonts.status === 'loading') document.fonts.ready.then(alignDragGuide);
  const promptText = photoDesktop.querySelector('.desktop-prompt-text');
  const demonstrationPrompt = '업로드한 사진을 참조하여\n인물의 얼굴과 배경을 다른 이미지에 합성해줘.';
  let promptTimer;
  let keyboardSound;
  let placedCount = 0;
  let inputExpanding = false;
  let promptValue = '';
  const inputBox = photoDesktop.querySelector('.desktop-prompt-box');
  const promptLabel = photoDesktop.querySelector('.desktop-prompt-label');
  const inputPanel = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  inputPanel.setAttribute('class', 'desktop-growing-input');
  inputPanel.append(inputBox, promptLabel, promptText);
  editor.append(inputPanel);
  // Photos stay above the prompt box while dragging.
  photos.forEach(photo => photoDesktop.append(photo));
  photoDesktop.append(dragGuide);
  const restingInput = { x: 78, y: 42, width: inputBox.width.baseVal.value, height: 19, fontSize: .7, labelSize: .64, textInset: 0, textLeft: 1.2, bodyTop: 2.95 };
  const inputLayout = { ...restingInput };
  const expandTypingInput = (expand = true) => {
    inputExpanding = true;
    const from = { ...inputLayout };
    const to = expand ? { x: 65.6, y: 40, width: 53.5, height: 9.5, fontSize: 1.6, labelSize: .95, textInset: .45, textLeft: 2, bodyTop: 3.7 }
      : restingInput;
    let started;
    let typingStarted = false;
    const step = now => {
      if (started === undefined) started = now;
      const progress = reducedMotion.matches ? 1 : Math.min(1, (now - started) / 950);
      const eased = 1 - Math.pow(1 - progress, 3);
      Object.keys(to).forEach(key => { inputLayout[key] = from[key] + (to[key] - from[key]) * eased; });
      ['x', 'y', 'width', 'height'].forEach(key => inputBox.setAttribute(key, inputLayout[key]));
      const textX = inputLayout.x + inputLayout.textLeft;
      promptLabel.setAttribute('x', textX);
      promptLabel.setAttribute('y', inputLayout.y + inputLayout.textInset + 1.5);
      promptLabel.setAttribute('font-size', inputLayout.labelSize);
      inputBox.setAttribute('stroke', '#ddb1d1');
      inputBox.setAttribute('stroke-width', '.15');
      showPrompt(promptValue);
      if (expand && !typingStarted && progress >= .35) {
        typingStarted = true;
        clearTimeout(promptTimer);
        promptTimer = setTimeout(typeDemonstration, 450);
      }
      if (progress < 1) motionFrame(step);
      else inputExpanding = false;
    };
    motionFrame(step);
  };
  const showPrompt = text => {
    promptValue = text;
    const textX = inputLayout.x + inputLayout.textLeft;
    promptText.replaceChildren();
    promptText.setAttribute('font-size', String(inputLayout.fontSize));
    promptText.setAttribute('fill', '#eee');
    promptText.setAttribute('font-weight', '400');
    const lines = [];
    const lineLength = Math.max(10, Math.floor((inputLayout.width - inputLayout.textLeft - 1.4) / inputLayout.fontSize));
    const paragraphs = text.split('\n');
    paragraphs.forEach(paragraph => {
      let line = '';
      paragraph.split(' ').forEach(word => {
        if (line && line.length + 1 + word.length > lineLength) {
          lines.push(line);
          line = word;
        } else line += (line ? ' ' : '') + word;
      });
      if (line) lines.push(line);
    });
    lines.forEach((textLine, index) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      line.setAttribute('x', String(textX));
      line.setAttribute('y', String(inputLayout.y + inputLayout.textInset + inputLayout.bodyTop + index * inputLayout.fontSize * 1.5));
      line.textContent = textLine;
      promptText.append(line);
    });
  };
  const typeDemonstration = () => {
    clearTimeout(promptTimer);
    keyboardSound = playSceneSound('keyboard.wav');
    let length = 0;
    const tick = () => {
      showPrompt(demonstrationPrompt.slice(0, ++length));
      if (length < demonstrationPrompt.length) promptTimer = setTimeout(tick, 24);
      else {
        keyboardSound?.pause();
        keyboardSound = undefined;
        readyToGenerate();
      }
    };
    if (reducedMotion.matches) { showPrompt(demonstrationPrompt); readyToGenerate(); }
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
      const left = Math.max(galleryBounds.x, Math.min(action.start.x, current.x));
      const top = Math.max(galleryBounds.y, Math.min(action.start.y, current.y));
      const right = Math.min(galleryBounds.x + galleryBounds.width, Math.max(action.start.x, current.x));
      const bottom = Math.min(galleryBounds.y + galleryBounds.height, Math.max(action.start.y, current.y));
      marquee.setAttribute('x', left); marquee.setAttribute('y', top);
      marquee.setAttribute('width', Math.max(0,right-left)); marquee.setAttribute('height', Math.max(0,bottom-top));
      photos.forEach(photo => {
        const x = Number(photo.dataset.x), y = Number(photo.dataset.y);
        setSelected(photo, !photo.classList.contains('is-placed') && (action.previous.has(photo) || (x < right && x+3.3 > left && y < bottom && y+4.15 > top)));
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
      const at = !cancel && Number.isFinite(event.clientX)
        ? new DOMPoint(event.clientX, event.clientY).matrixTransform(dropZone.getScreenCTM().inverse())
        : null;
      const zone = dropZone.getBBox();
      const dropped = at && at.x >= zone.x && at.x <= zone.x + zone.width
        && at.y >= zone.y && at.y <= zone.y + zone.height && action.origins.length > 0;
      const columns = 4;
      const rowStep = 4;
      const placedScale = .72;
      const gridHeight = (Math.ceil(photos.length / columns) - 1) * rowStep + 4.15 * placedScale;
      action.origins.forEach(({item,x,y}) => {
        if (dropped) {
          const slot = placedCount++;
          const rowWidth = (columns - 1) * 3.1 + 3.3 * placedScale;
          item.dataset.x = zone.x + (zone.width - rowWidth) / 2 + (slot % columns) * 3.1;
          item.dataset.y = zone.y + (zone.height - gridHeight) / 2 + Math.floor(slot / columns) * rowStep;
          setSelected(item, false);
          item.classList.add('is-placed');
          editor.insertBefore(item, inputPanel);
          item.setAttribute('tabindex', '-1');
          item.setAttribute('aria-label', '편집 창에 놓인 사진');
        } else {
          // Keep unsuccessful drops inside the gallery.
          const galleryPoint = at && point(event);
          const galleryRight = galleryBounds.x + galleryBounds.width;
          const galleryBottom = galleryBounds.y + galleryBounds.height;
          const galleryDrop = galleryPoint && galleryPoint.x >= galleryBounds.x && galleryPoint.x <= galleryRight
            && galleryPoint.y >= galleryBounds.y && galleryPoint.y <= galleryBottom;
          const origins = action.origins;
          const groupDx = Math.max(galleryBounds.x + .4 - Math.min(...origins.map(o => o.x)), Math.min(galleryRight - 4 - Math.max(...origins.map(o => o.x)), action.dx));
          const groupDy = Math.max(galleryBounds.y + .5 - Math.min(...origins.map(o => o.y)), Math.min(galleryBottom - 5 - Math.max(...origins.map(o => o.y)), action.dy));
          item.dataset.x = galleryDrop ? x + groupDx : x;
          item.dataset.y = galleryDrop ? y + groupDy : y;
        }
        item.setAttribute('transform', `translate(${item.dataset.x} ${item.dataset.y})${item.classList.contains('is-placed') ? ` scale(${placedScale})` : ''}`);
      });
      if (dropped) {
        playSceneSound('deep_photo.wav');
        dragGuide.style.display = 'none';
        clear();
        photoDesktop.classList.remove('is-photo-group-hovered');
        if (document.activeElement?.closest('.desktop-photo')) document.activeElement.blur();
        dropHint.style.display = 'none';
        clearTimeout(promptTimer);
        keyboardSound?.pause();
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
    else if (photo && event.key === 'Enter' && !photo.classList.contains('is-placed')) {
      event.preventDefault();
      selectPhotoGroup();
      action = { type: 'move', pointer: 1, dx: 0, dy: 0,
        origins: [...selected].map(item => ({ item, x: Number(item.dataset.x), y: Number(item.dataset.y) })) };
      const zone = dropZone.getBBox();
      const drop = new DOMPoint(zone.x + zone.width / 2, zone.y + zone.height / 2)
        .matrixTransform(dropZone.getScreenCTM());
      finish({ pointerId: 1, clientX: drop.x, clientY: drop.y });
    }
    else if (photo && event.key === ' ') { event.preventDefault(); setSelected(photo,!selected.has(photo)); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') { event.preventDefault(); photos.filter(photo => !photo.classList.contains('is-placed')).forEach(photo => setSelected(photo,true)); }
  });
}

// Scroll-linked entrances for the case videos.
const rightsCaseEntries = [...document.querySelectorAll('.rights-case-story')].map(element => ({
  element, top: 0, offsetY: 0
}));
if (rightsCaseEntries.length) {
  let frame = 0;
  let viewportHeight = innerHeight;
  let amplitude = 160;
  const update = () => {
    frame = 0;
    const scrollTop = scrollY;
    rightsCaseEntries.forEach(entry => {
      const progress = Math.max(0, Math.min(1, (scrollTop + viewportHeight * .95 - entry.top) / (viewportHeight * .42)));
      const eased = progress * progress * (3 - 2 * progress);
      entry.offsetY = reducedMotion.matches ? 0 : amplitude * (1 - eased);
      const transform = entry.offsetY < .01 ? 'none' : `translate3d(0, ${entry.offsetY.toFixed(3)}px, 0)`;
      if (entry.element.style.transform !== transform) entry.element.style.transform = transform;
      const opacity = reducedMotion.matches ? '1' : String(eased);
      if (entry.element.style.opacity !== opacity) entry.element.style.opacity = opacity;
    });
  };
  const schedule = () => { if (!frame) frame = motionFrame(update); };
  const measure = () => {
    viewportHeight = innerHeight;
    amplitude = Math.min(innerWidth * .13, 190);
    rightsCaseEntries.forEach(entry => {
      const bounds = entry.element.getBoundingClientRect();
      entry.top = bounds.top + scrollY - entry.offsetY;
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

// Pause the large looping clips and the computer guide outside the viewport.
const rightsVideos = [...document.querySelectorAll('.rights-case-story video')];
const visibleRightsVideos = new Set();
const syncRightsVideos = () => {
  rightsVideos.forEach(video => {
    if (!document.hidden && visibleRightsVideos.has(video)) {
      if (video.paused) video.play().catch(() => {});
    } else if (!video.paused) video.pause();
  });
};
if ('IntersectionObserver' in window) {
  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (target === photoDesktop) target.classList.toggle('is-in-view', isIntersecting);
      else {
        const video = target.querySelector('video');
        if (isIntersecting) visibleRightsVideos.add(video);
        else visibleRightsVideos.delete(video);
      }
    });
    syncRightsVideos();
  });
  rightsVideos.forEach(video => sceneObserver.observe(video.closest('.rights-case-story')));
  if (photoDesktop) sceneObserver.observe(photoDesktop);
} else {
  rightsVideos.forEach(video => visibleRightsVideos.add(video));
  photoDesktop?.classList.add('is-in-view');
}
document.addEventListener('visibilitychange', syncRightsVideos);
syncRightsVideos();

// Start the crime-summary video when the reader reaches it, and resume on return.
const spreadStoryVideo = document.querySelector('.spread-story-video');
if (spreadStoryVideo) {
  let inView = !('IntersectionObserver' in window);
  const syncPlayback = () => {
    if (inView && !document.hidden) spreadStoryVideo.play().catch(() => {});
    else spreadStoryVideo.pause();
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= .25;
      syncPlayback();
    }, { threshold: .25 });
    observer.observe(spreadStoryVideo);
  } else syncPlayback();
  document.addEventListener('visibilitychange', syncPlayback);
}

// Unspecified sections share the people's soft upward, fading entrance.
const floatingSectionParts = [...document.querySelectorAll(
  '.crime-summary .spread-story-video, ' +
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
      const visual = element.matches('.spread-story-video, .social-figure');
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
