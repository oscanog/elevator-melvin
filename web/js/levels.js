/* ========================================
   Level Definitions, Routes, and Renderers
   ======================================== */

export const VIEW_MODES = [
  {
    id: '3d',
    label: '3D',
    title: 'Three-dimensional building',
    description: 'Keep the current immersive building scene with depth and motion.',
    previewClass: 'home-view-option--three',
  },
  {
    id: '2d',
    label: '2D Front View',
    title: 'Front-facing sketch',
    description: 'Use a clean front view that focuses on floors, cab position, and riders.',
    previewClass: 'home-view-option--two',
  },
];

export const LEVELS = [
  {
    id: 1,
    slug: 'level-1',
    title: 'Level 1 - Foundation',
    icon: 'E1',
    badge: 'Foundation',
    badgeClass: 'badge--info',
    status: 'done',
    statusLabel: 'Done',
    description: 'Build Elevator and Person classes. Pick up a person and drop them off on one requested floor.',
    branchFocus: 'Stabilize the base entities and the single-rider journey.',
    capabilityTags: ['entities', 'single rider', 'baseline run'],
    architectureNotes: [
      'Base domain entities live behind one shared level manifest.',
      'Single-rider flow stays the default simulation path.',
      'Both 3D and 2D views consume the same state snapshot.',
    ],
    requirements: [
      'Build two JavaScript classes - Elevator and Person',
      'Elevator starts on floor 0 (lobby) and tracks current floor',
      'Elevator stores collection of requests and current riders',
      'Person has Name, Current floor, and Drop-off floor',
      'Elevator picks up on current floor and drops off on requested floor',
    ],
    testPersons: [
      { name: 'Brittany', pickup: 2, dropoff: 5 },
    ],
  },
  {
    id: 2,
    slug: 'level-2',
    title: 'Level 2 - Test Suite',
    icon: 'E2',
    badge: 'Testing',
    badgeClass: 'badge--warning',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Create tests for riders going up and down, including stops and floors traversed.',
    branchFocus: 'Introduce a reusable scenario matrix and method-level test coverage.',
    capabilityTags: ['tdd', 'scenario matrix', 'method coverage'],
    architectureNotes: [
      'Scenario data should live beside the level manifest, not inside ad hoc tests.',
      'Every engine method should be testable without UI involvement.',
      'Shared fixtures should support both up and down cases.',
    ],
    requirements: [
      'Person A goes up.',
      'Person A goes down.',
      'Both tests should assert total number of stops and floors the elevator traversed.',
      'There should also be a unit test for every Elevator method.',
    ],
    testPersons: [
      { name: 'Alice', pickup: 2, dropoff: 7 },
    ],
  },
  {
    id: 3,
    slug: 'level-3',
    title: 'Level 3 - Tracking',
    icon: 'E3',
    badge: 'Analytics',
    badgeClass: 'badge--info',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Track total floors traversed and total stops to measure elevator efficiency.',
    branchFocus: 'Promote metrics from UI counters to first-class engine outputs.',
    capabilityTags: ['metrics', 'efficiency', 'observability'],
    architectureNotes: [
      'Stops and floors traversed belong in engine state and test assertions.',
      'Metric reporting should stay renderer-agnostic.',
      'Later optimization work depends on these metrics staying stable.',
    ],
    requirements: [
      'Elevator should keep track of how many total floors it has traversed',
      'Elevator should keep track of how many total stops it has made',
      'Measure elevator efficiency (the less number of floors an elevator traverses, the better)',
    ],
    testPersons: [
      { name: 'Charlie', pickup: 0, dropoff: 8 },
    ],
  },
  {
    id: 4,
    slug: 'level-4',
    title: 'Level 4 - Multi-Rider',
    icon: 'E4',
    badge: 'Multi-Request',
    badgeClass: 'badge--warning',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Handle multiple people requesting different floors and serve them in request order.',
    branchFocus: 'Replace one-off rider handling with a deterministic ordered queue.',
    capabilityTags: ['queueing', 'multi rider', 'ordered service'],
    architectureNotes: [
      'Request ordering should be explicit and testable.',
      'Simulation UI should render multiple riders without layout changes.',
      'This queue model becomes the baseline for later strategy work.',
    ],
    requirements: [
      'Multiple people can request drop off floors',
      'Elevator should pick up and drop off each person in order of the requests',
      'Example: Bob is on floor 3 and requests to go to floor 9. Sue is on floor 6 and requests to go to floor 2. The elevator will pick up Bob, drop him off on floor 9, then pick up Sue and drop her off on floor 2',
    ],
    testPersons: [
      { name: 'Bob', pickup: 3, dropoff: 9 },
      { name: 'Sue', pickup: 6, dropoff: 2 },
    ],
  },
  {
    id: 5,
    slug: 'level-5',
    title: 'Level 5 - Scenarios',
    icon: 'E5',
    badge: 'Combinatorics',
    badgeClass: 'badge--info',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Test all combinations of two people going up and down.',
    branchFocus: 'Expand the scenario catalog instead of adding new page logic.',
    capabilityTags: ['scenario catalog', 'permutations', 'assertions'],
    architectureNotes: [
      'The same queue engine should drive all two-rider permutations.',
      'Scenario fixtures should feed tests and level previews from one source.',
      'Metrics and rider/request counts must be assertable for each case.',
    ],
    requirements: [
      'Person A goes up, Person B goes up.',
      'Person A goes up, Person B goes down.',
      'Person A goes down, Person B goes up.',
      'Person A goes down, Person B goes down.',
      'All four tests should assert total number of stops and floors the elevator traversed.',
      'All four tests should assert the total number of requests and current riders.',
    ],
    testPersons: [
      { name: 'Anna', pickup: 1, dropoff: 6 },
      { name: 'Ben', pickup: 8, dropoff: 3 },
    ],
  },
  {
    id: 6,
    slug: 'level-6',
    title: 'Level 6 - Time Logic',
    icon: 'E6',
    badge: 'Time-Based',
    badgeClass: 'badge--warning',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Return to the lobby before noon and stay at the last floor after noon.',
    branchFocus: 'Inject time as a policy so noon behavior stays testable.',
    capabilityTags: ['clock', 'idle policy', 'business rules'],
    architectureNotes: [
      'Idle behavior should come from a strategy or policy, not hardcoded wall-clock checks.',
      'The engine should accept a test clock to keep scenarios deterministic.',
      'UI state should simply reflect the chosen policy outcome.',
    ],
    requirements: [
      'Have the elevator return to floor 0 (lobby) if there are no current riders in the elevator and the current time is before 12:00 p.m.',
      'Have the elevator stay on current floor of last drop off if there are no current riders in the elevator and the current time is after 12:00 p.m.',
    ],
    testPersons: [
      { name: 'Tina', pickup: 4, dropoff: 1 },
    ],
  },
  {
    id: 7,
    slug: 'level-7',
    title: 'Level 7 - Optimization',
    icon: 'E7',
    badge: 'Algorithm',
    badgeClass: 'badge--success',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Create a more efficient pickup and drop-off algorithm with fewer total floors traversed.',
    branchFocus: 'Compare baseline and optimized dispatch strategies against the same inputs.',
    capabilityTags: ['strategy', 'optimization', 'comparisons'],
    architectureNotes: [
      'Dispatch logic should be swappable without touching renderers.',
      'Scenario matrices from Levels 4 and 5 should validate strategy changes.',
      'Efficiency wins should be measured with the shared metrics model.',
    ],
    requirements: [
      'Create a more efficient algorithm for pickups and drop offs',
      'Test against the same four Level 4 situations',
      'Show for each situation the elevator traversed less total floors',
    ],
    testPersons: [
      { name: 'Zack', pickup: 1, dropoff: 9 },
      { name: 'Lily', pickup: 7, dropoff: 2 },
    ],
  },
  {
    id: 8,
    slug: 'level-8',
    title: 'Level 8 - DOM Visualization',
    icon: 'E8',
    badge: 'Visualization',
    badgeClass: 'badge--info',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Create a DOM representation of the elevator and people to visualize the process.',
    branchFocus: 'Grow the shared renderer system rather than creating one-off visualization code.',
    capabilityTags: ['dom view', 'renderer parity', 'ui state'],
    architectureNotes: [
      'The new 2D front view becomes the base for richer DOM visualization work.',
      'Renderer adapters should stay thin and read from one simulation state source.',
      'View-mode switching should remain a presentation concern only.',
    ],
    requirements: [
      'Create a DOM representation of the elevator and people to visualize the elevator process',
    ],
    testPersons: [
      { name: 'Max', pickup: 0, dropoff: 5 },
      { name: 'Eva', pickup: 3, dropoff: 8 },
    ],
  },
  {
    id: 9,
    slug: 'level-9',
    title: 'Level 9 - API Backend',
    icon: 'E9',
    badge: 'Full-Stack',
    badgeClass: 'badge--success',
    status: 'locked',
    statusLabel: 'Locked',
    description: 'Replace client-side arrays with API calls to a Node/Express backend.',
    branchFocus: 'Swap local storage of requests and riders behind a transport layer.',
    capabilityTags: ['api', 'repository', 'full stack'],
    architectureNotes: [
      'Request and rider persistence should move behind a repository or transport boundary.',
      'The UI and route system should not care whether data is local or remote.',
      'Renderers should keep consuming normalized state snapshots after transport changes.',
    ],
    requirements: [
      'Replace all insertions and deletions of requests and current riders with API calls to a Node/Express backend with the correct CRUD methods.',
    ],
    testPersons: [
      { name: 'Dev', pickup: 2, dropoff: 9 },
    ],
  },
];

function renderViewModeSwitch(viewMode, options = {}) {
  const { compact = false } = options;

  return `
    <div class="sim-view-switch ${compact ? 'sim-view-switch--compact' : ''}" role="group" aria-label="Building view mode">
      ${VIEW_MODES.map(mode => `
        <button
          class="sim-view-switch__btn ${mode.id === viewMode ? 'is-active' : ''}"
          type="button"
          data-view-mode-switch="${mode.id}"
          aria-pressed="${mode.id === viewMode ? 'true' : 'false'}"
        >
          ${mode.label}
        </button>
      `).join('')}
    </div>
  `;
}

function renderConstructionView(level) {
  return `
    <div class="construction-overlay">
      <div class="construction-overlay__panel">
        <span class="construction-overlay__eyebrow">Under Construction</span>
        <strong class="construction-overlay__title">Level ${level.id} is staged for the next branch.</strong>
        <p class="construction-overlay__copy">${level.branchFocus}</p>
        <div class="construction-overlay__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
}

function renderRequirements(level, isDone) {
  return `
    <div class="card sim-card-compact">
      <div class="card__header" style="margin-bottom:var(--space-2);">
        <span style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);">Requirements</span>
        <span class="badge ${level.badgeClass}" style="font-size:10px;">Level ${level.id}</span>
      </div>
      <div class="req-list">
        ${level.requirements.map(requirement => `
          <div class="req-item ${isDone ? 'req-item--done' : 'req-item--pending'}">
            <span class="req-check">${isDone ? 'OK' : 'O'}</span>
            <span>${requirement}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderReadinessCard(level) {
  return `
    <article class="home-level-card card ${level.status === 'done' ? 'home-level-card--done' : ''}">
      <div class="home-level-card__header">
        <div>
          <span class="home-level-card__eyebrow">Level ${level.id}</span>
          <h3 class="home-level-card__title">${level.title}</h3>
        </div>
        <span class="badge ${level.badgeClass}">${level.statusLabel}</span>
      </div>
      <p class="home-level-card__desc">${level.description}</p>
      <p class="home-level-card__focus">${level.branchFocus}</p>
      <div class="home-level-card__tags">
        ${level.capabilityTags.map(tag => `<span class="home-level-card__tag">${tag}</span>`).join('')}
      </div>
      <div class="home-level-card__notes">
        ${level.architectureNotes.map(note => `<div class="home-level-card__note">${note}</div>`).join('')}
      </div>
      <div class="home-level-card__actions">
        <button class="btn btn--secondary btn--sm" type="button" data-route="${getLevelRoute(level.id)}">
          Open Level ${level.id}
        </button>
      </div>
    </article>
  `;
}

function renderHomeViewOptions(viewMode) {
  return VIEW_MODES.map(mode => `
    <button
      class="home-view-option ${mode.previewClass} ${mode.id === viewMode ? 'is-active' : ''}"
      type="button"
      data-view-mode-option="${mode.id}"
      aria-pressed="${mode.id === viewMode ? 'true' : 'false'}"
    >
      <span class="home-view-option__preview" aria-hidden="true">
        <span class="home-view-option__building"></span>
        <span class="home-view-option__floors"></span>
      </span>
      <span class="home-view-option__copy">
        <strong>${mode.title}</strong>
        <span>${mode.description}</span>
      </span>
      <span class="home-view-option__check">${mode.id === viewMode ? 'Selected' : 'Choose'}</span>
    </button>
  `).join('');
}

export function getLevelById(levelId) {
  return LEVELS.find(level => level.id === levelId) ?? null;
}

export function getDefaultLevel() {
  return LEVELS[0];
}

export function getLevelRoute(levelId) {
  return `/level/${levelId}`;
}

export function renderHomePage({ viewMode }) {
  return `
    <div class="home-page home-page--levels fade-in-up">
      <section class="home-roadmap">
        <div class="home-level-grid">
          ${LEVELS.map(renderReadinessCard).join('')}
        </div>
      </section>
    </div>
  `;
}

export function renderLevelPage(level, viewMode) {
  const isLocked = level.status === 'locked';
  const isDone = level.status === 'done';

  const leftColumnContent = `
    <div class="sim-canvas-wrap" id="sim-canvas-container"></div>
    ${!isLocked ? `
      <div class="sim-mobile-hud is-collapsed" id="sim-mobile-hud">
        <button
          class="sim-mobile-hud__toggle"
          id="sim-mobile-hud-toggle"
          type="button"
          aria-controls="sim-mobile-hud-cards"
          aria-expanded="false"
        >
          <span class="sim-mobile-hud__toggle-icon">=</span>
          <span class="sim-mobile-hud__toggle-label">Floor & People</span>
        </button>
        <div class="sim-mobile-hud__cards" id="sim-mobile-hud-cards">
          <div class="floor-display-digital" style="width: 100%; box-sizing: border-box; justify-content: space-between;">
            <span class="floor-display-digital__label">Floor</span>
            <span class="floor-display-digital__num" id="sim-floor-num">0</span>
            <span class="floor-display-digital__dir floor-display-digital__dir--idle" id="sim-dir">^</span>
          </div>
          <div class="floor-display-digital floor-display-digital--roster">
            <div class="roster-header">
              <span class="roster-header__title">People</span>
              <span class="roster-header__count" id="sim-roster-count">0 / ${level.testPersons.length}</span>
            </div>
            <div class="person-roster" id="sim-roster">
              <span class="roster-placeholder">Simulation starting...</span>
            </div>
          </div>
        </div>
      </div>
      <button class="live-feed-toggle" id="sim-feed-toggle" style="position:absolute; top:12px; right:12px; z-index:11;">
        Live Feed
      </button>
      <div class="live-feed-overlay" id="sim-feed-overlay">
        <div class="live-feed-overlay__header">
          <span class="live-feed-overlay__title">Live Feed</span>
          <button class="live-feed-overlay__close" id="sim-feed-close">X</button>
        </div>
        <div class="live-feed live-feed--overlay" id="sim-log">
          <div class="live-feed__entry"><span>Waiting for simulation...</span></div>
        </div>
      </div>
    ` : renderConstructionView(level)}
  `;

  const rightColumnContent = isLocked ? `
      <div class="construction-card">
        <div class="construction-card__header">
          <span>Construction in progress</span>
        </div>
        <div class="construction-progress">
          <div class="construction-progress__bar" style="width: ${30 + (level.id * 5)}%;"></div>
        </div>
        <div class="construction-status">
          Engineering is staging ${level.badge} behavior for Level ${level.id}. The route and architecture are ready for the next branch.
        </div>
      </div>
      ${renderRequirements(level, false)}
    ` : `
      <div class="sim-controls" id="sim-controls">
        <div class="sim-actions-row" style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
            <div class="sim-actions" style="display:flex; gap:12px; width:100%;">
              <button class="sim-action-btn sim-action-btn--stop" id="sim-play-stop-btn" style="flex:1;">
                <span class="sim-action-btn__icon">&#9209;</span>
                <span class="sim-action-btn__label">Stop</span>
              </button>
              <button class="sim-action-btn sim-action-btn--reset" id="sim-reset-btn" style="flex:1;">
                <span class="sim-action-btn__icon">&#8634;</span>
                <span class="sim-action-btn__label">Reset</span>
              </button>
            </div>
          <div class="sim-speed-controls">
            <span style="font-size:11px; font-weight:var(--font-semibold); color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Speed</span>
            <div style="display:flex; gap:4px; margin-left:auto;">
              <button class="speed-btn active" data-speed="1">1x</button>
              <button class="speed-btn" data-speed="2">2x</button>
              <button class="speed-btn" data-speed="3">3x</button>
            </div>
          </div>
        </div>
        <div class="sim-controls__status-row" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:12px;">
          <button class="step-btn" id="sim-step-back" title="Previous Step">< Back</button>
          <div class="sim-controls__status" style="flex:1; justify-content:center; padding: 4px 0;">
            <div class="status-dot status-dot--idle" id="sim-status-dot"></div>
            <span id="sim-status-text">Ready</span>
          </div>
          <button class="step-btn" id="sim-step-next" title="Next Step">Next ></button>
        </div>
      </div>
      <div class="sim-stats-row" id="sim-stats">
        <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-floor">0</div><div class="sim-stat-box__label">Floor</div></div>
        <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-stops">0</div><div class="sim-stat-box__label">Stops</div></div>
        <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-traversed">0</div><div class="sim-stat-box__label">Traversed</div></div>
        <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-riders">0</div><div class="sim-stat-box__label">Riders</div></div>
      </div>
      ${renderRequirements(level, isDone)}
    `;

  return `
    <div class="level-page fade-in-up" data-level-route="${getLevelRoute(level.id)}">
      <div class="level-page__header">
        <div>
          <h1 class="level-page__title">${level.title}</h1>
          <p class="level-page__desc">${level.description}</p>
        </div>
        <div class="level-page__actions">
          ${renderViewModeSwitch(viewMode)}
          <button class="btn btn--secondary btn--sm" type="button" data-route="/">Home</button>
        </div>
      </div>

      <div class="sim-fullscreen-layout">
        <div class="sim-building-col ${viewMode === '2d' ? 'sim-building-col--front-view' : ''}">
          ${leftColumnContent}
        </div>
        <div class="sim-info-col">
          ${rightColumnContent}
        </div>
      </div>
    </div>
  `;
}
