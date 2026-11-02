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

if (impact) {
  const paths = [...impact.querySelectorAll(".impact-lines path")];
  const labels = [...impact.querySelectorAll(".impact-list li")];
  const pathLengths = paths.map((path) => {
    path.removeAttribute("pathLength");
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    return length;
  });

  const links = [...impact.querySelectorAll(".impact-list a")];
  let readyTimer;
  let linksReady = false;
  const setLinksReady = (ready) => {
    linksReady = ready;
    impact.classList.toggle("is-navigable", ready);
    links.forEach((link) => {
      link.setAttribute("aria-disabled", String(!ready));
      link.tabIndex = ready ? 0 : -1;
    });
  };
  links.forEach((link) => link.addEventListener("click", (event) => {
    if (!linksReady) event.preventDefault();
  }));

  const updateImpact = () => {
    const animated = !reducedMotion.matches;
    impact.classList.toggle("impact-scroll", animated);
    const bounds = impact.getBoundingClientRect();
    const distance = Math.max(1, impact.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -bounds.top / distance));
    // Smaller values make the lines appear with less scrolling.
    const lineStagger = 0.12; // Scroll progress between each line's start.
    const lineDuration = 0.08; // Scroll progress needed to draw one line.
    let complete = true;
    paths.forEach((path, index) => {
      const start = index * lineStagger;
      const lineProgress = animated ? Math.max(0, Math.min(1, (progress - start) / lineDuration)) : 1;
      if (lineProgress < 1) complete = false;
      const active = lineProgress >= 0.5;
      path.style.strokeDashoffset = String(pathLengths[index] * (1 - lineProgress));
      path.style.opacity = lineProgress > 0 ? "1" : "0";
      path.classList.toggle("is-active", active);
      labels[index]?.classList.toggle("is-active", lineProgress >= 1);
    });
    if (!complete) {
      clearTimeout(readyTimer);
      readyTimer = undefined;
      setLinksReady(false);
    } else if (!linksReady && readyTimer === undefined) {
      // Wait for the final stroke transition before enabling every label.
      readyTimer = setTimeout(() => {
        setLinksReady(true);
        readyTimer = undefined;
      }, animated ? 180 : 0);
    }
  };

  let impactFramePending = false;
  const scheduleImpact = () => {
    if (impactFramePending) return;
    impactFramePending = true;
    requestAnimationFrame(() => {
      updateImpact();
      impactFramePending = false;
    });
  };
  window.addEventListener("scroll", scheduleImpact, { passive: true });
  window.addEventListener("resize", scheduleImpact);
  reducedMotion.addEventListener("change", scheduleImpact);
  updateImpact();
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
  const renderAnalysisRow = (row, length) => {
    const { label, value, split } = analysisRows.get(row);
    const text = row.dataset.text.slice(0, length);
    label.textContent = text.slice(0, split);
    value.textContent = text.slice(split);
  };
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
  const setAnalysis = (open) => {
    if (active === open) return;
    active = open;
    clearTimeout(typingTimer);
    section.classList.toggle("is-analyzing", open);
    portraitInteraction.classList.toggle("is-open", open);
    portraitInteraction.setAttribute("aria-pressed", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    rows.forEach((row) => { renderAnalysisRow(row, 0); row.classList.remove("is-typing"); });
    if (!open) return;
    if (reducedMotion.matches) {
      rows.forEach((row) => { renderAnalysisRow(row, row.dataset.text.length); });
      return;
    }
    let rowIndex = 0;
    let charIndex = 0;
    const type = () => {
      const row = rows[rowIndex];
      row.classList.add("is-typing");
      renderAnalysisRow(row, ++charIndex);
      if (charIndex < row.dataset.text.length) {
        typingTimer = setTimeout(type, 65);
      } else {
        row.classList.remove("is-typing");
        rowIndex++;
        charIndex = 0;
        if (rowIndex < rows.length) typingTimer = setTimeout(type, 220);
      }
    };
    typingTimer = setTimeout(type, 650);
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


const spread = document.querySelector(".spread");
if (spread) {
  let step = 0;
  let playbackTimers = [];
  // Automatic sharing sequence timings (milliseconds).
  const galleryDuration = 4000;
  const next = spread.querySelector(".spread-next");
  const back = spread.querySelector(".spread-back");
  const scrollPrompt = spread.querySelector(".spread-scroll-prompt");
  spread.querySelector(".share-posted-notice").addEventListener("animationend", (event) => {
    if (event.animationName === "share-save" && step === 2) scrollPrompt.hidden = false;
  });
  const hints = ["아이콘을 눌러 아이 사진을 공유해보세요.", "공유된 사진이 다른 사람의 갤러리에 저장됩니다.", "저장된 사진이 SNS에 다시 업로드됩니다.", "공유하기 전, 사진 속 아이의 정보를 한 번 더 확인해주세요."];
  const stopPlayback = () => {
    playbackTimers.forEach(clearTimeout);
    playbackTimers = [];
    scrollPrompt.hidden = true;
  };
  const renderSpread = () => {
    spread.dataset.step = String(step);
    spread.querySelector(".spread-routes").setAttribute("aria-hidden", "true");
    spread.querySelector(".spread-details").setAttribute("aria-hidden", "true");
    next.hidden = step !== 0;
    next.querySelector("span").textContent = "공유하기";
    spread.querySelector(".spread-progress").textContent = `${step + 1} / 3`;
    spread.querySelector(".spread-hint").textContent = hints[step];
    back.hidden = step === 0;
    back.disabled = step === 0;
    back.textContent = "처음으로";
  };
  const startPlayback = () => {
    stopPlayback();
    step = 1;
    renderSpread();
    playbackTimers.push(setTimeout(() => { step = 2; renderSpread(); }, galleryDuration));

  };
  next.addEventListener("click", startPlayback);
  back.addEventListener("click", () => {
    stopPlayback();
    step = 0;
    renderSpread();
    next.focus({ preventScroll: true });
  });
  renderSpread();
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
  const filters = [...caseExplorer.querySelectorAll(".case-filters button")];
  // This array retains the original date order even after DOM reordering.
  const cards = [...caseExplorer.querySelectorAll(".case-card")];
  const field = caseExplorer.querySelector(".case-field");
  const moves = new Map();
  filters.forEach((button) => button.addEventListener("click", () => {
    const category = button.dataset.filter;
    const all = category === "all";
    const previous = new Map(cards.map((card) => [card, card.getBoundingClientRect()]));
    moves.forEach((animation) => animation.cancel());
    moves.clear();
    let matches = 0;
    caseExplorer.classList.toggle("has-filter", !all);
    filters.forEach((filter) => filter.setAttribute("aria-pressed", String(filter === button)));
    cards.forEach((card) => {
      const match = card.dataset.categories.split(/\s+/).includes(category);
      if (all || match) matches++;
      card.classList.toggle("is-match", !all && match);
      card.classList.toggle("is-dimmed", !all && !match);
      const disabled = !all && !match;
      card.setAttribute("aria-disabled", String(disabled));
      card.tabIndex = disabled ? -1 : 0;
    });
    const isMatch = (card) => card.dataset.categories.split(/\s+/).includes(category);
    // Stable grouping keeps chronological order within both groups.
    const ordered = all ? cards : [...cards.filter(isMatch), ...cards.filter((card) => !isMatch(card))];
    field.append(...ordered);
    const destinations = new Map(cards.map((card) => [card, card.getBoundingClientRect()]));
    if (!reducedMotion.matches) {
      ordered.forEach((card, index) => {
        const before = previous.get(card);
        const after = destinations.get(card);
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        const animation = card.animate([
          { translate: `${dx}px ${dy}px` },
          { translate: "0px 0px" }
        ], {
          duration: 1120,
          delay: Math.min(index * 12, 140),
          easing: "cubic-bezier(0.45, 0, 0.2, 1)",
          fill: "backwards"
        });
        moves.set(card, animation);
        animation.onfinish = () => moves.delete(card);
      });
    }
    caseExplorer.querySelector(".case-status").textContent = all ? `전체 ${cards.length}개 사례 · 날짜순` : `${button.textContent}: ${matches}개 사례 · 해당 사례 먼저 · 그룹 내 날짜순`;
  }));
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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        caseExplorer.classList.add("is-visible");
        caseExplorer.querySelector("#cases-title").focus({ preventScroll: true });
      });
    });
  };
  exploreButton.addEventListener("click", openCases);
  archiveLink?.addEventListener("click", openCases);
  let returnTarget = "#home";
  casesDialog.querySelectorAll(".site-header a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.getAttribute("href");
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
    returnTarget = "#home";
  });
}


const caseDetail = document.querySelector(".case-detail");
if (caseExplorer && caseDetail) {
  caseDetail.querySelector(".case-detail-exit").addEventListener("click", () => caseDetail.close());
  const detailCards = [...caseExplorer.querySelectorAll(".case-card")];
  const previousCase = caseDetail.querySelector(".case-detail-prev");
  const nextCase = caseDetail.querySelector(".case-detail-next");
  const position = caseDetail.querySelector(".case-detail-position");
  const availableCards = () => [...caseExplorer.querySelectorAll('.case-card:not([aria-disabled="true"])')];
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

// A visual simulation: no photo is uploaded or sent to a platform.
const footprint = document.querySelector(".footprint");
if (footprint) {
  const artwork = footprint.querySelector(".footprint-artwork");
  const phone = footprint.querySelector(".footprint-phone");
  const phoneArtwork = footprint.querySelector(".footprint-base");
  // Preload the still version so the first tap can stop the shimmer immediately.
  const stillArtwork = new Image();
  stillArtwork.src = "./images/digital-foreground-still.svg";
  const confirm = footprint.querySelector(".footprint-confirm");
  const copies = [...footprint.querySelectorAll(".footprint-copy")];
  const ending = footprint.querySelector(".footprint-ending");
  const status = footprint.querySelector(".footprint-status");
  const platforms = ["블로그", "유튜브", "인스타", "페이스북", "X"];
  const network = footprint.querySelector(".footprint-network");
  const lineGroups = platforms.map(() => []);
  [...network.querySelectorAll("path")].forEach((path, index) => {
    lineGroups[Math.min(4, Math.floor(index / 4))].push(path);
  });
  let timers = [];
  let sharing = false;
  // Slower successive popup gaps: 800ms → 650ms → 500ms → 400ms.
  const popupTimes = [0, 800, 1450, 1950, 2350];
  const reset = () => {
    timers.forEach(clearTimeout);
    timers = [];
    sharing = false;
    phoneArtwork.src = "./images/digital-foreground.svg";
    footprint.querySelector(".footprint-yes").disabled = false;
    footprint.classList.remove("is-sharing");
    ending.hidden = true;
    phone.disabled = false;
    confirm.classList.remove("is-stacked");
    confirm.classList.remove("is-dismissing");
    copies.forEach((card) => { card.hidden = true; });
    artwork.style.setProperty("--line-opacity", "0");
    lineGroups.flat().forEach((path) => path.classList.remove("is-drawn"));
    artwork.style.setProperty("--share-opacity", "0");
    status.textContent = "";
  };
  phone.addEventListener("click", () => {
    if (!sharing) {
      phoneArtwork.src = stillArtwork.src;
      confirm.showModal();
      footprint.querySelector("#footprint-question").focus({ preventScroll: true });
    }
  });
  footprint.querySelector(".footprint-no").addEventListener("click", () => confirm.close());
  footprint.querySelector(".footprint-yes").addEventListener("click", () => {
    if (sharing) return;
    footprint.querySelector(".footprint-yes").disabled = true;
    sharing = true;
    phone.disabled = true;
    footprint.classList.add("is-sharing");
    artwork.style.setProperty("--line-opacity", "0");
    lineGroups.flat().forEach((path) => path.classList.remove("is-drawn"));
    const revealPlatform = (index) => {
      if (index > 0) {
        confirm.classList.add("is-stacked");
        copies[index - 1].hidden = false;
      }
      status.textContent = `${platforms[index]} 공유 상태창`;
    };
    popupTimes.forEach((delay, index) => {
      timers.push(setTimeout(() => revealPlatform(index), delay));
    });
    const dismissAt = popupTimes[popupTimes.length - 1] + 900;
    const fadeDuration = reducedMotion.matches ? 0 : 180;
    timers.push(setTimeout(() => confirm.classList.add("is-dismissing"), dismissAt));
    timers.push(setTimeout(() => {
      confirm.close();
      status.textContent = "공유된 사진이 연결되고 온라인에 흔적이 남습니다.";
      // The network starts only after every popup has disappeared.
      lineGroups.forEach((paths, index) => {
        timers.push(setTimeout(() => {
          artwork.style.setProperty("--line-opacity", ["0.4", "0.6", "0.8", "0.9", "1"][index]);
          artwork.style.setProperty("--share-opacity", ["0", "0.1", "0.35", "0.7", "1"][index]);
          paths.forEach((path) => path.classList.add("is-drawn"));
        }, index * 180));
      });
      timers.push(setTimeout(() => { ending.hidden = false; }, 2300));
    }, dismissAt + fadeDuration));
  });
  footprint.querySelector(".footprint-reset").addEventListener("click", () => {
    reset();
    phone.focus({ preventScroll: true });
  });
}

// Reveal the final connector when the Explore destination enters view.
const finalExplore = document.querySelector(".footprint .explore-action");
if (finalExplore) {
  const button = finalExplore.querySelector(".explore-button");
  let hasFormed = false;
  const formButton = () => {
    if (hasFormed) return;
    hasFormed = true;
    if (!reducedMotion.matches) {
      const root = document.documentElement;
      const oldRootOverflow = root.style.overflow;
      const oldBodyOverflow = document.body.style.overflow;
      const oldPadding = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - root.clientWidth;
      const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      let released = false;
      let fallback;
      const stopScroll = (event) => event.preventDefault();
      const stopKeys = (event) => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) event.preventDefault();
        if (event.key === "Escape") release();
      };
      const text = button.querySelector("span");
      const onFinished = (event) => {
        if (event.target === text && event.propertyName === "opacity") release();
      };
      const release = () => {
        if (released) return;
        released = true;
        clearTimeout(fallback);
        root.style.overflow = oldRootOverflow;
        document.body.style.overflow = oldBodyOverflow;
        document.body.style.paddingRight = oldPadding;
        window.removeEventListener("wheel", stopScroll);
        window.removeEventListener("touchmove", stopScroll);
        window.removeEventListener("keydown", stopKeys);
        text.removeEventListener("transitionend", onFinished);
      };
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${padding + scrollbarWidth}px`;
      root.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      window.addEventListener("wheel", stopScroll, { passive: false });
      window.addEventListener("touchmove", stopScroll, { passive: false });
      window.addEventListener("keydown", stopKeys);
      text.addEventListener("transitionend", onFinished);
      // Also release if the transition is interrupted or the tab becomes inactive.
      fallback = setTimeout(release, 2350);
    }
    finalExplore.classList.add("is-formed");
  };
  button.addEventListener("focus", formButton);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        formButton();
        observer.disconnect();
      }
    }, { threshold: 1, rootMargin: "0px 0px -60px 0px" });
    observer.observe(button);
  } else {
    formButton();
  }
}


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
