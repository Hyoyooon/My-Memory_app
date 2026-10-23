/**
 * app.js
 * Main Application Logic for "My Journal — 조각 모음"
 * Compatible with both direct file:// execution and https:// (GitHub Pages / PWA)
 */

(function () {
  const JournalStorageSync = window.JournalStorageSync;
  const SUPABASE_SETUP_SQL = window.SUPABASE_SETUP_SQL || "";

  // 8 Categories specified by user
  const CATEGORIES = [
    {
      id: "calendar",
      name: "달력",
      shortLabel: "달력",
      icon: "📅",
      tryTitle: "오늘의 핵심 다짐",
      placeholder: "오늘의 주요 일정이나 기억할 일을 적어보세요",
      sproutStages: ["🌱", "🌿", "🌳", "✨"],
    },
    {
      id: "routine",
      name: "루틴",
      shortLabel: "루틴",
      icon: "🌿",
      tryTitle: "오늘의 루틴",
      placeholder: "새 루틴 메모 추가 (예: 11시 취침)",
      sproutStages: ["🌱", "🌿", "🌳", "🌸"],
    },
    {
      id: "todo",
      name: "해야할 일",
      shortLabel: "해야할일",
      icon: "☑️",
      tryTitle: "오늘 해야할 일",
      placeholder: "할 일 빠르게 추가하기...",
      sproutStages: ["📝", "⚡", "🎯", "🏆"],
    },
    {
      id: "info",
      name: "정보",
      shortLabel: "정보",
      icon: "📌",
      tryTitle: "수집·활용할 정보",
      placeholder: "기억해둘 링크나 실행할 팁 추가...",
      sproutStages: ["📎", "🗂️", "📚", "💡"],
    },
    {
      id: "thought",
      name: "생각",
      shortLabel: "생각",
      icon: "💭",
      tryTitle: "오늘 붙잡은 생각",
      placeholder: "떠오른 화두나 적용할 점 추가...",
      sproutStages: ["💭", "🧠", "✨", "🌟"],
    },
    {
      id: "happiness",
      name: "행복",
      shortLabel: "행복",
      icon: "🍀",
      tryTitle: "소소한 행복 채우기",
      placeholder: "오늘 나를 기분 좋게 한 일 추가...",
      sproutStages: ["🌱", "🍀", "🌷", "☀️"],
    },
    {
      id: "transcription",
      name: "필사",
      shortLabel: "필사",
      icon: "✍️",
      tryTitle: "곱씹어볼 문장",
      placeholder: "기억하고 싶은 문장이나 책 제목...",
      sproutStages: ["✒️", "📖", "🏛️", "✨"],
    },
    {
      id: "diary",
      name: "일기",
      shortLabel: "일기",
      icon: "📖",
      tryTitle: "오늘 하루 돌아보기",
      placeholder: "오늘 하루의 키워드 한 줄...",
      sproutStages: ["🌙", "🕯️", "📔", "🌌"],
    },
  ];

  // Sub-tags inspired by the reference photo (Quote, Learned, Mirror, Try)
  const SUBTYPES = [
    { id: "Try", label: "Try", color: "var(--dot-try)", desc: "실천·다짐" },
    { id: "Mirror", label: "Mirror", color: "var(--dot-mirror)", desc: "돌아보기·성찰" },
    { id: "Learned", label: "Learned", color: "var(--dot-learned)", desc: "배운점·인사이트" },
    { id: "Quote", label: "Quote", color: "var(--dot-quote)", desc: "문장·인용" },
  ];

  const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

  function getTodayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatKoreanShortDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const dt = new Date(y, m - 1, d);
    const w = WEEKDAYS_KO[dt.getDay()] || "";
    return `${m}.${d}. (${w})`;
  }

  function getCategoryMeta(catId) {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[1];
  }

  function getInitialSeedPieces() {
    return [
      {
        id: "seed-1",
        category: "routine",
        date: "2026-10-09",
        subtype: "Try",
        title: "글쓰기는 군더더기를 지우고 과감히 끝내기",
        content:
          "문장을 길게 늘어뜨리지 말고 핵심만 남긴 채 마침표를 찍는 연습. 수식어를 덜어낼수록 전달하고자 하는 생각의 밀도가 높아진다.",
        source: "",
        tags: ["글쓰기", "미니멀"],
        images: [],
        bookmarked: true,
        createdAt: "2026-10-09T08:10:00.000Z",
        updatedAt: "2026-10-09T08:10:00.000Z",
      },
      {
        id: "seed-2",
        category: "routine",
        date: "2026-10-02",
        subtype: "Mirror",
        title: "7시 기상은 모닝 루틴과 마음의 여유를 무너뜨린다",
        content:
          "조금만 늦게 일어나도 아침의 고요한 루틴이 급해지고 하루 전체의 리듬이 흔들린다. 최소 6시 20분에는 눈을 뜨고 스트레칭으로 시작하자.",
        source: "",
        tags: ["기상시간", "모닝루틴"],
        images: [],
        bookmarked: false,
        createdAt: "2026-10-02T07:30:00.000Z",
        updatedAt: "2026-10-02T07:30:00.000Z",
      },
      {
        id: "seed-3",
        category: "routine",
        date: "2026-09-18",
        subtype: "Mirror",
        title: "물 섭취 부족과 목 텁텁함",
        content:
          "오후에 집중하다 보면 커피만 마시고 순수한 물 섭취량이 턱없이 부족해진다. 책상 위에 항상 텀블러를 눈에 보이게 두기.",
        source: "",
        tags: ["건강", "수분섭취"],
        images: [],
        bookmarked: false,
        createdAt: "2026-09-18T15:20:00.000Z",
        updatedAt: "2026-09-18T15:20:00.000Z",
      },
      {
        id: "seed-4",
        category: "routine",
        date: "2026-09-11",
        subtype: "Try",
        title: "11시 취침 패턴 만들기 다짐",
        content:
          "밤 10시 30분부터는 스마트폰을 멀리 두고 조명을 낮춘다. 수면의 질이 곧 다음 날의 에너지와 직결된다.",
        source: "",
        tags: ["수면", "디지털디톡스"],
        images: [],
        bookmarked: true,
        createdAt: "2026-09-11T22:40:00.000Z",
        updatedAt: "2026-09-11T22:40:00.000Z",
      },
      {
        id: "seed-5",
        category: "routine",
        date: "2026-08-26",
        subtype: "Mirror",
        title: "안연고 없이 자기 2일차 - 눈 상태 체크",
        content:
          "자기 전 온찜질을 5분 해주고 눈을 깜빡이는 의식적인 휴식을 취했더니 아침 건조함이 한결 덜했다.",
        source: "",
        tags: ["눈건강", "기록"],
        images: [],
        bookmarked: false,
        createdAt: "2026-08-26T23:00:00.000Z",
        updatedAt: "2026-08-26T23:00:00.000Z",
      },
      {
        id: "seed-6",
        category: "todo",
        date: getTodayStr(),
        subtype: "Try",
        title: "개인 기록용 조각 모음 앱 GitHub 업로드 및 안드로이드 홈화면 추가",
        content:
          "카테고리별로 하루의 정보와 생각을 빠르게 기록하고, 중요한 글은 북마크로 모아볼 수 있도록 워크플로우 정리하기.",
        source: "",
        tags: ["프로젝트", "바이브코딩"],
        images: [],
        bookmarked: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "seed-7",
        category: "info",
        date: getTodayStr(),
        subtype: "Learned",
        title: "Mobbin 미니멀 갤러리 디자인 시스템 핵심 노트",
        content:
          "그림자를 쓰는 대신 화이트(#ffffff)와 6% 틴트 소프트 캔버스(#f3f3f3), 1px 헤어라인(#e0e0e0)만으로 깊이감을 만들고 모든 인터랙션 요소는 알약(Pill) 형태를 유지한다.",
        source: "DESIGN-mobbin.md",
        tags: ["UI디자인", "레퍼런스"],
        images: [],
        bookmarked: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "seed-8",
        category: "thought",
        date: getTodayStr(),
        subtype: "Mirror",
        title: "수집한 정보가 내 것이 되려면 한 줄이라도 내 언어로 적어야 한다",
        content:
          "단순히 스크랩만 해둔 정보는 금방 휘발되지만, 왜 이 정보가 눈에 들어왔는지 한 줄의 생각을 덧붙이면 언제든 꺼내 쓸 수 있는 나만의 자산이 된다.",
        source: "",
        tags: ["기록법", "생각정리"],
        images: [],
        bookmarked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "seed-9",
        category: "happiness",
        date: getTodayStr(),
        subtype: "Mirror",
        title: "선선한 바람 불 때 마신 따뜻한 드립 커피 한 잔",
        content:
          "복잡한 일정을 시작하기 전 10분 동안 창밖을 보며 커피 향을 음미한 순간이 오늘 하루의 기분을 단정하게 잡아주었다.",
        source: "",
        tags: ["일상", "감사"],
        images: [],
        bookmarked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "seed-10",
        category: "transcription",
        date: getTodayStr(),
        subtype: "Quote",
        title: "우리가 매일 반복하는 것이 곧 우리 자신이다.",
        content:
          "탁월함이란 단일한 행위가 아니라 습관이다. 하루에 하나씩 쌓아 올린 작은 문장과 생각의 조각들이 결국 삶의 결을 만든다.",
        source: "아리스토텔레스 / 니코마코스 윤리학",
        tags: ["필사", "문장수집"],
        images: [],
        bookmarked: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "seed-11",
        category: "diary",
        date: getTodayStr(),
        subtype: "Mirror",
        title: "나만의 아카이브 공간을 직접 만들어가며 느낀 즐거움",
        content:
          "하루 동안 스쳐 지나가는 수많은 정보와 감정, 해야 할 일들을 한곳에 차분하게 모아둘 수 있는 바인더 같은 공간이 생겼다. 매일 조금씩 채워나가야지.",
        source: "",
        tags: ["일기", "기록"],
        images: [],
        bookmarked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  function getInitialSeedChecklists() {
    return [
      {
        id: "chk-1",
        category: "routine",
        date: getTodayStr(),
        text: "글쓰기: 지우고 과감히 끝내기",
        done: false,
        updatedAt: new Date().toISOString(),
      },
      {
        id: "chk-2",
        category: "routine",
        date: getTodayStr(),
        text: "오늘부터 11시 취침",
        done: false,
        updatedAt: new Date().toISOString(),
      },
      {
        id: "chk-3",
        category: "todo",
        date: getTodayStr(),
        text: "중요한 조각글 북마크 테스트해보기",
        done: false,
        updatedAt: new Date().toISOString(),
      },
      {
        id: "chk-4",
        category: "todo",
        date: getTodayStr(),
        text: "오늘 수집한 정보 1건 이상 기록하기",
        done: true,
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const state = {
    activeCategory: "routine",
    selectedDate: null,
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth(),
    calendarFolded: false,
    calendarAnimDir: null, // 'prev' | 'next' | 'fold' | null
    glideFromOffset: null, // { left, top } relative to .calendar-grid
    routineStickyIndex: 0,
    bookmarkOnly: false,
    searchQuery: "",
    sortBy: "latest",
    tabsCollapsed: false,
    pieces: [],
    checklists: [],
    editingPieceId: null,
    viewingPieceId: null,
    draftImages: [],
  };

  const syncManager = new JournalStorageSync((event) => {
    if (event.type === "status") {
      updateSyncStatusUI(event.isOnline);
    } else if (event.type === "merged") {
      state.pieces = syncManager.getLocalPieces() || state.pieces;
      state.checklists = syncManager.getLocalChecklists() || state.checklists;
      renderAll();
      showToast("☁️ 클라우드 데이터와 동기화되었습니다.");
    }
  });

  function loadInitialData() {
    let storedPieces = syncManager.getLocalPieces();
    if (!storedPieces || !Array.isArray(storedPieces) || storedPieces.length === 0) {
      storedPieces = getInitialSeedPieces();
      syncManager.saveLocalPieces(storedPieces);
    }
    state.pieces = storedPieces;

    let storedChecks = syncManager.getLocalChecklists();
    if (!storedChecks || !Array.isArray(storedChecks) || storedChecks.length === 0) {
      storedChecks = getInitialSeedChecklists();
      syncManager.saveLocalChecklists(storedChecks);
    }
    state.checklists = storedChecks;
  }

  // ==========================================================================
  // Rendering Functions
  // ==========================================================================

  function renderAll() {
    renderHeaderState();
    renderBinderTabs();
    renderMainSheet();
  }

  function updateSyncStatusUI(isOnline) {
    const dot = document.getElementById("syncStatusDot");
    const label = document.getElementById("syncStatusLabel");
    if (!dot || !label) return;
    if (isOnline) {
      dot.classList.add("online");
      label.textContent = "동기화됨";
    } else {
      dot.classList.remove("online");
      label.textContent = "동기화";
    }
  }

  function renderHeaderState() {
    const bmBtn = document.getElementById("headerBookmarkToggle");
    if (bmBtn) {
      const bookmarkedCount = state.pieces.filter((p) => p.bookmarked).length;
      bmBtn.classList.toggle("active", state.bookmarkOnly);
      bmBtn.innerHTML = `🔖 북마크 <span>${bookmarkedCount}</span>`;
    }
  }

  function renderBinderTabs() {
    const container = document.getElementById("binderTabsList");
    if (!container) return;

    container.classList.toggle("collapsed", state.tabsCollapsed);

    const tabsHtml = CATEGORIES.map((cat) => {
      const isActive = state.activeCategory === cat.id;
      const hasBookmarkInCat =
        cat.id !== "calendar" &&
        state.pieces.some((p) => p.category === cat.id && p.bookmarked);

      return `
        <button
          type="button"
          class="binder-tab ${isActive ? "active" : ""}"
          data-cat="${cat.id}"
          title="${cat.name}"
        >
          ${hasBookmarkInCat ? '<span class="tab-count-dot"></span>' : ""}
          <span class="tab-icon-squircle">${cat.icon}</span>
          <span class="tab-label">${cat.shortLabel}</span>
        </button>
      `;
    }).join("");

    container.innerHTML = `
      <button type="button" class="binder-collapse-btn" id="collapseTabsBtn" title="탭 접기/펼치기">
        ${state.tabsCollapsed ? "›" : "‹"}
      </button>
      ${tabsHtml}
    `;

    const collapseBtn = document.getElementById("collapseTabsBtn");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", () => {
        state.tabsCollapsed = !state.tabsCollapsed;
        renderBinderTabs();
      });
    }

    container.querySelectorAll(".binder-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const catId = btn.getAttribute("data-cat");
        if (!catId) return;
        state.activeCategory = catId;
        if (catId === "calendar" && !state.selectedDate) {
          state.selectedDate = getTodayStr();
        }
        renderAll();
      });
    });
  }

  function getFilteredPieces() {
    return state.pieces
      .filter((p) => {
        if (state.activeCategory !== "calendar" && p.category !== state.activeCategory) {
          return false;
        }
        if (state.selectedDate && p.date !== state.selectedDate) {
          return false;
        }
        if (state.bookmarkOnly && !p.bookmarked) {
          return false;
        }
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.trim().toLowerCase();
          const inTitle = (p.title || "").toLowerCase().includes(q);
          const inContent = (p.content || "").toLowerCase().includes(q);
          const inSource = (p.source || "").toLowerCase().includes(q);
          const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!inTitle && !inContent && !inSource && !inTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (state.sortBy === "oldest") {
          return (
            a.date.localeCompare(b.date) ||
            (a.createdAt || "").localeCompare(b.createdAt || "")
          );
        }
        return (
          b.date.localeCompare(a.date) ||
          (b.createdAt || "").localeCompare(a.createdAt || "")
        );
      });
  }

  function renderMainSheet() {
    const scrollArea = document.getElementById("sheetScrollArea");
    const bottomDateLabel = document.getElementById("floatingDateText");
    if (!scrollArea) return;

    const activeCatMeta = getCategoryMeta(state.activeCategory);
    const filteredPieces = getFilteredPieces();

    if (bottomDateLabel) {
      bottomDateLabel.textContent = state.selectedDate
        ? `📅 ${formatKoreanShortDate(state.selectedDate)}`
        : `📅 ${formatKoreanShortDate(getTodayStr())}`;
    }

    const calendarSectionHtml =
      state.activeCategory === "calendar" ? buildCalendarPanelHtml() : "";

    const topWidgetHtml = buildTopWidgetHtml(activeCatMeta);

    const dateFilterBannerHtml =
      state.selectedDate && state.activeCategory !== "calendar"
        ? `
        <div class="date-filter-banner">
          <div class="date-filter-banner-left">
            <span>📅 선택된 날짜: <strong>${formatKoreanShortDate(
          state.selectedDate
        )}</strong></span>
          </div>
          <button type="button" class="pill-btn" id="clearDateFilterBtn" style="height:24px; padding:0 10px; font-size:11px;">
            전체 날짜 보기 ✕
          </button>
        </div>
      `
        : "";

    const listHeaderHtml = `
      <div class="list-meta-bar">
        <div class="list-count-text">
          ${activeCatMeta.icon} ${activeCatMeta.name} 조각 <strong>${filteredPieces.length
      }</strong>장
          ${state.bookmarkOnly ? " · 🔖 북마크만" : ""}
        </div>
        <div class="list-filter-controls">
          <select class="mini-pill-select" id="sortOrderSelect" aria-label="정렬 기준">
            <option value="latest" ${state.sortBy === "latest" ? "selected" : ""}>최신순</option>
            <option value="oldest" ${state.sortBy === "oldest" ? "selected" : ""}>오래된순</option>
          </select>
        </div>
      </div>
    `;

    const piecesCardsHtml =
      filteredPieces.length > 0
        ? `<div class="pieces-list">${filteredPieces
          .map((p, idx) => buildPieceCardHtml(p, idx))
          .join("")}</div>`
        : `
        <div class="empty-state-card">
          <div class="empty-state-icon">${activeCatMeta.icon}</div>
          <div class="empty-state-title">기록된 조각이 없습니다.</div>
          <div class="empty-state-desc">
            하단의 <strong>+ 기록</strong> 버튼을 눌러 오늘의 생각이나 정보를 사진과 함께 남겨보세요.
          </div>
        </div>
      `;

    scrollArea.innerHTML = `
      ${calendarSectionHtml}
      ${topWidgetHtml}
      ${dateFilterBannerHtml}
      ${listHeaderHtml}
      ${piecesCardsHtml}
    `;

    runCalendarGlideAnimation();
    state.calendarAnimDir = null;
    bindSheetEvents();
  }

  function runCalendarGlideAnimation() {
    if (!state.glideFromOffset) return;
    const from = state.glideFromOffset;
    state.glideFromOffset = null;

    const gridEl = document.getElementById("calendarGridEl");
    const newSelectedCell = gridEl?.querySelector(".cal-day.selected");
    const glideBg = document.getElementById("calGlideBg");
    if (!gridEl || !newSelectedCell || !glideBg || typeof glideBg.animate !== "function") {
      return;
    }

    const gridRect = gridEl.getBoundingClientRect();
    const newRect = newSelectedCell.getBoundingClientRect();
    const newLeft = newRect.left - gridRect.left;
    const newTop = newRect.top - gridRect.top;

    const dx = from.left - newLeft;
    const dy = from.top - newTop;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

    const stretchX = Math.abs(dx) > Math.abs(dy) ? 1.14 : 0.92;
    const stretchY = Math.abs(dy) > Math.abs(dx) ? 1.14 : 0.92;

    glideBg.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(0.95, 0.95)`,
        },
        {
          transform: `translate(${dx * 0.35}px, ${dy * 0.35}px) scale(${stretchX}, ${stretchY})`,
          offset: 0.45,
        },
        {
          transform: "translate(0px, 0px) scale(1, 1)",
        },
      ],
      {
        duration: 380,
        easing: "cubic-bezier(0.22, 1.28, 0.36, 1)",
        fill: "both",
      }
    );
  }

  function buildTopWidgetHtml(catMeta) {
    const targetChecklistCat =
      state.activeCategory === "calendar" ? "todo" : state.activeCategory;
    const catChecks = state.checklists.filter((c) => {
      if (state.activeCategory !== "calendar" && c.category !== targetChecklistCat)
        return false;
      if (state.selectedDate && c.date !== state.selectedDate) return false;
      return true;
    });

    // For 'routine' category, render the Sticky Note Stack instead of the old Try/Sprout cards
    if (state.activeCategory === "routine") {
      return buildRoutineStickyPadHtml(catChecks, catMeta);
    }

    const doneCount = catChecks.filter((c) => c.done).length;
    const totalCount = catChecks.length;

    return `
      <section class="top-widget-section">
        <div class="widget-row">
          <div class="try-card">
            <div class="try-header">
              <div class="try-title-group">
                <span class="status-dot"></span>
                <span class="try-title">${catMeta.tryTitle}</span>
              </div>
              <span class="try-counter">${doneCount}/${totalCount}</span>
            </div>
            <ul class="try-list">
              ${catChecks
        .map(
          (item) => `
                <li class="try-item ${item.done ? "done" : ""}" data-check-id="${item.id}">
                  <span class="try-checkbox">${item.done ? "✓" : ""}</span>
                  <span class="try-item-text">${escapeHtml(item.text)}</span>
                  <button type="button" class="check-del-btn" data-del-check="${item.id
            }" title="삭제" style="border:none;background:transparent;color:var(--text-faint);cursor:pointer;font-size:11px;">✕</button>
                </li>
              `
        )
        .join("")}
            </ul>
            <div class="try-add-inline">
              <input
                type="text"
                id="inlineChecklistInput"
                class="try-add-input"
                placeholder="+ ${catMeta.placeholder}"
              />
            </div>
          </div>
        </div>
      </section>
    `;
  }

  const STICKY_COLORS = ["yellow", "blue", "red", "green", "pink", "purple"];

  const PIN_PALETTE = {
    yellow: { outer: "#e03131", inner: "#c92a2a", rim: "#ff8787" },
    blue: { outer: "#1c7ed6", inner: "#1864ab", rim: "#74c0fc" },
    red: { outer: "#d93829", inner: "#b02518", rim: "#ff8787" },
    green: { outer: "#2b8a3e", inner: "#237032", rim: "#8ce99a" },
    pink: { outer: "#d6336c", inner: "#a61e4d", rim: "#faa2c1" },
    purple: { outer: "#7048e8", inner: "#5f3dc4", rim: "#b197fc" },
  };

  function pickRandomStickyColor(excludeColor) {
    const pool = excludeColor
      ? STICKY_COLORS.filter((c) => c !== excludeColor)
      : STICKY_COLORS;
    return pool[Math.floor(Math.random() * pool.length)] || "yellow";
  }

  function buildPushpinHtml(colorKey) {
    const p = PIN_PALETTE[colorKey] || PIN_PALETTE.yellow;
    return `
      <div class="sticky-pushpin" aria-hidden="true">
        <svg class="sticky-pushpin-svg" viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Soft drop shadow on the sticky note paper -->
          <ellipse cx="22" cy="36" rx="8" ry="4" fill="rgba(20,20,20,0.18)" />
          <!-- Metallic pin needle piercing the paper -->
          <path d="M20 24L20 36" stroke="#666666" stroke-width="2.6" stroke-linecap="round" />
          <path d="M19.3 24L19.3 34" stroke="#d0d0d0" stroke-width="1" stroke-linecap="round" />
          <!-- Pin neck / cylinder -->
          <ellipse cx="20" cy="21" rx="7.5" ry="4.5" fill="${p.inner}" />
          <!-- Outer 3D thumbtack head -->
          <circle cx="20" cy="14" r="11" fill="${p.outer}" stroke="rgba(20,20,20,0.15)" stroke-width="1" />
          <!-- Inner recessed ring -->
          <circle cx="20" cy="13.5" r="7.2" fill="${p.inner}" stroke="${p.rim}" stroke-width="0.9" stroke-opacity="0.7" />
          <!-- Glossy specular highlight -->
          <ellipse cx="16.5" cy="10" rx="3.2" ry="1.8" transform="rotate(-24 16.5 10)" fill="rgba(255,255,255,0.65)" />
        </svg>
      </div>
    `;
  }

  function buildRoutineStickyPadHtml(catChecks, catMeta) {
    // Ensure every checklist item has a random distinct colorKey persisted
    let colorAssigned = false;
    let prevColor = null;
    catChecks.forEach((c) => {
      if (!c.colorKey || !STICKY_COLORS.includes(c.colorKey)) {
        c.colorKey = pickRandomStickyColor(prevColor);
        colorAssigned = true;
      }
      prevColor = c.colorKey;
    });
    if (colorAssigned) {
      syncManager.saveLocalChecklists(state.checklists);
    }

    const pendingNotes = catChecks.filter((c) => !c.done);
    const doneNotes = catChecks.filter((c) => c.done);

    if (state.routineStickyIndex >= pendingNotes.length) {
      state.routineStickyIndex = 0;
    }
    if (state.routineStickyIndex < 0) {
      state.routineStickyIndex = Math.max(0, pendingNotes.length - 1);
    }

    // Order stack starting from state.routineStickyIndex (up to 3 visible cards in stack)
    const orderedPending = [];
    for (let i = 0; i < Math.min(pendingNotes.length, 3); i++) {
      const idx = (state.routineStickyIndex + i) % pendingNotes.length;
      orderedPending.push({
        item: pendingNotes[idx],
        stackPos: i,
        realIdx: idx,
      });
    }

    const stackHtml =
      orderedPending.length > 0
        ? orderedPending
          .slice()
          .reverse()
          .map(({ item, stackPos, realIdx }) => {
            const isFront = stackPos === 0;
            const colorKey = item.colorKey || "yellow";
            return `
                <div
                  class="sticky-note-card sticky-color-${colorKey} stack-pos-${stackPos}"
                  ${isFront ? 'id="activeStickyNote"' : ""}
                  data-sticky-id="${item.id}"
                >
                  ${buildPushpinHtml(colorKey)}
                  ${isFront
                ? `<div class="sticky-pull-banner" id="stickyPullBanner">↓ 아래로 당겨 루틴 완료</div>`
                : ""
              }
                  <div class="sticky-top-row">
                    <span>🌿 루틴 메모 ${realIdx + 1} / ${pendingNotes.length}</span>
                    ${isFront
                ? `
                      <div class="sticky-nav-arrows">
                        <button type="button" class="sticky-arrow-btn" id="stickyPrevBtn" title="이전 메모">&lt;</button>
                        <button type="button" class="sticky-arrow-btn" id="stickyNextBtn" title="다음 메모">&gt;</button>
                        <button type="button" class="sticky-arrow-btn" data-del-check="${item.id}" title="메모 삭제" style="color:var(--text-muted);">✕</button>
                      </div>
                    `
                : ""
              }
                  </div>
                  <div class="sticky-body-text">${escapeHtml(item.text)}</div>
                  <div class="sticky-footer-hints">
                    <span>↔ 넘기기</span>
                    <span>↓ 완료하기</span>
                  </div>
                </div>
              `;
          })
          .join("")
        : `
          <div class="sticky-note-card sticky-color-yellow stack-pos-0" style="cursor:default; align-items:center; justify-content:center; gap:6px;">
            ${buildPushpinHtml("yellow")}
            <div style="font-size:28px;">✨</div>
            <div style="font-size:16px; font-weight:652; color:var(--ink);">남은 루틴 메모지가 없습니다!</div>
            <div style="font-size:12px; color:var(--text-muted);">아래 입력창에서 새로운 루틴 메모지를 추가해보세요.</div>
          </div>
        `;

    const doneChipsHtml =
      doneNotes.length > 0
        ? `
        <div class="sticky-done-list">
          ${doneNotes
          .map(
            (d) => `
            <span class="sticky-done-chip" data-undo-sticky="${d.id}" title="클릭하면 다시 미완료 메모지로 복구합니다">
              ✓ ${escapeHtml(d.text)}
            </span>
          `
          )
          .join("")}
        </div>
      `
        : "";

    return `
      <section class="sticky-pad-section">
        <div class="sticky-pad-header">
          <div class="sticky-pad-title-wrap">
            <span class="sticky-pad-title">🌿 오늘의 루틴 메모지</span>
            <span class="sticky-pad-badge">남은 메모 ${pendingNotes.length} · 완료 ${doneNotes.length}</span>
          </div>
        </div>

        <div class="sticky-stack-stage" id="stickyStackStage">
          ${stackHtml}
        </div>

        <div class="sticky-add-bar">
          <span style="font-size:13px; color:var(--text-muted);">+</span>
          <input
            type="text"
            id="inlineChecklistInput"
            class="sticky-add-input"
            placeholder="${catMeta.placeholder} (입력 후 Enter)"
          />
        </div>

        ${doneChipsHtml}
      </section>
    `;
  }

  function buildCalendarPanelHtml() {
    const year = state.calendarYear;
    const month = state.calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getTodayStr();

    const dateMap = {};
    state.pieces.forEach((p) => {
      if (!p.date) return;
      if (!dateMap[p.date]) dateMap[p.date] = { count: 0, hasBookmark: false };
      dateMap[p.date].count++;
      if (p.bookmarked) dateMap[p.date].hasBookmark = true;
    });

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ html: `<div class="cal-day other-month"></div>`, date: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      const fullDate = `${year}-${mStr}-${dStr}`;
      const info = dateMap[fullDate] || { count: 0, hasBookmark: false };
      const isToday = fullDate === todayStr;
      const isSelected = state.selectedDate === fullDate;
      const dayOfWeek = (firstDay + d - 1) % 7;
      const dayColorClass =
        dayOfWeek === 0 ? "day-sun" : dayOfWeek === 6 ? "day-sat" : "";

      let heatClass = "";
      if (info.count === 1) heatClass = "heat-1";
      else if (info.count === 2) heatClass = "heat-2";
      else if (info.count >= 3) heatClass = "heat-3";

      const dotsHtml = [];
      if (info.count > 0) {
        dotsHtml.push(`<span class="cal-dot"></span>`);
      }
      if (info.hasBookmark) {
        dotsHtml.push(`<span class="cal-dot bookmark-dot"></span>`);
      }

      cells.push({
        date: fullDate,
        html: `
          <button
            type="button"
            class="cal-day ${dayColorClass} ${heatClass} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""
          }"
            data-cal-date="${fullDate}"
          >
            ${isSelected ? '<span class="cal-glide-bg" id="calGlideBg"></span>' : ""}
            <span>${d}</span>
            <div class="cal-dots">${dotsHtml.join("")}</div>
          </button>
        `,
      });
    }

    // If folded into weekly view, show only the week row containing selectedDate (or today / 1st week)
    let visibleCells = cells;
    if (state.calendarFolded) {
      const targetDate = state.selectedDate || todayStr;
      let targetIdx = cells.findIndex((c) => c.date === targetDate);
      if (targetIdx === -1) targetIdx = firstDay;
      const weekRowStart = Math.floor(targetIdx / 7) * 7;
      visibleCells = cells.slice(weekRowStart, weekRowStart + 7);
    }

    const monthFormatted = String(month + 1).padStart(2, "0");
    const gridAnimClass =
      state.calendarAnimDir === "prev"
        ? "flip-prev"
        : state.calendarAnimDir === "next"
          ? "flip-next"
          : state.calendarAnimDir === "fold"
            ? "fold-anim"
            : "";
    const titleAnimClass =
      state.calendarAnimDir === "prev"
        ? "anim-prev"
        : state.calendarAnimDir === "next"
          ? "anim-next"
          : "";

    return `
      <section class="calendar-panel">
        <div class="calendar-header">
          <div class="calendar-month-title ${titleAnimClass}">${year}.${monthFormatted}</div>
          <div class="calendar-nav-btns">
            <button type="button" class="cal-nav-btn" id="calPrevMonthBtn" aria-label="이전 달">&lt;</button>
            <button type="button" class="cal-nav-btn" id="calTodayBtn">오늘</button>
            <button type="button" class="cal-nav-btn" id="calNextMonthBtn" aria-label="다음 달">&gt;</button>
            ${state.selectedDate
        ? `<button type="button" class="cal-nav-btn" id="calAllDatesBtn">전체보기</button>`
        : ""
      }
          </div>
        </div>
        <div class="calendar-weekdays">
          ${WEEKDAYS_KO.map((w, idx) => {
        const wClass =
          idx === 0 ? "weekday-sun" : idx === 6 ? "weekday-sat" : "";
        return `<span class="${wClass}">${w}</span>`;
      }).join("")}
        </div>
        <div class="calendar-grid ${gridAnimClass}" id="calendarGridEl">
          ${visibleCells.map((c) => c.html).join("")}
        </div>
        <button type="button" class="cal-fold-handle" id="calFoldToggleBtn" title="주간/월간 달력 폴딩 전환">
          <span class="cal-fold-bar"></span>
          <span>${state.calendarFolded ? "펼치기 ▾" : "접기 ▴"}</span>
        </button>
      </section>
    `;
  }

  function buildPieceCardHtml(piece, idx = 0) {
    const catMeta = getCategoryMeta(piece.category);
    const shortDate = formatKoreanShortDate(piece.date);

    const imagesHtml =
      Array.isArray(piece.images) && piece.images.length > 0
        ? `
        <div class="piece-images-strip">
          ${piece.images
          .map(
            (imgUrl) =>
              `<img src="${imgUrl}" alt="첨부 이미지" class="piece-thumb" loading="lazy" />`
          )
          .join("")}
        </div>
      `
        : "";

    const quoteSourceHtml = piece.source
      ? `<div class="piece-quote-source">출처: ${escapeHtml(piece.source)}</div>`
      : "";

    const tagsHtml =
      Array.isArray(piece.tags) && piece.tags.length > 0
        ? `
        <div class="piece-tags-row">
          ${piece.tags
          .map((t) => `<span class="piece-tag-chip">#${escapeHtml(t)}</span>`)
          .join("")}
        </div>
      `
        : "";

    return `
      <article class="piece-card" data-piece-id="${piece.id}" style="--stagger-i: ${Math.min(idx, 12)};">
        <div class="piece-card-top">
          <div class="piece-meta-left">
            <span>${shortDate}</span>
            <span>·</span>
            <span class="piece-cat-badge">${catMeta.icon} ${catMeta.name}</span>
          </div>
          <div class="piece-meta-right">
            <span class="piece-chevron">›</span>
            <button
              type="button"
              class="bookmark-btn ${piece.bookmarked ? "bookmarked" : ""}"
              data-bookmark-id="${piece.id}"
              title="중요 글 북마크"
              aria-label="북마크 토글"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${piece.bookmarked ? "currentColor" : "none"
      }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
          </div>
        </div>
        <h3 class="piece-title">${escapeHtml(piece.title)}</h3>
        ${piece.content
        ? `<p class="piece-excerpt">${escapeHtml(piece.content)}</p>`
        : ""
      }
        ${quoteSourceHtml}
        ${imagesHtml}
        ${tagsHtml}
      </article>
    `;
  }

  // ==========================================================================
  // Event Bindings inside Main Sheet
  // ==========================================================================

  function bindRoutineStickyEvents() {
    const activeCard = document.getElementById("activeStickyNote");
    const pullBanner = document.getElementById("stickyPullBanner");

    // Undo completed routine chip
    document.querySelectorAll("[data-undo-sticky]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const id = chip.getAttribute("data-undo-sticky");
        const item = state.checklists.find((c) => c.id === id);
        if (!item) return;
        item.done = false;
        item.updatedAt = new Date().toISOString();
        syncManager.saveLocalChecklists(state.checklists);
        syncManager.upsertChecklistToCloud(item);
        showToast("↩ 루틴을 다시 메모지 스택에 복구했습니다.");
        renderMainSheet();
      });
    });

    if (!activeCard) return;

    const flipToOffset = (delta, flyDirX) => {
      activeCard.style.transition =
        "transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease";
      activeCard.style.transform = `translate(${flyDirX}px, -6px) rotate(${flyDirX > 0 ? 10 : -10
        }deg) scale(0.94)`;
      activeCard.style.opacity = "0";
      setTimeout(() => {
        state.routineStickyIndex += delta;
        renderMainSheet();
      }, 210);
    };

    document.getElementById("stickyPrevBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      flipToOffset(-1, -140);
    });

    document.getElementById("stickyNextBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      flipToOffset(1, 140);
    });

    // Drag / Swipe Gesture Physics on Active Sticky Note
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    activeCard.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      currentX = 0;
      currentY = 0;
      activeCard.style.transition = "none";
      if (activeCard.setPointerCapture) {
        try {
          activeCard.setPointerCapture(e.pointerId);
        } catch (_) { }
      }
    });

    activeCard.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;

      const absX = Math.abs(currentX);
      const absY = Math.abs(currentY);

      if (currentY > 12 && absY >= absX) {
        // Downward pull -> Complete routine gesture
        const pullY = Math.min(currentY * 0.85, 130);
        const stretchY = 1 + Math.min(currentY * 0.0008, 0.08);
        const shrinkX = 1 - Math.min(currentY * 0.0004, 0.04);
        activeCard.style.transform = `translate(0px, ${pullY}px) scale(${shrinkX}, ${stretchY})`;

        if (pullBanner) {
          pullBanner.style.opacity = String(Math.min(currentY / 50, 1));
          pullBanner.style.transform = "translateY(0)";
          if (currentY >= 65) {
            pullBanner.classList.add("ready");
            pullBanner.textContent = "✓ 놓으면 루틴 완료 등록!";
          } else {
            pullBanner.classList.remove("ready");
            pullBanner.textContent = "↓ 아래로 당겨 루틴 완료";
          }
        }
      } else {
        // Horizontal drag -> Flip between routine sticky notes
        const rot = currentX * 0.06;
        activeCard.style.transform = `translate(${currentX}px, ${currentY * 0.2
          }px) rotate(${rot}deg)`;
        if (pullBanner) {
          pullBanner.style.opacity = "0";
          pullBanner.style.transform = "translateY(-100%)";
        }
      }
    });

    const finishDrag = () => {
      if (!isDragging) return;
      isDragging = false;

      const absX = Math.abs(currentX);
      const absY = Math.abs(currentY);

      // 1. Pull down past threshold -> Complete routine!
      if (currentY >= 65 && absY >= absX) {
        const stickyId = activeCard.getAttribute("data-sticky-id");
        const item = state.checklists.find((c) => c.id === stickyId);
        activeCard.style.transition =
          "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease";
        activeCard.style.transform =
          "translate(0px, 175px) rotate(3deg) scale(0.9)";
        activeCard.style.opacity = "0";

        setTimeout(() => {
          if (item) {
            item.done = true;
            item.updatedAt = new Date().toISOString();
            syncManager.saveLocalChecklists(state.checklists);
            syncManager.upsertChecklistToCloud(item);
            showToast("✅ 루틴 완료로 등록되었습니다!");
          }
          renderMainSheet();
        }, 230);
        return;
      }

      // 2. Horizontal swipe past threshold -> Flip to next/prev routine sticky note!
      if (absX >= 55 && absX > absY) {
        const dir = currentX > 0 ? -1 : 1;
        const flyX = currentX > 0 ? 180 : -180;
        flipToOffset(dir, flyX);
        return;
      }

      // 3. Otherwise spring back to resting position
      activeCard.style.transition =
        "transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1)";
      activeCard.style.transform = "translate(0px, 0px) scale(1) rotate(0deg)";
      if (pullBanner) {
        pullBanner.style.opacity = "0";
        pullBanner.style.transform = "translateY(-100%)";
        pullBanner.classList.remove("ready");
      }
    };

    activeCard.addEventListener("pointerup", finishDrag);
    activeCard.addEventListener("pointercancel", finishDrag);
  }

  function bindSheetEvents() {
    bindRoutineStickyEvents();

    document.querySelectorAll(".try-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("[data-del-check]")) return;
        const id = el.getAttribute("data-check-id");
        const item = state.checklists.find((c) => c.id === id);
        if (!item) return;
        item.done = !item.done;
        item.updatedAt = new Date().toISOString();
        syncManager.saveLocalChecklists(state.checklists);
        syncManager.upsertChecklistToCloud(item);
        renderMainSheet();
      });
    });

    document.querySelectorAll("[data-del-check]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-del-check");
        state.checklists = state.checklists.filter((c) => c.id !== id);
        syncManager.saveLocalChecklists(state.checklists);
        syncManager.deleteChecklistFromCloud(id);
        renderMainSheet();
      });
    });

    const inlineInput = document.getElementById("inlineChecklistInput");
    if (inlineInput) {
      inlineInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && inlineInput.value.trim()) {
          e.preventDefault();
          const targetCat =
            state.activeCategory === "calendar" ? "todo" : state.activeCategory;
          const prevRoutine = state.checklists
            .filter((c) => c.category === targetCat && !c.done)
            .slice(-1)[0];
          const newItem = {
            id: "chk-" + Date.now(),
            category: targetCat,
            date: state.selectedDate || getTodayStr(),
            text: inlineInput.value.trim(),
            colorKey: pickRandomStickyColor(prevRoutine?.colorKey),
            done: false,
            updatedAt: new Date().toISOString(),
          };
          state.checklists.push(newItem);
          if (targetCat === "routine") {
            const pendingCount = state.checklists.filter(
              (c) =>
                c.category === "routine" &&
                !c.done &&
                (!state.selectedDate || c.date === state.selectedDate)
            ).length;
            state.routineStickyIndex = Math.max(0, pendingCount - 1);
          }
          syncManager.saveLocalChecklists(state.checklists);
          syncManager.upsertChecklistToCloud(newItem);
          renderMainSheet();
        }
      });
    }

    const sproutBtn = document.getElementById("sproutWidgetBtn");
    if (sproutBtn) {
      sproutBtn.addEventListener("click", () => {
        const inp = document.getElementById("inlineChecklistInput");
        if (inp) inp.focus();
      });
    }

    const sortSel = document.getElementById("sortOrderSelect");
    if (sortSel) {
      sortSel.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        renderMainSheet();
      });
    }

    const clearDateBtn = document.getElementById("clearDateFilterBtn");
    if (clearDateBtn) {
      clearDateBtn.addEventListener("click", () => {
        state.selectedDate = null;
        renderMainSheet();
      });
    }

    const prevMonthBtn = document.getElementById("calPrevMonthBtn");
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => {
        state.calendarAnimDir = "prev";
        state.calendarMonth--;
        if (state.calendarMonth < 0) {
          state.calendarMonth = 11;
          state.calendarYear--;
        }
        renderMainSheet();
      });
    }

    const nextMonthBtn = document.getElementById("calNextMonthBtn");
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => {
        state.calendarAnimDir = "next";
        state.calendarMonth++;
        if (state.calendarMonth > 11) {
          state.calendarMonth = 0;
          state.calendarYear++;
        }
        renderMainSheet();
      });
    }

    const todayBtn = document.getElementById("calTodayBtn");
    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        const gridEl = document.getElementById("calendarGridEl");
        const prevCell = gridEl?.querySelector(".cal-day.selected");
        if (gridEl && prevCell) {
          const gRect = gridEl.getBoundingClientRect();
          const cRect = prevCell.getBoundingClientRect();
          state.glideFromOffset = {
            left: cRect.left - gRect.left,
            top: cRect.top - gRect.top,
          };
        }
        const now = new Date();
        state.calendarYear = now.getFullYear();
        state.calendarMonth = now.getMonth();
        state.selectedDate = getTodayStr();
        renderMainSheet();
      });
    }

    const allDatesBtn = document.getElementById("calAllDatesBtn");
    if (allDatesBtn) {
      allDatesBtn.addEventListener("click", () => {
        state.selectedDate = null;
        renderMainSheet();
      });
    }

    const foldBtn = document.getElementById("calFoldToggleBtn");
    if (foldBtn) {
      foldBtn.addEventListener("click", () => {
        state.calendarFolded = !state.calendarFolded;
        state.calendarAnimDir = "fold";
        renderMainSheet();
      });
    }

    document.querySelectorAll("[data-cal-date]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const clickedDate = btn.getAttribute("data-cal-date");
        const gridEl = document.getElementById("calendarGridEl");
        const prevCell = gridEl?.querySelector(".cal-day.selected");
        if (gridEl && prevCell && state.selectedDate !== clickedDate) {
          const gRect = gridEl.getBoundingClientRect();
          const cRect = prevCell.getBoundingClientRect();
          state.glideFromOffset = {
            left: cRect.left - gRect.left,
            top: cRect.top - gRect.top,
          };
        } else {
          state.glideFromOffset = null;
        }

        if (state.selectedDate === clickedDate) {
          state.selectedDate = null;
        } else {
          state.selectedDate = clickedDate;
        }
        renderMainSheet();
      });
    });

    document.querySelectorAll("[data-bookmark-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const pieceId = btn.getAttribute("data-bookmark-id");
        toggleBookmark(pieceId);
      });
    });

    document.querySelectorAll(".piece-card").forEach((card) => {
      card.addEventListener("click", () => {
        const pieceId = card.getAttribute("data-piece-id");
        if (pieceId) openDetailModal(pieceId);
      });
    });
  }

  function toggleBookmark(pieceId) {
    const piece = state.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    piece.bookmarked = !piece.bookmarked;
    piece.updatedAt = new Date().toISOString();
    syncManager.saveLocalPieces(state.pieces);
    syncManager.upsertPieceToCloud(piece);
    renderAll();
    showToast(piece.bookmarked ? "🔖 북마크에 저장했습니다." : "북마크를 해제했습니다.");
  }

  // ==========================================================================
  // Write / Edit Piece Modal + Image Upload Processing
  // ==========================================================================

  function openWriteModal(editPiece) {
    const modal = document.getElementById("writeModalBackdrop");
    const titleEl = document.getElementById("writeModalTitle");
    const catSelect = document.getElementById("pieceCategoryInput");
    const dateInput = document.getElementById("pieceDateInput");
    const titleInput = document.getElementById("pieceTitleInput");
    const contentInput = document.getElementById("pieceContentInput");
    const sourceInput = document.getElementById("pieceSourceInput");
    const tagsInput = document.getElementById("pieceTagsInput");
    const bookmarkCheck = document.getElementById("pieceBookmarkCheck");

    if (!modal) return;

    if (editPiece) {
      state.editingPieceId = editPiece.id;
      titleEl.textContent = "조각 수정하기";
      catSelect.value = editPiece.category;
      dateInput.value = editPiece.date || getTodayStr();
      titleInput.value = editPiece.title || "";
      contentInput.value = editPiece.content || "";
      sourceInput.value = editPiece.source || "";
      tagsInput.value = (editPiece.tags || []).join(", ");
      bookmarkCheck.checked = Boolean(editPiece.bookmarked);
      state.draftImages = Array.isArray(editPiece.images) ? [...editPiece.images] : [];
    } else {
      state.editingPieceId = null;
      titleEl.textContent = "새로운 조각 기록";
      catSelect.value =
        state.activeCategory === "calendar" ? "routine" : state.activeCategory;
      dateInput.value = state.selectedDate || getTodayStr();
      titleInput.value = "";
      contentInput.value = "";
      sourceInput.value = "";
      tagsInput.value = "";
      bookmarkCheck.checked = false;
      state.draftImages = [];
    }

    renderDraftImagePreviews();
    modal.classList.add("open");
    setTimeout(() => {
      if (titleInput) titleInput.focus();
    }, 80);
  }

  function closeWriteModal() {
    const modal = document.getElementById("writeModalBackdrop");
    if (modal) modal.classList.remove("open");
  }

  function renderDraftImagePreviews() {
    const grid = document.getElementById("uploadPreviewGrid");
    if (!grid) return;
    grid.innerHTML = state.draftImages
      .map(
        (src, idx) => `
        <div class="upload-preview-item">
          <img src="${src}" alt="업로드 미리보기 ${idx + 1}" />
          <button type="button" class="upload-remove-btn" data-remove-img="${idx}" title="이미지 삭제">✕</button>
        </div>
      `
      )
      .join("");

    grid.querySelectorAll("[data-remove-img]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = Number(btn.getAttribute("data-remove-img"));
        state.draftImages.splice(idx, 1);
        renderDraftImagePreviews();
      });
    });
  }

  async function compressImageFile(file, maxWidth = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const compressed = await compressImageFile(file);
        state.draftImages.push(compressed);
      } catch (err) {
        console.error("Image compression error:", err);
      }
    }
    renderDraftImagePreviews();
  }

  function savePieceFromModal(e) {
    e.preventDefault();
    const catSelect = document.getElementById("pieceCategoryInput");
    const dateInput = document.getElementById("pieceDateInput");
    const titleInput = document.getElementById("pieceTitleInput");
    const contentInput = document.getElementById("pieceContentInput");
    const sourceInput = document.getElementById("pieceSourceInput");
    const tagsInput = document.getElementById("pieceTagsInput");
    const bookmarkCheck = document.getElementById("pieceBookmarkCheck");

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title && !content && state.draftImages.length === 0) {
      showToast("제목이나 내용, 또는 이미지를 입력해주세요.");
      titleInput.focus();
      return;
    }

    const parsedTags = tagsInput.value
      .split(",")
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    const nowIso = new Date().toISOString();

    if (state.editingPieceId) {
      const existing = state.pieces.find((p) => p.id === state.editingPieceId);
      if (existing) {
        existing.category = catSelect.value;
        existing.date = dateInput.value || getTodayStr();
        existing.title = title || (content ? content.slice(0, 40) : "이미지 조각");
        existing.content = content;
        existing.source = sourceInput.value.trim();
        existing.tags = parsedTags;
        existing.images = [...state.draftImages];
        existing.bookmarked = bookmarkCheck.checked;
        existing.updatedAt = nowIso;

        syncManager.saveLocalPieces(state.pieces);
        syncManager.upsertPieceToCloud(existing);
        showToast("조각이 수정되었습니다.");
      }
    } else {
      const newPiece = {
        id: "piece-" + Date.now(),
        category: catSelect.value,
        date: dateInput.value || getTodayStr(),
        title: title || (content ? content.slice(0, 40) : "이미지 조각"),
        content,
        source: sourceInput.value.trim(),
        tags: parsedTags,
        images: [...state.draftImages],
        bookmarked: bookmarkCheck.checked,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.pieces.unshift(newPiece);
      syncManager.saveLocalPieces(state.pieces);
      syncManager.upsertPieceToCloud(newPiece);

      if (state.activeCategory !== "calendar") {
        state.activeCategory = newPiece.category;
      }
      showToast("✨ 새로운 조각이 저장되었습니다.");
    }

    closeWriteModal();
    renderAll();
  }

  // ==========================================================================
  // Detail View Modal
  // ==========================================================================

  function openDetailModal(pieceId) {
    const piece = state.pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    state.viewingPieceId = piece.id;

    const modal = document.getElementById("detailModalBackdrop");
    const body = document.getElementById("detailModalBody");
    if (!modal || !body) return;

    const catMeta = getCategoryMeta(piece.category);

    const imagesGallery =
      Array.isArray(piece.images) && piece.images.length > 0
        ? `
        <div class="detail-images-gallery">
          ${piece.images
          .map(
            (src) =>
              `<img src="${src}" alt="첨부 이미지" class="detail-image-full" />`
          )
          .join("")}
        </div>
      `
        : "";

    body.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
        <div class="piece-meta-left" style="font-size:13px;">
          <span>${formatKoreanShortDate(piece.date)}</span>
          <span>·</span>
          <span class="piece-cat-badge">${catMeta.icon} ${catMeta.name}</span>
        </div>
        <button
          type="button"
          class="pill-btn ${piece.bookmarked ? "active" : ""}"
          id="detailBookmarkBtn"
        >
          🔖 ${piece.bookmarked ? "북마크됨" : "북마크"}
        </button>
      </div>

      <h2 style="font-size:22px; font-weight:652; line-height:1.25; color:var(--ink); margin-top:4px;">
        ${escapeHtml(piece.title)}
      </h2>

      ${piece.source
        ? `<div class="piece-quote-source" style="font-size:13px;">출처 · ${escapeHtml(
          piece.source
        )}</div>`
        : ""
      }

      ${piece.content
        ? `<div class="detail-body-text">${escapeHtml(piece.content)}</div>`
        : ""
      }

      ${imagesGallery}

      ${Array.isArray(piece.tags) && piece.tags.length > 0
        ? `<div class="piece-tags-row" style="margin-top:8px;">
              ${piece.tags
          .map(
            (t) =>
              `<span class="piece-tag-chip" style="background-color:var(--field);">#${escapeHtml(
                t
              )}</span>`
          )
          .join("")}
            </div>`
        : ""
      }
    `;

    const detailBmBtn = document.getElementById("detailBookmarkBtn");
    if (detailBmBtn) {
      detailBmBtn.addEventListener("click", () => {
        toggleBookmark(piece.id);
        openDetailModal(piece.id);
      });
    }

    modal.classList.add("open");
  }

  function closeDetailModal() {
    const modal = document.getElementById("detailModalBackdrop");
    if (modal) modal.classList.remove("open");
    state.viewingPieceId = null;
  }

  // ==========================================================================
  // Cloud Sync & Backup Settings Modal
  // ==========================================================================

  function openCloudModal() {
    const modal = document.getElementById("cloudModalBackdrop");
    if (!modal) return;
    const cfg = syncManager.loadCloudConfig();
    document.getElementById("supabaseUrlInput").value = cfg.supabaseUrl || "";
    document.getElementById("supabaseKeyInput").value = cfg.supabaseAnonKey || "";
    document.getElementById("workspaceIdInput").value =
      cfg.workspaceId || "personal-default";
    document.getElementById("sqlSetupBox").textContent = SUPABASE_SETUP_SQL;
    modal.classList.add("open");
  }

  function closeCloudModal() {
    const modal = document.getElementById("cloudModalBackdrop");
    if (modal) modal.classList.remove("open");
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("mobbinToast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2400);
  }

  // ==========================================================================
  // App Bootstrapping
  // ==========================================================================

  function initApp() {
    loadInitialData();

    const catSelect = document.getElementById("pieceCategoryInput");
    if (catSelect) {
      catSelect.innerHTML = CATEGORIES.filter((c) => c.id !== "calendar")
        .map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
        .join("");
    }

    renderAll();
    syncManager.initCloud();

    document.getElementById("headerSearchToggle")?.addEventListener("click", () => {
      const bar = document.getElementById("searchBarDrawer");
      const input = document.getElementById("globalSearchInput");
      if (!bar) return;
      const isOpen = bar.classList.toggle("open");
      if (isOpen) {
        input?.focus();
      } else {
        state.searchQuery = "";
        if (input) input.value = "";
        renderMainSheet();
      }
    });

    document.getElementById("globalSearchInput")?.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderMainSheet();
    });

    document.getElementById("headerBookmarkToggle")?.addEventListener("click", () => {
      state.bookmarkOnly = !state.bookmarkOnly;
      renderAll();
    });

    document.getElementById("headerCloudBtn")?.addEventListener("click", () => {
      openCloudModal();
    });

    document.getElementById("brandHomeBtn")?.addEventListener("click", () => {
      state.selectedDate = null;
      state.bookmarkOnly = false;
      state.activeSubtype = "ALL";
      state.searchQuery = "";
      const sInput = document.getElementById("globalSearchInput");
      if (sInput) sInput.value = "";
      document.getElementById("searchBarDrawer")?.classList.remove("open");
      renderAll();
    });

    document.getElementById("floatingWriteBtn")?.addEventListener("click", () => {
      openWriteModal(null);
    });

    document.getElementById("floatingDatePill")?.addEventListener("click", () => {
      state.activeCategory = "calendar";
      if (!state.selectedDate) state.selectedDate = getTodayStr();
      renderAll();
    });

    document
      .getElementById("closeWriteModalBtn")
      ?.addEventListener("click", closeWriteModal);
    document
      .getElementById("cancelWriteModalBtn")
      ?.addEventListener("click", closeWriteModal);
    document
      .getElementById("writePieceForm")
      ?.addEventListener("submit", savePieceFromModal);

    const dropZone = document.getElementById("imageUploadDropzone");
    const fileInput = document.getElementById("pieceImageFileInput");

    dropZone?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", (e) => {
      handleImageFiles(e.target.files);
      fileInput.value = "";
    });

    dropZone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone?.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });
    dropZone?.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      handleImageFiles(e.dataTransfer?.files);
    });

    window.addEventListener("paste", (e) => {
      const modal = document.getElementById("writeModalBackdrop");
      if (!modal?.classList.contains("open")) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        handleImageFiles(imageFiles);
        showToast("📋 클립보드 이미지가 첨부되었습니다.");
      }
    });

    document
      .getElementById("closeDetailModalBtn")
      ?.addEventListener("click", closeDetailModal);

    document.getElementById("detailEditBtn")?.addEventListener("click", () => {
      const piece = state.pieces.find((p) => p.id === state.viewingPieceId);
      closeDetailModal();
      if (piece) openWriteModal(piece);
    });

    document.getElementById("detailDeleteBtn")?.addEventListener("click", () => {
      if (!state.viewingPieceId) return;
      const targetId = state.viewingPieceId;
      state.pieces = state.pieces.filter((p) => p.id !== targetId);
      syncManager.saveLocalPieces(state.pieces);
      syncManager.deletePieceFromCloud(targetId);
      closeDetailModal();
      renderAll();
      showToast("조각을 삭제했습니다.");
    });

    document
      .getElementById("closeCloudModalBtn")
      ?.addEventListener("click", closeCloudModal);

    document.getElementById("saveCloudConfigBtn")?.addEventListener("click", async () => {
      const url = document.getElementById("supabaseUrlInput").value;
      const key = document.getElementById("supabaseKeyInput").value;
      const ws = document.getElementById("workspaceIdInput").value;
      syncManager.saveCloudConfig({
        supabaseUrl: url,
        supabaseAnonKey: key,
        workspaceId: ws,
      });
      const ok = await syncManager.initCloud();
      if (ok) {
        await syncManager.pushAllLocalToCloud(state.pieces, state.checklists);
        showToast("☁️ 클라우드 DB 연결 및 전체 동기화 완료!");
        closeCloudModal();
      } else {
        showToast("로컬 저장 모드로 동작합니다 (URL/Key를 확인해주세요).");
      }
    });

    document.getElementById("copySqlBtn")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(SUPABASE_SETUP_SQL);
      showToast("📋 SQL 쿼리가 클립보드에 복사되었습니다.");
    });

    document.getElementById("exportJsonBtn")?.addEventListener("click", () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        pieces: state.pieces,
        checklists: state.checklists,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-journal-backup-${getTodayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("💾 백업 파일(.json)을 다운로드했습니다.");
    });

    const importInput = document.getElementById("importJsonFileInput");
    document.getElementById("importJsonBtn")?.addEventListener("click", () => {
      importInput?.click();
    });

    importInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (Array.isArray(parsed.pieces)) {
            state.pieces = parsed.pieces;
            syncManager.saveLocalPieces(state.pieces);
          }
          if (Array.isArray(parsed.checklists)) {
            state.checklists = parsed.checklists;
            syncManager.saveLocalChecklists(state.checklists);
          }
          renderAll();
          closeCloudModal();
          showToast("✅ 백업 데이터를 성공적으로 불러왔습니다.");
        } catch (err) {
          showToast("올바른 JSON 백업 파일이 아닙니다.");
        }
      };
      reader.readAsText(file);
      importInput.value = "";
    });

    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove("open");
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
