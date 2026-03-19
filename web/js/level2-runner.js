import {
  LEVEL2_REQUIREMENTS,
  LEVEL2_SCENARIOS,
  LEVEL2_TEST_CASES,
  runLevel2Suite,
} from '../../level2-suite.ts';
import Elevator from '../../elevator.ts';
import Person from '../../person.ts';

const TERMINAL_STREAM_DELAY_MS = 72;
const TERMINAL_STREAM_EMPHASIS_DELAY_MS = 168;
let activeTerminalStreamToken = 0;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderScenarioSummary() {
  return LEVEL2_SCENARIOS.map(scenario => `
    <article class="level2-runner__matrix-item">
      <div class="level2-runner__matrix-head">
        <span class="badge badge--info">Scenario</span>
        <span class="level2-runner__matrix-status" data-level2-scenario="${scenario.title}">Pending</span>
      </div>
      <strong class="level2-runner__matrix-title">${scenario.title}</strong>
      <div class="level2-runner__matrix-copy">
        ${scenario.person.name}: Floor ${scenario.person.currentFloor} -> Floor ${scenario.person.dropOffFloor}
      </div>
      <div class="level2-runner__matrix-copy">
        Expect ${scenario.expected.stops} stops and ${scenario.expected.floorsTraversed} floors traversed.
      </div>
    </article>
  `).join('');
}

function renderRequirementSummary() {
  return LEVEL2_REQUIREMENTS.map(requirement => `
    <div class="req-item req-item--pending" data-level2-requirement="${requirement.key}">
      <span class="req-check">O</span>
      <span>${requirement.label}</span>
    </div>
  `).join('');
}

function renderTerminal(lines, options = {}) {
  const {
    emptyMessage = 'Click Run tests to execute the Level 2 suite.',
    isStreaming = false,
  } = options;

  if (!lines.length) {
    return `
      <div class="level2-runner__terminal">
        <div class="level2-runner__terminal-bar">
          <span class="level2-runner__terminal-dot"></span>
          <span class="level2-runner__terminal-dot"></span>
          <span class="level2-runner__terminal-dot"></span>
          <span class="level2-runner__terminal-title">runner@level2</span>
        </div>
        <div class="level2-runner__terminal-screen level2-runner__terminal-screen--empty ${isStreaming ? 'is-streaming' : ''}" id="level2-terminal-screen">
          <div class="level2-runner__terminal-line">
            <span class="level2-runner__terminal-prefix">PS</span>
            <span class="level2-runner__terminal-text">${escapeHtml(emptyMessage)}</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="level2-runner__terminal">
      <div class="level2-runner__terminal-bar">
        <span class="level2-runner__terminal-dot"></span>
        <span class="level2-runner__terminal-dot"></span>
        <span class="level2-runner__terminal-dot"></span>
        <span class="level2-runner__terminal-title">runner@level2</span>
      </div>
      <div class="level2-runner__terminal-screen ${isStreaming ? 'is-streaming' : ''}" id="level2-terminal-screen">
        ${lines.map(line => `
          <div class="level2-runner__terminal-line level2-runner__terminal-line--${line.type}">
            <span class="level2-runner__terminal-prefix">${escapeHtml(line.prefix)}</span>
            <span class="level2-runner__terminal-text">${escapeHtml(line.text)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function createTerminalLineElement(line) {
  const row = document.createElement('div');
  row.className = `level2-runner__terminal-line level2-runner__terminal-line--${line.type}`;

  const prefix = document.createElement('span');
  prefix.className = 'level2-runner__terminal-prefix';
  prefix.textContent = line.prefix;

  const text = document.createElement('span');
  text.className = 'level2-runner__terminal-text';
  text.textContent = line.text;

  row.append(prefix, text);
  return row;
}

function buildTerminalLines(results) {
  const summary = {
    passed: results.filter(result => result.pass).length,
    failed: results.filter(result => !result.pass).length,
    total: results.length,
  };

  const lines = [
    {
      type: 'muted',
      prefix: 'PS',
      text: 'npm run level2-suite --worker=1',
    },
    {
      type: 'muted',
      prefix: 'SYS',
      text: `Booting Level 2 runner for ${summary.total} tests...`,
    },
  ];

  for (const result of results) {
    lines.push({
      type: 'separator',
      prefix: '---',
      text: `${result.category} | ${result.title}`,
    });

    if (!result.logs.length) {
      lines.push({
        type: 'muted',
        prefix: 'LOG',
        text: 'No console output captured.',
      });
    } else {
      for (const entry of result.logs) {
        lines.push({
          type: entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'muted',
          prefix: entry.level.toUpperCase(),
          text: entry.text,
        });
      }
    }

    if (result.error) {
      lines.push({
        type: 'error',
        prefix: 'ERR',
        text: result.error,
      });
    }

    lines.push({
      type: 'separator',
      prefix: '---',
      text: `coverage | ${result.coveredMethods.join(', ')}`,
    });
    lines.push({
      type: result.pass ? 'pass' : 'fail',
      prefix: result.pass ? 'PASS' : 'FAIL',
      text: `${result.title} (${result.durationMs} ms)`,
    });
  }

  lines.push({
    type: summary.failed === 0 ? 'pass' : 'fail',
    prefix: 'DONE',
    text: `Level 2 suite finished: ${summary.passed}/${summary.total} passing, ${summary.failed} failing`,
  });

  return lines;
}

function getStreamDelay(line) {
  const isEmphasisLine = line.type === 'pass'
    || line.type === 'fail'
    || line.type === 'error'
    || line.type === 'separator';
  const baseDelay = isEmphasisLine ? TERMINAL_STREAM_EMPHASIS_DELAY_MS : TERMINAL_STREAM_DELAY_MS;
  const textDelay = Math.min(48, Math.floor(line.text.length / 18) * 8);
  return baseDelay + textDelay;
}

function wait(ms) {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
}

function updateCounts(summary) {
  const totalNode = document.getElementById('level2-total-count');
  const passNode = document.getElementById('level2-pass-count');
  const failNode = document.getElementById('level2-fail-count');
  const statusNode = document.getElementById('level2-runner-status');

  if (totalNode) totalNode.textContent = String(summary.total);
  if (passNode) passNode.textContent = String(summary.passed);
  if (failNode) failNode.textContent = String(summary.failed);

  if (statusNode) {
    statusNode.textContent = summary.failed === 0
      ? `All ${summary.total} tests are passing.`
      : `${summary.failed} test${summary.failed === 1 ? '' : 's'} need attention.`;
    statusNode.className = `level2-runner__status-copy ${summary.failed === 0 ? 'is-pass' : 'is-fail'}`;
  }
}

function updateCoverage(result) {
  result.scenarios.forEach(scenario => {
    const node = document.querySelector(`[data-level2-scenario="${scenario.name}"]`);
    if (!node) return;

    node.textContent = scenario.pass ? 'Passing' : 'Failing';
    node.classList.toggle('is-pass', scenario.pass);
    node.classList.toggle('is-fail', !scenario.pass);
  });

  result.methods.forEach(method => {
    const node = document.querySelector(`[data-level2-method="${method.name}"]`);
    if (!node) return;

    const state = node.querySelector('.level2-runner__method-state');
    node.classList.toggle('is-pass', method.pass);
    node.classList.toggle('is-fail', !method.pass);
    if (state) {
      state.textContent = method.pass ? 'Passing' : 'Failing';
    }
  });
}

function updateRequirements(requirements) {
  LEVEL2_REQUIREMENTS.forEach(requirement => {
    const node = document.querySelector(`[data-level2-requirement="${requirement.key}"]`);
    if (!node) return;

    const pass = requirements[requirement.key];
    const check = node.querySelector('.req-check');

    node.classList.toggle('req-item--done', pass);
    node.classList.toggle('req-item--pending', !pass);
    if (check) {
      check.textContent = pass ? 'OK' : 'O';
    }
  });
}

function updateResults(lines, options = {}) {
  const resultsNode = document.getElementById('level2-results-log');
  if (!resultsNode) return;

  resultsNode.innerHTML = renderTerminal(lines, options);

  const terminalScreen = document.getElementById('level2-terminal-screen');
  if (terminalScreen) {
    terminalScreen.scrollTop = 0;
  }
}

function getTerminalScreen() {
  return document.getElementById('level2-terminal-screen');
}

function setTerminalStreamingState(isStreaming) {
  const terminalScreen = getTerminalScreen();
  if (!terminalScreen) return;

  terminalScreen.classList.toggle('is-streaming', isStreaming);
}

function prependTerminalLine(line) {
  const terminalScreen = getTerminalScreen();
  if (!terminalScreen) return;

  const placeholder = terminalScreen.querySelector('.level2-runner__terminal-line');
  if (terminalScreen.classList.contains('level2-runner__terminal-screen--empty') && placeholder) {
    placeholder.remove();
    terminalScreen.classList.remove('level2-runner__terminal-screen--empty');
  }

  terminalScreen.prepend(createTerminalLineElement(line));
  terminalScreen.scrollTop = 0;
}

function syncResultsOffset() {
  const resultCard = document.getElementById('level2-results-card');
  const lowerStack = document.getElementById('level2-runner-lower-stack');

  if (!resultCard || !lowerStack) return;

  const resultCardBottom = resultCard.getBoundingClientRect().bottom;
  const lowerStackTop = lowerStack.getBoundingClientRect().top;
  const overlap = Math.max(0, Math.ceil(resultCardBottom - lowerStackTop));

  lowerStack.style.setProperty('--level2-results-offset', `${overlap}px`);
}

function queueResultsLayoutSync() {
  window.requestAnimationFrame(() => {
    syncResultsOffset();
  });
}

async function streamTerminalLines(lines) {
  const streamToken = ++activeTerminalStreamToken;

  updateResults([], {
    emptyMessage: 'Running Level 2 suite...',
    isStreaming: true,
  });
  queueResultsLayoutSync();

  setTerminalStreamingState(true);

  for (const line of lines) {
    if (streamToken !== activeTerminalStreamToken) {
      return;
    }

    prependTerminalLine(line);
    queueResultsLayoutSync();
    await wait(getStreamDelay(line));
  }

  if (streamToken !== activeTerminalStreamToken) {
    return;
  }

  setTerminalStreamingState(false);
  queueResultsLayoutSync();
}

function setResultsExpanded(expanded) {
  const card = document.getElementById('level2-results-card');
  const shell = document.getElementById('level2-results-shell');
  const toggle = document.getElementById('level2-results-toggle');
  const label = document.getElementById('level2-results-toggle-label');
  const icon = document.getElementById('level2-results-toggle-icon');

  if (!card || !shell || !toggle || !label || !icon) return;

  card.classList.toggle('is-collapsed', !expanded);
  shell.hidden = !expanded;
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  label.textContent = expanded ? 'Collapse' : 'Open';
  icon.textContent = expanded ? 'v' : '>';

  if (!expanded) {
    const lowerStack = document.getElementById('level2-runner-lower-stack');
    lowerStack?.style.setProperty('--level2-results-offset', '0px');
  }

  queueResultsLayoutSync();
}

function scrollResultsIntoView() {
  const card = document.getElementById('level2-results-card');
  if (!card) return;

  card.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function setButtonState(isRunning) {
  const button = document.getElementById('level2-run-tests-btn');
  if (!button) return;

  button.disabled = isRunning;
  button.textContent = isRunning ? 'Running tests...' : 'Run tests';
}

function setResultsFileState(isRunning) {
  const fileNode = document.getElementById('level2-results-file');
  if (!fileNode) return;

  fileNode.textContent = isRunning ? '>level2-suite.js running...' : 'level2-suite.js';
}

export function renderLevel2RunnerPanel() {
  return `
    <div class="card level2-runner">
      <div class="card__header level2-runner__header">
        <div>
          <span class="level2-runner__eyebrow">Level 2 runner</span>
          <h2 class="level2-runner__title">Built-in test suite</h2>
        </div>
        <span class="badge badge--warning">Read-only</span>
      </div>
      <p class="level2-runner__intro">
        Run the shared Level 2 suite here to verify the two rider scenarios and full Elevator method coverage without leaving the page.
      </p>
      <div class="level2-runner__actions">
        <button class="btn btn--primary" type="button" id="level2-run-tests-btn">Run tests</button>
        <div class="level2-runner__status-copy" id="level2-runner-status">Ready to run the shared suite.</div>
      </div>
      <div class="level2-runner__stats">
        <div class="level2-runner__stat">
          <span class="level2-runner__stat-value" id="level2-total-count">0</span>
          <span class="level2-runner__stat-label">Total</span>
        </div>
        <div class="level2-runner__stat">
          <span class="level2-runner__stat-value" id="level2-pass-count">0</span>
          <span class="level2-runner__stat-label">Passing</span>
        </div>
        <div class="level2-runner__stat">
          <span class="level2-runner__stat-value" id="level2-fail-count">0</span>
          <span class="level2-runner__stat-label">Failing</span>
        </div>
      </div>
    </div>
    <div class="card level2-runner__results-card is-collapsed" id="level2-results-card">
      <div class="card__header level2-runner__results-head" style="margin-bottom:0;">
        <div class="level2-runner__results-head-main">
          <span class="card__title">Terminal</span>
          <span class="level2-runner__results-file" id="level2-results-file">level2-suite.js</span>
        </div>
        <button
          class="level2-runner__collapse-btn"
          id="level2-results-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="level2-results-shell"
        >
          <span class="level2-runner__collapse-icon" id="level2-results-toggle-icon">&gt;</span>
          <span id="level2-results-toggle-label">Open</span>
        </button>
      </div>
      <div class="level2-runner__results-shell" id="level2-results-shell" hidden>
        <div class="level2-runner__results" id="level2-results-log">
          ${renderTerminal([])}
        </div>
      </div>
    </div>
    <div class="level2-runner__lower-stack" id="level2-runner-lower-stack">
      <div class="card level2-runner__matrix">
        <div class="card__header" style="margin-bottom:var(--space-3);">
          <span class="card__title">Scenario matrix</span>
          <span class="badge badge--info">${LEVEL2_SCENARIOS.length} cases</span>
        </div>
        <div class="level2-runner__matrix-grid">
          ${renderScenarioSummary()}
        </div>
      </div>
      <div class="card sim-card-compact">
        <div class="card__header" style="margin-bottom:var(--space-2);">
          <span class="card__title">Requirements</span>
          <span class="badge badge--warning">Level 2</span>
        </div>
        <div class="req-list">
          ${renderRequirementSummary()}
        </div>
      </div>
    </div>
  `;
}

export function setupLevel2Runner() {
  const button = document.getElementById('level2-run-tests-btn');
  const resultsToggle = document.getElementById('level2-results-toggle');
  const resultsShell = document.getElementById('level2-results-shell');
  if (!button || !resultsToggle || !resultsShell) return;

  const totalNode = document.getElementById('level2-total-count');
  if (totalNode) {
    totalNode.textContent = String(LEVEL2_TEST_CASES.length);
  }

  setResultsFileState(false);
  setResultsExpanded(false);
  queueResultsLayoutSync();

  const resultsResizeObserver = new ResizeObserver(() => {
    queueResultsLayoutSync();
  });
  resultsResizeObserver.observe(resultsShell);

  resultsToggle.addEventListener('click', () => {
    const expanded = resultsToggle.getAttribute('aria-expanded') === 'true';
    setResultsExpanded(!expanded);
  });

  button.addEventListener('click', () => {
    setButtonState(true);
    setResultsFileState(true);
    setResultsExpanded(true);
    scrollResultsIntoView();

    window.requestAnimationFrame(async () => {
      const result = runLevel2Suite({ Elevator, Person }, { silent: true });
      const terminalLines = buildTerminalLines(result.results);

      updateCounts(result.summary);
      updateCoverage(result);
      updateRequirements(result.requirements);
      await streamTerminalLines(terminalLines);
      setResultsFileState(false);
      setButtonState(false);
    });
  });
}
