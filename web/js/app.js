/* ========================================
   App v3 — Three.js Integration
   ======================================== */

import { LEVELS, renderLevelPage } from './levels.js';
import { ElevatorSim } from './elevator-sim.js';
import { BuildingScene } from './three-scene.js';
import './theme.js';

document.addEventListener('DOMContentLoaded', () => {
  const pageContent = document.getElementById('page-content');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const headerBadge = document.getElementById('header-badge');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const menuBtn = document.getElementById('menu-btn');

  let currentLevel = 1;
  let currentSpeed = 1;
  let replayTimeout = null;
  let sim = null;
  let sceneRenderer = null;
  let stepHistory = [];
  let currentHistoryIndex = -1;
  let isBrowsingHistory = false;

  const TOTAL_FLOORS = 10;

  function navigateTo(level) {
    destroySim();

    currentLevel = level;
    const lvl = LEVELS[level - 1];

    document.querySelectorAll('.sidebar__item').forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.level) === level);
    });

    breadcrumbCurrent.textContent = `Level ${level}`;
    headerBadge.textContent = `${lvl.icon} ${lvl.badge}`;
    headerBadge.className = `badge ${lvl.badgeClass}`;
    document.title = `${lvl.title} — Elevator Challenge`;

    pageContent.innerHTML = renderLevelPage(level);

    initSim(lvl);

    sidebar.classList.remove('open');
    if(overlay) overlay.classList.remove('active');
  }

  document.querySelectorAll('.sidebar__item[data-level]').forEach(item => {
    item.addEventListener('click', () => navigateTo(parseInt(item.dataset.level)));
  });

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if(overlay) overlay.classList.toggle('active');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  function destroySim() {
    if (replayTimeout) { clearTimeout(replayTimeout); replayTimeout = null; }
    stepHistory = [];
    currentHistoryIndex = -1;
    isBrowsingHistory = false;
    if (sim) {
      sim._running = false;
      sim._paused = false;
      if (sim._pauseResolve) { sim._pauseResolve(); sim._pauseResolve = null; }
      sim.onUpdate = null;
      sim = null;
    }
    if (sceneRenderer) {
      // Need a way to stop render loop if needed, but it's okay, we can just let it GC
      // if we blow away the canvas.
      const container = document.getElementById('sim-canvas-container');
      if(container) container.innerHTML = '';
      sceneRenderer = null;
    }
  }

  function initSim(lvl, autoStart = true) {
    if (lvl.status === 'locked') {
      // For locked levels, only show the 3D building as a background for the construction SVG
      setTimeout(() => {
        sceneRenderer = new BuildingScene('sim-canvas-container', true);
        sceneRenderer.renderLoop();
      }, 100);
      return;
    }

    // 1. Init logic
    sim = new ElevatorSim(TOTAL_FLOORS);
    sim.setSpeed(currentSpeed);

    // 2. Init Three.js scene
    setTimeout(() => {
        sceneRenderer = new BuildingScene('sim-canvas-container', false);
        sceneRenderer.renderLoop();

        // Bind controls
        bindControls(autoStart);

        // 3. Connect callback
        sim.onUpdate = (state) => {
            if (!isBrowsingHistory) {
                stepHistory.push(JSON.parse(JSON.stringify(state)));
                currentHistoryIndex = stepHistory.length - 1;
            }
            renderStateDOM(state);
            if(sceneRenderer) sceneRenderer.updateState(state);
        };

        // Add test persons
        lvl.testPersons.forEach(p => sim.addPerson(p.name, p.pickup, p.dropoff));
        renderStateDOM(sim.getState());

        // Let's go
        if (autoStart) {
          setTimeout(() => { if (sim) sim.run(); }, 600);
        }
    }, 100); // small delay to let DOM mount properly
  }

  function bindControls(autoStart) {
    const playStopBtn = document.getElementById('sim-play-stop-btn');
    const resetBtn = document.getElementById('sim-reset-btn');

    if (playStopBtn) {
      // Set initial button face based on autoStart
      if (autoStart) {
        playStopBtn.dataset.state = 'playing';
        playStopBtn.innerHTML = `
          <span class="sim-action-btn__icon" style="color:var(--color-error);">⏹</span>
          <span class="sim-action-btn__label">Stop</span>
        `;
      } else {
        playStopBtn.dataset.state = 'stopped';
        playStopBtn.innerHTML = `
          <span class="sim-action-btn__icon" style="color:var(--color-success);">▶</span>
          <span class="sim-action-btn__label">Play</span>
        `;
      }

      playStopBtn.addEventListener('click', () => {
        if (!sim) return;
        if (playStopBtn.dataset.state === 'complete') {
          const lvl = LEVELS[currentLevel - 1];
          destroySim();
          pageContent.innerHTML = renderLevelPage(currentLevel);
          initSim(lvl, true);
          return;
        }
        if (playStopBtn.dataset.state === 'playing') {
          const lvl = LEVELS[currentLevel - 1];
          destroySim();
          pageContent.innerHTML = renderLevelPage(currentLevel);
          initSim(lvl, false); // Reload frozen at beginning
        } else {
          sim.stepMode = false;
          sim.run();
          playStopBtn.dataset.state = 'playing';
          playStopBtn.innerHTML = `
            <span class="sim-action-btn__icon" style="color:var(--color-error);">⏹</span>
            <span class="sim-action-btn__label">Stop</span>
          `;
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!sim) return;
        const lvl = LEVELS[currentLevel - 1];
        destroySim();
        pageContent.innerHTML = renderLevelPage(currentLevel);
        initSim(lvl, true); // Reset defaults to auto-starting
      });
    }

    // Speed Controls binding
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseInt(btn.dataset.speed);
        currentSpeed = speed;
        if (sim) sim.setSpeed(speed);
        speedButtons.forEach(b => {
          b.classList.toggle('active', parseInt(b.dataset.speed) === currentSpeed);
          b.style.background = '';
          b.style.color = '';
        });
      });
    });

    // Step Controls Binding
    const backBtn = document.getElementById('sim-step-back');
    const nextBtn = document.getElementById('sim-step-next');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentHistoryIndex > 0) {
          isBrowsingHistory = true;
          if (sim && !sim._paused && sim.state !== 'complete') {
            sim.pause();
          }
          currentHistoryIndex--;
          const histState = stepHistory[currentHistoryIndex];
          renderStateDOM(histState);
          if (sceneRenderer) sceneRenderer.updateState(histState);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentHistoryIndex < stepHistory.length - 1) {
          currentHistoryIndex++;
          const histState = stepHistory[currentHistoryIndex];
          renderStateDOM(histState);
          if (sceneRenderer) sceneRenderer.updateState(histState);
        } else if (sim && sim.state !== 'complete') {
          isBrowsingHistory = false;
          sim.stepMode = true;
          sim.step();
        }
      });
    }

    // Live Feed Toggle Logic
    const feedToggle = document.getElementById('sim-feed-toggle');
    const feedOverlay = document.getElementById('sim-feed-overlay');
    const feedClose = document.getElementById('sim-feed-close');

    if (feedToggle && feedOverlay) {
      feedToggle.addEventListener('click', () => {
        feedOverlay.classList.add('open');
      });
    }
    if (feedClose && feedOverlay) {
      feedClose.addEventListener('click', () => {
        feedOverlay.classList.remove('open');
      });
    }
  }

  function renderStateDOM(state) {
    // Top-left digital floor overlay
    const floorNum = document.getElementById('sim-floor-num');
    const dirEl = document.getElementById('sim-dir');
    if (floorNum) floorNum.textContent = state.currentFloor;
    if (dirEl) {
      dirEl.textContent = '▲';
      dirEl.className = 'floor-display-digital__dir';
      if (state.direction === 'up') dirEl.classList.add('floor-display-digital__dir--up');
      else if (state.direction === 'down') dirEl.classList.add('floor-display-digital__dir--down');
      else dirEl.classList.add('floor-display-digital__dir--idle');
    }

    // Stats
    const sf = document.getElementById('stat-floor');
    const ss = document.getElementById('stat-stops');
    const st = document.getElementById('stat-traversed');
    const sr = document.getElementById('stat-riders');
    if (sf) sf.textContent = state.currentFloor;
    if (ss) ss.textContent = state.stops;
    if (st) st.textContent = state.floorsTraversed;
    if (sr) sr.textContent = state.riders.length;

    // Status dot
    const dot = document.getElementById('sim-status-dot');
    const text = document.getElementById('sim-status-text');
    if (dot && text) {
        dot.className = 'status-dot';
        if (state.state === 'complete') {
          dot.classList.add('status-dot--complete');
          text.textContent = 'Complete';
          
          const playBtn = document.getElementById('sim-play-stop-btn');
          if (playBtn) {
            playBtn.dataset.state = 'complete';
            playBtn.innerHTML = `
              <span class="sim-action-btn__icon" style="color:var(--color-success);">↻</span>
              <span class="sim-action-btn__label">Play again</span>
            `;
          }
          
          // Auto-replay Level 1
          if (currentLevel === 1 && !replayTimeout) {
            replayTimeout = setTimeout(() => {
              if (sim && sim.getState().state === 'complete') {
                destroySim();
                const pageContent = document.getElementById('page-content');
                if (pageContent) pageContent.innerHTML = renderLevelPage(currentLevel);
                const lvl = LEVELS[currentLevel - 1];
                initSim(lvl, true);
              }
              replayTimeout = null;
            }, 2500);
          }
        } else if (state.state === 'paused') {
          dot.classList.add('status-dot--idle');
          text.textContent = 'Paused';
        } else if (state.state === 'doors-open') {
          dot.classList.add('status-dot--doors');
          text.textContent = 'Doors Open — Floor ' + state.currentFloor;
        } else if (state.state === 'moving-up' || state.state === 'moving-down') {
          dot.classList.add('status-dot--moving');
          text.textContent = `Moving ${state.direction} — Floor ${state.currentFloor}`;
        } else {
          dot.classList.add('status-dot--idle');
          text.textContent = 'Idle — Floor ' + state.currentFloor;
        }
    }

    // Roster
    const roster = document.getElementById('sim-roster');
    const rosterCount = document.getElementById('sim-roster-count');
    if (roster) {
        if (state.allPersons.length === 0) {
            roster.innerHTML = '<span style="font-size:var(--text-xs);color:var(--text-muted);">No persons</span>';
            if(rosterCount) rosterCount.textContent = '0 / 0';
        } else {
            let doneCount = 0;
            roster.innerHTML = state.allPersons.map(p => {
              let statusBadge = '';
              if (p.status === 'waiting') statusBadge = '<span class="badge badge--warning">Waiting</span>';
              else if (p.status === 'walking-to-elevator') statusBadge = '<span class="badge badge--warning">Boarding</span>';
              else if (p.status === 'riding') statusBadge = '<span class="badge badge--info">Riding</span>';
              else if (p.status === 'walking-out') statusBadge = '<span class="badge badge--info">Exiting</span>';
              else if (p.status === 'done') {
                statusBadge = '<span class="badge badge--success">Done</span>';
                doneCount++;
              }
              return `
                <div class="person-roster__item">
                  <div class="person-roster__color" style="background:${p.color};"></div>
                  <span class="person-roster__name">${p.name}</span>
                  <span class="person-roster__route">F${p.currentFloor} → F${p.dropOffFloor}</span>
                  <span class="person-roster__status">${statusBadge}</span>
                </div>
              `;
            }).join('');
            
            if(rosterCount) rosterCount.textContent = `${doneCount} / ${state.allPersons.length}`;
        }
    }

    // Log
    const logEl = document.getElementById('sim-log');
    if (logEl) {
        if (!logEl._lastLogs) logEl._lastLogs = [];
        const newLogs = state.log;

        if (newLogs.length === 0) {
            if (logEl._lastLogs.length !== 0) {
                logEl.innerHTML = '<div class="live-feed__entry"><span>Waiting for simulation…</span></div>';
            }
        } else {
            let newItemsCount = 0;
            if (logEl._lastLogs.length === 0) {
                newItemsCount = newLogs.length;
                logEl.innerHTML = ''; // Clear default message
            } else {
                const oldTopStr = logEl._lastLogs[0].time + logEl._lastLogs[0].message;
                for (let i = 0; i < newLogs.length; i++) {
                    if ((newLogs[i].time + newLogs[i].message) === oldTopStr) {
                        break;
                    }
                    newItemsCount++;
                }
            }

            if (newItemsCount > 0) {
                const newHTML = newLogs.slice(0, newItemsCount).map(e => `
                  <div class="live-feed__entry">
                    <span class="live-feed__time">${e.time}</span>
                    <span>${e.message}</span>
                  </div>
                `).join('');
                
                logEl.insertAdjacentHTML('afterbegin', newHTML);

                while (logEl.children.length > 50) {
                    logEl.lastElementChild.remove();
                }
            }
        }
        logEl._lastLogs = newLogs;
    }

    // Update Step Button Disable States
    const backBtn = document.getElementById('sim-step-back');
    const nextBtn = document.getElementById('sim-step-next');
    if (backBtn) backBtn.disabled = currentHistoryIndex <= 0;
    if (nextBtn) {
      if (currentHistoryIndex < stepHistory.length - 1) {
        nextBtn.disabled = false;
      } else {
        nextBtn.disabled = state.state === 'complete';
      }
    }

    // Update Speed Button UI state
    const speedButtons = document.querySelectorAll('.speed-btn');
    if (speedButtons.length > 0) {
      speedButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.speed) === state.speed);
        btn.style.background = '';
        btn.style.color = '';
      });
    }
  }

  // Boot
  navigateTo(1);
});
