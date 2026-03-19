/* ========================================
   App Shell, Routes, and Shared Renderers
   ======================================== */

import {
  LEVELS,
  getDefaultLevel,
  getLevelById,
  getLevelRoute,
  renderHomePage,
  renderLevelPage,
} from './levels.js';
import { ElevatorSim } from './elevator-sim.js';
import { createRenderer } from './renderers.js';
import { setupLevel2Runner } from './level2-runner.js';
import './theme.js';

document.addEventListener('DOMContentLoaded', () => {
  const pageContent = document.getElementById('page-content');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const breadcrumbSeparator = document.querySelector('.header__breadcrumb-sep');
  const headerBadge = document.getElementById('header-badge');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuBtn = document.getElementById('menu-btn');

  const TOTAL_FLOORS = 10;
  const MOBILE_HUD_MEDIA_QUERY = '(max-width: 600px)';
  const VIEW_MODE_STORAGE_KEY = 'elevator-view-mode';

  let currentRoute = null;
  let currentLevel = null;
  let currentSpeed = 1;
  let currentViewMode = getStoredViewMode();
  let replayTimeout = null;
  let autoStartTimeout = null;
  let sim = null;
  let activeRenderer = null;
  let eventTimeline = [];
  let currentTimelineIndex = -1;
  let currentLiveState = null;
  let isBrowsingHistory = false;
  let isAdvancingTimeline = false;

  document.documentElement.setAttribute('data-view-mode', currentViewMode);

  function getStoredViewMode() {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === '2d' ? '2d' : '3d';
  }

  function setStoredViewMode(mode) {
    currentViewMode = mode === '2d' ? '2d' : '3d';
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, currentViewMode);
    document.documentElement.setAttribute('data-view-mode', currentViewMode);
  }

  function isMobileHudViewport() {
    return window.matchMedia(MOBILE_HUD_MEDIA_QUERY).matches;
  }

  function shouldUseCompactSimPanels() {
    return isMobileHudViewport() || currentViewMode === '2d';
  }

  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function getTimelineEventId(state) {
    return state?.log?.[0]?.id ?? null;
  }

  function getTimelineEdgeIndex() {
    return eventTimeline.length - 1;
  }

  function getTimelineEdgeState() {
    return eventTimeline[getTimelineEdgeIndex()]?.state ?? null;
  }

  function parseRoute(pathname) {
    const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

    if (normalized === '/' || normalized === '') {
      return { name: 'home' };
    }

    const match = normalized.match(/^\/level\/(\d+)$/);
    if (match) {
      const levelId = Number.parseInt(match[1], 10);
      if (getLevelById(levelId)) {
        return { name: 'level', levelId };
      }
    }

    return { name: 'home', invalidPath: true };
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
  }

  function updateSidebar(levelId) {
    document.querySelectorAll('.sidebar__item[data-level]').forEach(item => {
      item.classList.toggle('active', Number.parseInt(item.dataset.level, 10) === levelId);
    });
  }

  function updateHeader(route) {
    if (route.name === 'level') {
      const level = getLevelById(route.levelId);
      breadcrumbCurrent.textContent = `Level ${level.id}`;
      if (breadcrumbCurrent) breadcrumbCurrent.hidden = false;
      if (breadcrumbSeparator) breadcrumbSeparator.hidden = false;
      headerBadge.textContent = `${level.icon} ${level.badge}`;
      headerBadge.className = `badge ${level.badgeClass}`;
      document.title = `${level.title} - Elevator Challenge`;
      return;
    }

    if (breadcrumbCurrent) breadcrumbCurrent.hidden = true;
    if (breadcrumbSeparator) breadcrumbSeparator.hidden = true;
    headerBadge.textContent = currentViewMode === '2d' ? '2D Front View' : '3D Building View';
    headerBadge.className = 'badge badge--muted';
    document.title = 'Elevator Challenge - Home';
  }

  function setHomeModalOpen(open) {
    const modal = document.getElementById('home-view-modal');
    if (!modal) return;

    modal.classList.toggle('is-open', open);
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('modal-open', open);
  }

  function syncViewModeUI() {
    document.querySelectorAll('[data-view-mode-switch]').forEach(button => {
      const isActive = button.dataset.viewModeSwitch === currentViewMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('[data-view-mode-option]').forEach(button => {
      const isActive = button.dataset.viewModeOption === currentViewMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

      const check = button.querySelector('.home-view-option__check');
      if (check) {
        check.textContent = isActive ? 'Selected' : 'Choose';
      }
    });

    const currentViewLabel = document.getElementById('home-current-view-label');
    if (currentViewLabel) {
      currentViewLabel.textContent = currentViewMode === '2d' ? '2D Front View' : '3D';
    }

    document.querySelectorAll('[data-current-view-badge]').forEach(node => {
      node.textContent = currentViewMode === '2d' ? '2D active' : '3D active';
    });
  }

  function setMobileHudExpanded(expanded) {
    const hud = document.getElementById('sim-mobile-hud');
    const toggle = document.getElementById('sim-mobile-hud-toggle');
    const toggleLabel = toggle?.querySelector('.sim-mobile-hud__toggle-label');
    const toggleIcon = toggle?.querySelector('.sim-mobile-hud__toggle-icon');

    if (!hud || !toggle) return;

    hud.classList.toggle('is-open', expanded);
    hud.classList.toggle('is-collapsed', !expanded);
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    if (toggleLabel) {
      toggleLabel.textContent = expanded ? 'Hide Floor & People' : 'Floor & People';
    }

    if (toggleIcon) {
      toggleIcon.textContent = expanded ? 'X' : '=';
    }
  }

  function syncMobileHudForViewport() {
    const hud = document.getElementById('sim-mobile-hud');
    if (!hud) return;

    if (shouldUseCompactSimPanels()) {
      setMobileHudExpanded(false);
      return;
    }

    setMobileHudExpanded(true);
  }

  function setLiveFeedExpanded(expanded) {
    const feedOverlay = document.getElementById('sim-feed-overlay');
    if (!feedOverlay) return;

    feedOverlay.classList.toggle('open', expanded);
  }

  function syncLiveFeedForViewport() {
    const feedOverlay = document.getElementById('sim-feed-overlay');
    if (!feedOverlay) return;

    setLiveFeedExpanded(!shouldUseCompactSimPanels());
  }

  function setPlayButtonState(mode) {
    const playStopBtn = document.getElementById('sim-play-stop-btn');
    if (!playStopBtn) return;

    playStopBtn.dataset.state = mode;

    if (mode === 'playing') {
      playStopBtn.innerHTML = `
        <span class="sim-action-btn__icon" style="color:var(--color-error);">&#9209;</span>
        <span class="sim-action-btn__label">Stop</span>
      `;
      return;
    }

    if (mode === 'complete') {
      playStopBtn.innerHTML = `
        <span class="sim-action-btn__icon" style="color:var(--color-success);">&#8635;</span>
        <span class="sim-action-btn__label">Play again</span>
      `;
      return;
    }

    playStopBtn.innerHTML = `
      <span class="sim-action-btn__icon" style="color:var(--color-success);">&#9654;</span>
      <span class="sim-action-btn__label">Play</span>
    `;
  }

  function destroySim() {
    if (replayTimeout) {
      clearTimeout(replayTimeout);
      replayTimeout = null;
    }

    if (autoStartTimeout) {
      clearTimeout(autoStartTimeout);
      autoStartTimeout = null;
    }

    eventTimeline = [];
    currentTimelineIndex = -1;
    currentLiveState = null;
    isBrowsingHistory = false;
    isAdvancingTimeline = false;

    if (sim) {
      sim._running = false;
      sim._paused = false;
      sim.stepMode = false;

      if (sim._pauseResolve) {
        sim._pauseResolve();
        sim._pauseResolve = null;
      }

      if (sim._stepResolve) {
        sim._stepResolve();
        sim._stepResolve = null;
      }

      sim.onUpdate = null;
      sim = null;
    }

    if (activeRenderer) {
      activeRenderer.destroy();
      activeRenderer = null;
    }
  }

  function appendTimelineEntry(state) {
    const eventId = getTimelineEventId(state);
    if (eventId == null) return;

    const lastEntry = eventTimeline[eventTimeline.length - 1];
    if (lastEntry?.eventId === eventId) return;

    eventTimeline.push({
      eventId,
      state: cloneState(state),
    });

    if (!isBrowsingHistory) {
      currentTimelineIndex = getTimelineEdgeIndex();
    }
  }

  function mountRenderer(level) {
    if (activeRenderer) {
      activeRenderer.destroy();
      activeRenderer = null;
    }

    activeRenderer = createRenderer({
      mode: currentViewMode,
      containerId: 'sim-canvas-container',
      isLocked: level.status === 'locked',
      totalFloors: TOTAL_FLOORS,
    });

    activeRenderer.mount();

    const snapshot = eventTimeline[currentTimelineIndex]?.state ?? currentLiveState ?? sim?.getState?.() ?? null;
    if (snapshot) {
      activeRenderer.update(snapshot);
    }
  }

  function renderSnapshot(state) {
    renderStateDOM(state);
    activeRenderer?.update(state);
  }

  function renderTimelineEntry(index) {
    const entry = eventTimeline[index];
    if (!entry) return;

    currentTimelineIndex = index;
    renderSnapshot(entry.state);
  }

  function pauseForTimelineNavigation() {
    if (replayTimeout) {
      clearTimeout(replayTimeout);
      replayTimeout = null;
    }

    if (!sim) return;

    sim.stepMode = true;

    if (sim._running && !sim._paused && sim.state !== 'complete') {
      sim.pause();
    }

    setPlayButtonState('stopped');
  }

  async function stepToNextTimelineEvent() {
    if (!sim || isAdvancingTimeline) return;

    if (currentTimelineIndex < getTimelineEdgeIndex()) {
      const nextIndex = currentTimelineIndex + 1;
      isBrowsingHistory = nextIndex < getTimelineEdgeIndex();
      renderTimelineEntry(nextIndex);
      return;
    }

    const edgeState = getTimelineEdgeState() ?? currentLiveState ?? sim.getState();
    if (edgeState?.state === 'complete') {
      renderStateDOM(edgeState);
      return;
    }

    pauseForTimelineNavigation();
    isBrowsingHistory = false;
    isAdvancingTimeline = true;

    try {
      await sim.advanceToNextEvent();
      const nextEdgeIndex = getTimelineEdgeIndex();

      if (nextEdgeIndex >= 0) {
        currentTimelineIndex = nextEdgeIndex;
        renderTimelineEntry(nextEdgeIndex);
      } else if (currentLiveState) {
        renderSnapshot(currentLiveState);
      }
    } finally {
      isAdvancingTimeline = false;
      renderStateDOM(
        eventTimeline[currentTimelineIndex]?.state ??
        currentLiveState ??
        sim?.getState?.() ??
        edgeState
      );
    }
  }

  function bindControls(level, autoStart) {
    const playStopBtn = document.getElementById('sim-play-stop-btn');
    const resetBtn = document.getElementById('sim-reset-btn');
    const mobileHudToggle = document.getElementById('sim-mobile-hud-toggle');
    const backBtn = document.getElementById('sim-step-back');
    const nextBtn = document.getElementById('sim-step-next');
    const feedToggle = document.getElementById('sim-feed-toggle');
    const feedOverlay = document.getElementById('sim-feed-overlay');
    const feedClose = document.getElementById('sim-feed-close');

    setPlayButtonState(autoStart ? 'playing' : 'stopped');
    syncMobileHudForViewport();
    syncLiveFeedForViewport();

    if (mobileHudToggle) {
      mobileHudToggle.addEventListener('click', () => {
        if (!shouldUseCompactSimPanels()) return;
        const isExpanded = mobileHudToggle.getAttribute('aria-expanded') === 'true';
        setMobileHudExpanded(!isExpanded);
      });
    }

    if (playStopBtn) {
      playStopBtn.addEventListener('click', () => {
        if (!sim) return;

        if (playStopBtn.dataset.state === 'complete') {
          renderRoute({ name: 'level', levelId: level.id }, { replaceHistory: true, autoStartLevel: true });
          return;
        }

        if (playStopBtn.dataset.state === 'playing') {
          renderRoute({ name: 'level', levelId: level.id }, { replaceHistory: true, autoStartLevel: false });
          return;
        }

        isBrowsingHistory = false;
        sim.stepMode = false;

        if (currentTimelineIndex < getTimelineEdgeIndex()) {
          currentTimelineIndex = getTimelineEdgeIndex();
          renderTimelineEntry(currentTimelineIndex);
        } else if (currentLiveState) {
          renderSnapshot(currentLiveState);
        }

        if (sim._stepResolve) {
          sim.step();
        }

        if (sim._paused) {
          sim.resume();
        } else if (!sim._running) {
          sim.run();
        }

        setPlayButtonState('playing');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!sim) return;
        renderRoute({ name: 'level', levelId: level.id }, { replaceHistory: true, autoStartLevel: true });
      });
    }

    document.querySelectorAll('.speed-btn').forEach(button => {
      button.addEventListener('click', () => {
        const speed = Number.parseInt(button.dataset.speed, 10);
        currentSpeed = speed;
        sim?.setSpeed(speed);

        document.querySelectorAll('.speed-btn').forEach(candidate => {
          candidate.classList.toggle('active', Number.parseInt(candidate.dataset.speed, 10) === currentSpeed);
          candidate.style.background = '';
          candidate.style.color = '';
        });
      });
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (isAdvancingTimeline || currentTimelineIndex <= 0) return;

        pauseForTimelineNavigation();
        isBrowsingHistory = true;
        renderTimelineEntry(currentTimelineIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        await stepToNextTimelineEvent();
      });
    }

    if (feedToggle && feedOverlay) {
      feedToggle.addEventListener('click', () => {
        setLiveFeedExpanded(true);
      });
    }

    if (feedClose && feedOverlay) {
      feedClose.addEventListener('click', () => {
        setLiveFeedExpanded(false);
      });
    }
  }

  function initSim(level, autoStart = true) {
    window.setTimeout(() => {
      mountRenderer(level);
      syncViewModeUI();
    }, 0);

    if (level.status === 'locked') {
      return;
    }

    sim = new ElevatorSim(TOTAL_FLOORS);
    sim.setSpeed(currentSpeed);

    window.setTimeout(() => {
      bindControls(level, autoStart);

      sim.onUpdate = state => {
        const snapshot = cloneState(state);
        currentLiveState = snapshot;
        appendTimelineEntry(snapshot);

        if (!isBrowsingHistory) {
          currentTimelineIndex = getTimelineEdgeIndex();
          renderSnapshot(snapshot);
        } else {
          renderStateDOM(eventTimeline[currentTimelineIndex]?.state ?? snapshot);
        }
      };

      level.testPersons.forEach(person => sim.addPerson(person.name, person.pickup, person.dropoff));

      const initialState = cloneState(sim.getState());
      currentLiveState = initialState;
      renderStateDOM(initialState);

      setPlayButtonState(autoStart ? 'playing' : 'stopped');

      if (autoStart) {
        autoStartTimeout = window.setTimeout(() => {
          sim?.run();
          autoStartTimeout = null;
        }, 600);
      }
    }, 100);
  }

  function renderStateDOM(state) {
    if (!state) return;

    const floorNum = document.getElementById('sim-floor-num');
    const dirEl = document.getElementById('sim-dir');

    if (floorNum) floorNum.textContent = state.currentFloor;

    if (dirEl) {
      dirEl.textContent = '^';
      dirEl.className = 'floor-display-digital__dir';

      if (state.direction === 'up') dirEl.classList.add('floor-display-digital__dir--up');
      else if (state.direction === 'down') dirEl.classList.add('floor-display-digital__dir--down');
      else dirEl.classList.add('floor-display-digital__dir--idle');
    }

    const statFloor = document.getElementById('stat-floor');
    const statStops = document.getElementById('stat-stops');
    const statTraversed = document.getElementById('stat-traversed');
    const statRiders = document.getElementById('stat-riders');

    if (statFloor) statFloor.textContent = state.currentFloor;
    if (statStops) statStops.textContent = state.stops;
    if (statTraversed) statTraversed.textContent = state.floorsTraversed;
    if (statRiders) statRiders.textContent = state.riders.length;

    const dot = document.getElementById('sim-status-dot');
    const text = document.getElementById('sim-status-text');

    if (dot && text) {
      dot.className = 'status-dot';

      if (state.state === 'complete') {
        dot.classList.add('status-dot--complete');
        text.textContent = 'Complete';
        setPlayButtonState('complete');
      } else if (state.state === 'paused') {
        dot.classList.add('status-dot--idle');
        text.textContent = 'Paused';
      } else if (state.state === 'doors-open') {
        dot.classList.add('status-dot--doors');
        text.textContent = `Doors Open - Floor ${state.currentFloor}`;
      } else if (state.state === 'moving-up' || state.state === 'moving-down') {
        dot.classList.add('status-dot--moving');
        text.textContent = `Moving ${state.direction} - Floor ${state.currentFloor}`;
      } else {
        dot.classList.add('status-dot--idle');
        text.textContent = `Idle - Floor ${state.currentFloor}`;
      }
    }

    const roster = document.getElementById('sim-roster');
    const rosterCount = document.getElementById('sim-roster-count');

    if (roster) {
      if (state.allPersons.length === 0) {
        roster.innerHTML = '<span style="font-size:var(--text-xs);color:var(--text-muted);">No persons</span>';
        if (rosterCount) rosterCount.textContent = '0 / 0';
      } else {
        let doneCount = 0;

        roster.innerHTML = state.allPersons.map(person => {
          let statusBadge = '';

          if (person.status === 'waiting') statusBadge = '<span class="badge badge--warning">Waiting</span>';
          else if (person.status === 'walking-to-elevator') statusBadge = '<span class="badge badge--warning">Boarding</span>';
          else if (person.status === 'riding') statusBadge = '<span class="badge badge--info">Riding</span>';
          else if (person.status === 'walking-out') statusBadge = '<span class="badge badge--info">Exiting</span>';
          else if (person.status === 'done') {
            statusBadge = '<span class="badge badge--success">Done</span>';
            doneCount++;
          }

          return `
            <div class="person-roster__item">
              <div class="person-roster__color" style="background:${person.color};"></div>
              <span class="person-roster__name">${person.name}</span>
              <span class="person-roster__route">F${person.currentFloor} -> F${person.dropOffFloor}</span>
              <span class="person-roster__status">${statusBadge}</span>
            </div>
          `;
        }).join('');

        if (rosterCount) rosterCount.textContent = `${doneCount} / ${state.allPersons.length}`;
      }
    }

    const logEl = document.getElementById('sim-log');
    if (logEl) {
      if (!state.log.length) {
        logEl.innerHTML = '<div class="live-feed__entry"><span>Waiting for simulation...</span></div>';
      } else {
        logEl.innerHTML = state.log.map(entry => `
          <div class="live-feed__entry" data-log-id="${entry.id}">
            <span class="live-feed__time">${entry.time}</span>
            <span>${entry.message}</span>
          </div>
        `).join('');
      }
    }

    const backBtn = document.getElementById('sim-step-back');
    const nextBtn = document.getElementById('sim-step-next');
    const liveEdgeIndex = getTimelineEdgeIndex();
    const liveEdgeState = getTimelineEdgeState() ?? currentLiveState ?? state;

    if (backBtn) {
      backBtn.disabled = isAdvancingTimeline || currentTimelineIndex <= 0;
    }

    if (nextBtn) {
      const noNextEvent = currentTimelineIndex >= liveEdgeIndex && liveEdgeState?.state === 'complete';
      nextBtn.disabled = isAdvancingTimeline || noNextEvent;
    }

    document.querySelectorAll('.speed-btn').forEach(button => {
      button.classList.toggle('active', Number.parseInt(button.dataset.speed, 10) === state.speed);
      button.style.background = '';
      button.style.color = '';
    });
  }

  function renderRoute(route, options = {}) {
    const { replaceHistory = false, autoStartLevel = true } = options;

    destroySim();
    currentRoute = route;
    currentLevel = route.name === 'level' ? route.levelId : null;

    if (route.invalidPath) {
      window.history.replaceState({}, '', '/');
      currentRoute = { name: 'home' };
    } else if (replaceHistory) {
      const nextPath = route.name === 'level' ? getLevelRoute(route.levelId) : '/';
      if (window.location.pathname !== nextPath) {
        window.history.replaceState({}, '', nextPath);
      }
    }

    if (currentRoute.name === 'level') {
      setHomeModalOpen(false);
      document.body.classList.remove('modal-open');
      const level = getLevelById(currentRoute.levelId);
      pageContent.innerHTML = renderLevelPage(level, currentViewMode);
      if (level.id === 2) {
        setupLevel2Runner();
      }
      updateSidebar(level.id);
      updateHeader(currentRoute);
      syncViewModeUI();
      initSim(level, autoStartLevel);
    } else {
      pageContent.innerHTML = renderHomePage({ viewMode: currentViewMode });
      updateSidebar(null);
      updateHeader(currentRoute);
      syncViewModeUI();
      setHomeModalOpen(false);
      document.body.classList.remove('modal-open');
    }

    closeSidebar();
  }

  function navigateToPath(path, options = {}) {
    const route = parseRoute(path);
    const normalizedPath = route.name === 'level' ? getLevelRoute(route.levelId) : '/';

    if (!options.skipHistory && window.location.pathname !== normalizedPath) {
      window.history.pushState({}, '', normalizedPath);
    }

    renderRoute(route, { replaceHistory: options.replaceHistory, autoStartLevel: options.autoStartLevel });
  }

  function applyViewMode(mode) {
    if (mode !== '2d' && mode !== '3d') return;

    setStoredViewMode(mode);
    syncViewModeUI();
    updateHeader(currentRoute ?? { name: 'home' });
    syncMobileHudForViewport();
    syncLiveFeedForViewport();

    if (currentRoute?.name === 'level') {
      const level = getLevelById(currentRoute.levelId);
      mountRenderer(level);
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  document.addEventListener('click', event => {
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) {
      event.preventDefault();
      navigateToPath(routeButton.dataset.route);
      return;
    }

    const sidebarItem = event.target.closest('.sidebar__item[data-level]');
    if (sidebarItem) {
      event.preventDefault();
      navigateToPath(getLevelRoute(Number.parseInt(sidebarItem.dataset.level, 10)));
      return;
    }

    const viewOption = event.target.closest('[data-view-mode-option]');
    if (viewOption) {
      event.preventDefault();
      applyViewMode(viewOption.dataset.viewModeOption);
      return;
    }

    const viewSwitch = event.target.closest('[data-view-mode-switch]');
    if (viewSwitch) {
      event.preventDefault();
      applyViewMode(viewSwitch.dataset.viewModeSwitch);
      return;
    }

    const openModalButton = event.target.closest('[data-home-modal-open]');
    if (openModalButton) {
      event.preventDefault();
      setHomeModalOpen(true);
      return;
    }

    const closeModalButton = event.target.closest('[data-home-modal-close]');
    if (closeModalButton) {
      event.preventDefault();
      setHomeModalOpen(false);
    }
  });

  document.addEventListener('keydown', event => {
    const routeCard = event.target.closest('.home-level-card[data-route]');
    if (!routeCard) return;

    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    navigateToPath(routeCard.dataset.route);
  });

  window.addEventListener('resize', () => {
    syncMobileHudForViewport();
    syncLiveFeedForViewport();
  });
  window.addEventListener('popstate', () => {
    renderRoute(parseRoute(window.location.pathname), { autoStartLevel: true });
  });

  const initialRoute = parseRoute(window.location.pathname);
  const shouldNormalize = Boolean(initialRoute.invalidPath);
  if (shouldNormalize) {
    window.history.replaceState({}, '', '/');
  }
  renderRoute(shouldNormalize ? { name: 'home' } : initialRoute, { replaceHistory: false, autoStartLevel: true });
});
