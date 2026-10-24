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
  const pathLengths = paths.map((path) => {
    path.removeAttribute("pathLength");
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    return length;
  });

  const updateImpact = () => {
    const animated = !reducedMotion.matches;
    impact.classList.toggle("impact-scroll", animated);
    const bounds = impact.getBoundingClientRect();
    const distance = Math.max(1, impact.offsetHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -bounds.top / distance));
    // Smaller values make the lines appear with less scrolling.
    const lineStagger = 0.12; // Scroll progress between each line's start.
    const lineDuration = 0.08; // Scroll progress needed to draw one line.
    paths.forEach((path, index) => {
      const start = index * lineStagger;
      const lineProgress = animated ? Math.max(0, Math.min(1, (progress - start) / lineDuration)) : 1;
      const active = lineProgress >= 0.5;
      path.style.strokeDashoffset = String(pathLengths[index] * (1 - lineProgress));
      path.style.opacity = lineProgress > 0 ? "1" : "0";
      path.classList.toggle("is-active", active);
    });
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
  const togglePortrait = () => {
    const open = portraitInteraction.classList.toggle("is-open");
    portraitInteraction.setAttribute("aria-pressed", String(open));
  };
  portraitInteraction.addEventListener("click", togglePortrait);
  portraitInteraction.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      togglePortrait();
    }
    if (event.key === "Escape") {
      portraitInteraction.classList.remove("is-open");
      portraitInteraction.setAttribute("aria-pressed", "false");
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
  const galleryDuration = 4250;
  const repostDuration = 4250;
  const next = spread.querySelector(".spread-next");
  const back = spread.querySelector(".spread-back");
  const hints = ["아이콘을 눌러 아이 사진을 공유해보세요.", "공유된 사진이 다른 사람의 갤러리에 저장됩니다.", "저장된 사진이 SNS에 다시 업로드됩니다.", "공유하기 전, 사진 속 아이의 정보를 한 번 더 확인해주세요."];
  const stopPlayback = () => {
    playbackTimers.forEach(clearTimeout);
    playbackTimers = [];
  };
  const renderSpread = () => {
    spread.dataset.step = String(step);
    spread.querySelector(".spread-scene").hidden = step === 3;
    spread.querySelector(".spread-result").hidden = step !== 3;
    spread.querySelector(".spread-routes").setAttribute("aria-hidden", "true");
    spread.querySelector(".spread-details").setAttribute("aria-hidden", "true");
    next.hidden = step !== 0;
    next.querySelector("span").textContent = step === 3 ? "다시 보기" : "공유하기";
    spread.querySelector(".spread-progress").textContent = `${step + 1} / 4`;
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
    playbackTimers.push(setTimeout(() => {
      step = 3;
      renderSpread();
      if (document.activeElement === document.body) back.focus({ preventScroll: true });
    }, galleryDuration + repostDuration));
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
    const number = document.createElement("span");
    number.className = "case-number";
    number.textContent = `CASE ${String(index + 1).padStart(2, "0")}`;
    const date = document.createElement("p");
    date.className = "case-card-date";
    date.textContent = `${formatCaseDate(item.date)} / ${item.country}`;
    const title = document.createElement("h3");
    title.textContent = item.title;
    const tags = document.createElement("div");
    tags.className = "case-tags";
    item.categories.forEach((category) => {
      const tag = document.createElement("span");
      tag.textContent = categoryLabels[category];
      tags.append(tag);
    });
    card.append(number, date, title, tags);
    field.append(card);
  });
}
if (caseExplorer) {
  const filters = [...caseExplorer.querySelectorAll(".case-filters button")];
  const cards = [...caseExplorer.querySelectorAll(".case-card")];
  filters.forEach((button) => button.addEventListener("click", () => {
    const category = button.dataset.filter;
    const all = category === "all";
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
    caseExplorer.querySelector(".case-status").textContent = all ? `전체 ${cards.length}개 사례` : `${button.textContent}: ${matches}개 사례 · 날짜순`;
  }));
}


const exploreButton = document.querySelector(".explore-button");
const casesDialog = document.querySelector(".cases-dialog");
if (exploreButton && caseExplorer && casesDialog) {
  const archiveLink = document.querySelector(".archive-link");
  let casesTrigger = exploreButton;
  const openCases = (event) => {
    event.preventDefault();
    casesTrigger = event.currentTarget;
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
  casesDialog.querySelector(".cases-close").addEventListener("click", () => casesDialog.close());
  casesDialog.addEventListener("close", () => {
    document.body.classList.remove("cases-open");
    exploreButton.setAttribute("aria-expanded", "false");
    caseExplorer.classList.remove("is-visible");
    caseExplorer.hidden = true;
    casesTrigger.focus({ preventScroll: true });
  });
}


const caseDetail = document.querySelector(".case-detail");
if (caseExplorer && caseDetail) {
  let activeCard = null;
  const openCase = (card, index) => {
    if (card.getAttribute("aria-disabled") === "true") return;
    activeCard = card;
    const item = sortedCases[index];
    caseDetail.querySelector(".case-detail-id").textContent = `사례 ${String(index + 1).padStart(3, "0")}`;
    caseDetail.querySelector("#case-detail-title").textContent = item.title;
    caseDetail.querySelector("#case-detail-description").textContent = item.summary;
    caseDetail.querySelector(".case-detail-categories").textContent = item.categories.map((category) => `#${categoryLabels[category]}`).join("  ");
    caseDetail.querySelector(".case-detail-date").textContent = `${formatCaseDate(item.date)} / ${item.country}`;
    caseDetail.querySelector(".case-detail-age").textContent = item.age;
    const note = caseDetail.querySelector(".case-detail-note");
    note.hidden = !item.note;
    note.textContent = item.note;
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
    caseDetail.showModal();
    caseDetail.scrollTop = 0;
  };
  caseExplorer.querySelectorAll(".case-card").forEach((card, index) => {
    card.addEventListener("click", () => openCase(card, index));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCase(card, index);
      }
    });
  });
  caseDetail.querySelector(".case-detail-close").addEventListener("click", () => caseDetail.close());
  caseDetail.addEventListener("click", (event) => {
    const bounds = caseDetail.getBoundingClientRect();
    if (event.target === caseDetail && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) caseDetail.close();
  });
  caseDetail.addEventListener("close", () => activeCard?.focus({ preventScroll: true }));
}
