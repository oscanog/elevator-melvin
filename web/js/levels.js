/* ========================================
   Level Definitions & Renderers v4
   — Full-height building, right-side panels
   ======================================== */

export const LEVELS = [
  {
    id: 1, title: 'Level 1 — Foundation', icon: '🏗️',
    badge: 'Foundation', badgeClass: 'badge--info', status: 'done',
    description: 'Build Elevator & Person classes. Pick up a person and drop them off on a single requested floor.',
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
    id: 2, title: 'Level 2 — Test Suite', icon: '🧪',
    badge: 'Testing', badgeClass: 'badge--warning', status: 'locked',
    description: 'Create tests for person going up and down. Assert stops and floors traversed.',
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
    id: 3, title: 'Level 3 — Tracking', icon: '📊',
    badge: 'Analytics', badgeClass: 'badge--info', status: 'locked',
    description: 'Track total floors traversed and total stops to measure elevator efficiency.',
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
    id: 4, title: 'Level 4 — Multi-Rider', icon: '👥',
    badge: 'Multi-Request', badgeClass: 'badge--warning', status: 'locked',
    description: 'Handle multiple people requesting different floors, served in order.',
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
    id: 5, title: 'Level 5 — Scenarios', icon: '🔀',
    badge: 'Combinatorics', badgeClass: 'badge--info', status: 'locked',
    description: 'Test all combinations of two people going up/down.',
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
    id: 6, title: 'Level 6 — Time Logic', icon: '🕐',
    badge: 'Time-Based', badgeClass: 'badge--warning', status: 'locked',
    description: 'Return to lobby before noon; stay at last floor after noon.',
    requirements: [
      'Have the elevator return to floor 0 (lobby) if there are no current riders in the elevator and the current time is before 12:00 p.m.',
      'Have the elevator stay on current floor of last drop off if there are no current riders in the elevator and the current time is after 12:00 p.m.',
    ],
    testPersons: [
      { name: 'Tina', pickup: 4, dropoff: 1 },
    ],
  },
  {
    id: 7, title: 'Level 7 — Optimization', icon: '⚡',
    badge: 'Algorithm', badgeClass: 'badge--success', status: 'locked',
    description: 'More efficient pickup/dropoff algorithm with fewer total floors traversed.',
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
    id: 8, title: 'Level 8 — DOM Viz', icon: '🖥️',
    badge: 'Visualization', badgeClass: 'badge--info', status: 'locked',
    description: 'Create a DOM representation to visualize the elevator process.',
    requirements: [
      'Create a DOM representation of the elevator and people to visualize the elevator process',
    ],
    testPersons: [
      { name: 'Max', pickup: 0, dropoff: 5 },
      { name: 'Eva', pickup: 3, dropoff: 8 },
    ],
  },
  {
    id: 9, title: 'Level 9 — API Backend', icon: '🌐',
    badge: 'Full-Stack', badgeClass: 'badge--success', status: 'locked',
    description: 'Replace client-side arrays with API calls to a Node/Express backend.',
    requirements: [
      'Replace all insertions and deletions of requests and current riders with API calls to a Node/Express backend with the correct CRUD methods.',
    ],
    testPersons: [
      { name: 'Dev', pickup: 2, dropoff: 9 },
    ],
  },
];

function renderConstructionView(lvl) {
  // Level 2 focuses on Floor 2, Level 3 on Floor 3, etc.
  const targetFloor = lvl.id; 
  // Position workers on the correct floor — aligned with the building's
  // left-side verandas (balconies) where passengers wait.
  // The 3D building's balconys are shifted left and align with these approx SVG coordinates:
  // We fine-tune the base Y and step size to match the isometric projection of the balconies.
  const workerBaseY = 465;
  const floorStep = 37.5;
  const workerY = workerBaseY - (targetFloor * floorStep);
  // Balconies are physically on the left side of the 3D building
  const workerBaseX = 145; 
  
  // Real hard hat SVG path: 
  // A dome for the head and a rounded brim at the bottom
  const renderHat = (color) => `
    <!-- Hat Brim -->
    <rect x="-11" y="-3" width="22" height="3" rx="1.5" fill="${color}" />
    <!-- Hat Dome -->
    <path d="M-8,-2 A8,8 0 0,1 8,-2 Z" fill="${color}" />
    <!-- Top ridge (optional detail) -->
    <rect x="-2" y="-10" width="4" height="2" rx="1" fill="#fff" opacity="0.4" />
  `;

  return `
    <div class="construction-overlay">
      <svg class="construction-svg" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">

        <!-- Carpenter Workers on Floor ${targetFloor} veranda -->
        <g transform="translate(${workerBaseX}, ${workerY})">
             <!-- Worker 1 (Carpenter with hammer) - scaled 50% -->
             <g transform="translate(-15, 0) scale(0.5)">
               <!-- Head (skin) -->
               <circle cx="0" cy="0" r="7" fill="#fcd5b0" />
               <!-- Hard hat -->
               ${renderHat('#ef4444')}
               <!-- Eyes -->
               <circle cx="-3" cy="1" r="1.5" fill="#333" />
               <circle cx="3" cy="1" r="1.5" fill="#333" />
               <!-- Body (work shirt) -->
               <rect x="-5" y="7" width="10" height="16" fill="#3b82f6" rx="2" />
               <!-- Left arm (holding hammer) -->
               <g transform="translate(5, 9)">
                 <rect x="0" y="0" width="4" height="10" fill="#fcd5b0" rx="1" transform="rotate(-20)" />
                 <!-- Hammer in hand -->
                 <g class="anim-hammer" transform="translate(6, 8)" style="transform-origin: 0px 0px;">
                   <rect x="-1" y="-12" width="3" height="14" fill="#8B6914" rx="1" />
                   <rect x="-4" y="-16" width="10" height="5" fill="#555" rx="1" />
                 </g>
               </g>
               <!-- Right arm (resting at side) -->
               <rect x="-9" y="9" width="4" height="9" fill="#fcd5b0" rx="1" transform="rotate(10, -9, 9)" />
               <!-- Legs (work pants) -->
               <rect x="-4" y="23" width="4" height="12" fill="#1e3a5f" rx="1" />
               <rect x="1" y="23" width="4" height="12" fill="#1e3a5f" rx="1" />
               <!-- Boots -->
               <rect x="-5" y="34" width="5" height="4" rx="1" fill="#333" />
               <rect x="1" y="34" width="5" height="4" rx="1" fill="#333" />
             </g>

             <!-- Worker 2 (Carpenter with hammer, slightly offset in X and Z-depth) -->
             <g transform="translate(15, -10) scale(0.5)">
               <!-- Head (skin) -->
               <circle cx="0" cy="0" r="7" fill="#deb887" />
               <!-- Hard hat -->
               ${renderHat('#fbbf24')}
               <!-- Eyes -->
               <circle cx="-3" cy="1" r="1.5" fill="#333" />
               <circle cx="3" cy="1" r="1.5" fill="#333" />
               <!-- Body (work vest) -->
               <rect x="-5" y="7" width="10" height="16" fill="#10b981" rx="2" />
               <!-- Right arm (holding hammer) -->
               <g transform="translate(-5, 9)">
                 <rect x="-4" y="0" width="4" height="10" fill="#deb887" rx="1" transform="rotate(20, -4, 0)" />
                 <g class="anim-hammer" transform="translate(-8, 8)" style="animation-delay: 0.3s; transform-origin: 0px 0px;">
                   <rect x="-2" y="-12" width="3" height="14" fill="#8B6914" rx="1" />
                   <rect x="-5" y="-16" width="10" height="5" fill="#555" rx="1" />
                 </g>
               </g>
               <!-- Left arm (resting) -->
               <rect x="5" y="9" width="4" height="9" fill="#deb887" rx="1" transform="rotate(-10, 5, 9)" />
               <!-- Legs (work pants) -->
               <rect x="-4" y="23" width="4" height="12" fill="#1e3a5f" rx="1" />
               <rect x="1" y="23" width="4" height="12" fill="#1e3a5f" rx="1" />
               <!-- Boots -->
               <rect x="-5" y="34" width="5" height="4" rx="1" fill="#333" />
               <rect x="1" y="34" width="5" height="4" rx="1" fill="#333" />
             </g>
        </g>
        
        <!-- Target Floor Sign at Top Left -->
        <g transform="translate(60, 30)">
          <rect x="-40" y="-12" width="80" height="24" rx="12" fill="#000" fill-opacity="0.8" stroke="#fbbf24" stroke-width="1.5" />
          <text x="0" y="5" text-anchor="middle" fill="#fbbf24" style="font-family:monospace; font-weight:bold; font-size:12px;">Floor ${targetFloor}</text>
        </g>
      </svg>
    </div>
  `;
}

export function renderLevelPage(levelId) {
  const lvl = LEVELS[levelId - 1];
  const isLocked = lvl.status === 'locked';
  const isDone = lvl.status === 'done';

  const leftColumnContent = isLocked 
    ? `<div class="sim-canvas-wrap" id="sim-canvas-container"></div>
       ${renderConstructionView(lvl)}`
    : `<div class="sim-canvas-wrap" id="sim-canvas-container"></div>
       <!-- Left Overlays (Floor & People) -->
       <div style="position:absolute; top:12px; left:12px; z-index:10; display:flex; flex-direction:column; gap:12px;">
         <div class="floor-display-digital" style="width: 100%; box-sizing: border-box; justify-content: space-between;">
           <span class="floor-display-digital__label">Floor</span>
           <span class="floor-display-digital__num" id="sim-floor-num">0</span>
           <span class="floor-display-digital__dir floor-display-digital__dir--idle" id="sim-dir">▲</span>
         </div>
         <div class="floor-display-digital floor-display-digital--roster">
           <div class="roster-header">
             <span class="roster-header__title">👤 People</span>
             <span class="roster-header__count" id="sim-roster-count">0 / ${lvl.testPersons.length}</span>
           </div>
           <div class="person-roster" id="sim-roster">
             <span class="roster-placeholder">Simulation starting…</span>
           </div>
         </div>
       </div>
       <!-- Live Feed Overlay (Top Right) -->
       <button class="live-feed-toggle" id="sim-feed-toggle" style="position:absolute; top:12px; right:12px; z-index:11;">
         📡 Live Feed
       </button>
       <div class="live-feed-overlay" id="sim-feed-overlay">
         <div class="live-feed-overlay__header">
           <span class="live-feed-overlay__title">📡 Live Feed</span>
           <button class="live-feed-overlay__close" id="sim-feed-close">✖</button>
         </div>
         <div class="live-feed live-feed--overlay" id="sim-log">
           <div class="live-feed__entry"><span>Waiting for simulation…</span></div>
         </div>
       </div>`;

  const rightColumnContent = isLocked
    ? `<div class="construction-card">
         <div class="construction-card__header">
           <span>🏗️ Construction in Progress</span>
         </div>
         <div class="construction-progress">
           <div class="construction-progress__bar" style="width: ${30 + (lvl.id * 5)}%;"></div>
         </div>
         <div class="construction-status">
            Engineering is currently working on the ${lvl.badge} logic for Floor ${lvl.id}.
            Unlock by completing previous levels!
         </div>
       </div>
       <div class="card sim-card-compact" style="margin-top: 20px;">
         <div class="card__header" style="margin-bottom:var(--space-2);">
           <span style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);">📋 Requirements</span>
           <span class="badge ${lvl.badgeClass}" style="font-size:10px;">Level ${lvl.id}</span>
         </div>
         <div class="req-list">
           ${lvl.requirements.map(r => `
             <div class="req-item req-item--pending">
               <span class="req-check">○</span>
               <span>${r}</span>
             </div>
           `).join('')}
         </div>
       </div>`
    : `<!-- Controls Bar -->
        <div class="sim-controls" id="sim-controls">
          <div class="sim-actions-row" style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
            <div class="sim-actions" style="display:flex; gap:12px; width:100%;">
              <button class="sim-action-btn sim-action-btn--stop" id="sim-play-stop-btn" style="flex:1;">
                <span class="sim-action-btn__icon">⏹</span>
                <span class="sim-action-btn__label">Stop</span>
              </button>
              <button class="sim-action-btn sim-action-btn--reset" id="sim-reset-btn" style="flex:1;">
                <span class="sim-action-btn__icon">↻</span>
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
            <button class="step-btn" id="sim-step-back" title="Previous Step">◀ Back</button>
            <div class="sim-controls__status" style="flex:1; justify-content:center; padding: 4px 0;">
              <div class="status-dot status-dot--idle" id="sim-status-dot"></div>
              <span id="sim-status-text">Ready</span>
            </div>
            <button class="step-btn" id="sim-step-next" title="Next Step">Next ▶</button>
          </div>
       </div>
       <!-- Stats -->
       <div class="sim-stats-row" id="sim-stats">
         <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-floor">0</div><div class="sim-stat-box__label">Floor</div></div>
         <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-stops">0</div><div class="sim-stat-box__label">Stops</div></div>
         <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-traversed">0</div><div class="sim-stat-box__label">Traversed</div></div>
         <div class="sim-stat-box"><div class="sim-stat-box__val" id="stat-riders">0</div><div class="sim-stat-box__label">Riders</div></div>
       </div>
       <!-- Requirements -->
       <div class="card sim-card-compact">
         <div class="card__header" style="margin-bottom:var(--space-2);">
           <span style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);">📋 Requirements</span>
           <span class="badge ${lvl.badgeClass}" style="font-size:10px;">Level ${lvl.id}</span>
         </div>
         <div class="req-list">
           ${lvl.requirements.map(r => `
             <div class="req-item ${isDone ? 'req-item--done' : 'req-item--pending'}">
               <span class="req-check">${isDone ? '✓' : '○'}</span>
               <span>${r}</span>
             </div>
           `).join('')}
         </div>
       </div>`;

  return `
    <div class="level-page fade-in-up">
      <!-- Title Row -->
      <div class="level-page__header">
        <div>
          <h1 class="level-page__title">${lvl.title}</h1>
          <p class="level-page__desc">${lvl.description}</p>
        </div>
      </div>

      <!-- Full-height sim layout: Building (left) + Panels (right) -->
      <div class="sim-fullscreen-layout">
        <!-- LEFT: 3D Building Canvas -->
        <div class="sim-building-col">
          ${leftColumnContent}
        </div>

        <!-- RIGHT: All info panels -->
        <div class="sim-info-col">
          ${rightColumnContent}
        </div>
      </div>
    </div>
  `;
}
