const TERMINAL_STREAM_DELAY_MS = 72;
const TERMINAL_STREAM_EMPHASIS_DELAY_MS = 168;
const activeTerminalStreamTokens = new Map();

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getRunnerElementId(runnerId, suffix) {
  return `${runnerId}-${suffix}`;
}

function getScenarioDataKey(runnerId, title) {
  return `${runnerId}:${title}`;
}

function getRequirementDataKey(runnerId, key) {
  return `${runnerId}:${key}`;
}

function renderScenarioSummary(runnerId, scenarios) {
  return scenarios.map(scenario => `
    <article class="level2-runner__matrix-item">
      <div class="level2-runner__matrix-head">
        <span class="badge badge--info">Scenario</span>
        <span class="level2-runner__matrix-status" data-suite-runner-scenario="${escapeHtml(getScenarioDataKey(runnerId, scenario.title))}">Pending</span>
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

function renderRequirementSummary(runnerId, requirements) {
  return requirements.map(requirement => `
    <div class="req-item req-item--pending" data-suite-runner-requirement="${escapeHtml(getRequirementDataKey(runnerId, requirement.key))}">
      <span class="req-check">O</span>
      <span>${requirement.label}</span>
    </div>
  `).join('');
}

function renderTerminal(runnerId, lines, options = {}) {
  const {
    emptyMessage = 'Click Run tests to execute the suite.',
    isStreaming = false,
  } = options;

  if (!lines.length) {
    return `
      <div class="level2-runner__terminal">
        <div class="level2-runner__terminal-bar">
          <span class="level2-runner__terminal-dot"></span>
          <span class="level2-runner__terminal-dot"></span>
          <span class="level2-runner__terminal-dot"></span>
          <span class="level2-runner__terminal-title">runner@${runnerId}</span>
        </div>
        <div class="level2-runner__terminal-screen level2-runner__terminal-screen--empty ${isStreaming ? 'is-streaming' : ''}" id="${getRunnerElementId(runnerId, 'terminal-screen')}">
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
        <span class="level2-runner__terminal-title">runner@${runnerId}</span>
      </div>
      <div class="level2-runner__terminal-screen ${isStreaming ? 'is-streaming' : ''}" id="${getRunnerElementId(runnerId, 'terminal-screen')}">
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

function buildTerminalLines(results, fileName) {
  const summary = {
    passed: results.filter(result => result.pass).length,
    failed: results.filter(result => !result.pass).length,
    total: results.length,
  };
  const commandName = fileName.replace(/\.js$/, '');
  const lines = [
    {
      type: 'muted',
      prefix: 'PS',
      text: `npm run ${commandName} --worker=1`,
    },
    {
      type: 'muted',
      prefix: 'SYS',
      text: `Booting ${commandName} for ${summary.total} tests...`,
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
    text: `${commandName} finished: ${summary.passed}/${summary.total} passing, ${summary.failed} failing`,
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

function updateCounts(runnerId, summary) {
  const totalNode = document.getElementById(getRunnerElementId(runnerId, 'total-count'));
  const passNode = document.getElementById(getRunnerElementId(runnerId, 'pass-count'));
  const failNode = document.getElementById(getRunnerElementId(runnerId, 'fail-count'));
  const statusNode = document.getElementById(getRunnerElementId(runnerId, 'status'));

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

function updateCoverage(runnerId, result) {
  result.scenarios.forEach(scenario => {
    const node = document.querySelector(`[data-suite-runner-scenario="${getScenarioDataKey(runnerId, scenario.name)}"]`);
    if (!node) return;

    node.textContent = scenario.pass ? 'Passing' : 'Failing';
    node.classList.toggle('is-pass', scenario.pass);
    node.classList.toggle('is-fail', !scenario.pass);
  });
}

function updateRequirements(runnerId, requirements) {
  Object.entries(requirements).forEach(([key, pass]) => {
    const node = document.querySelector(`[data-suite-runner-requirement="${getRequirementDataKey(runnerId, key)}"]`);
    if (!node) return;

    const check = node.querySelector('.req-check');
    node.classList.toggle('req-item--done', pass);
    node.classList.toggle('req-item--pending', !pass);
    if (check) {
      check.textContent = pass ? 'OK' : 'O';
    }
  });
}

function updateResults(runnerId, lines, options = {}) {
  const resultsNode = document.getElementById(getRunnerElementId(runnerId, 'results-log'));
  if (!resultsNode) return;

  resultsNode.innerHTML = renderTerminal(runnerId, lines, options);

  const terminalScreen = document.getElementById(getRunnerElementId(runnerId, 'terminal-screen'));
  if (terminalScreen) {
    terminalScreen.scrollTop = 0;
  }
}

function getTerminalScreen(runnerId) {
  return document.getElementById(getRunnerElementId(runnerId, 'terminal-screen'));
}

function setTerminalStreamingState(runnerId, isStreaming) {
  const terminalScreen = getTerminalScreen(runnerId);
  if (!terminalScreen) return;

  terminalScreen.classList.toggle('is-streaming', isStreaming);
}

function prependTerminalLine(runnerId, line) {
  const terminalScreen = getTerminalScreen(runnerId);
  if (!terminalScreen) return;

  const placeholder = terminalScreen.querySelector('.level2-runner__terminal-line');
  if (terminalScreen.classList.contains('level2-runner__terminal-screen--empty') && placeholder) {
    placeholder.remove();
    terminalScreen.classList.remove('level2-runner__terminal-screen--empty');
  }

  terminalScreen.prepend(createTerminalLineElement(line));
  terminalScreen.scrollTop = 0;
}

function syncResultsOffset(runnerId) {
  const resultCard = document.getElementById(getRunnerElementId(runnerId, 'results-card'));
  const lowerStack = document.getElementById(getRunnerElementId(runnerId, 'lower-stack'));

  if (!resultCard || !lowerStack) return;

  const resultCardBottom = resultCard.getBoundingClientRect().bottom;
  const lowerStackTop = lowerStack.getBoundingClientRect().top;
  const overlap = Math.max(0, Math.ceil(resultCardBottom - lowerStackTop));

  lowerStack.style.setProperty('--level2-results-offset', `${overlap}px`);
}

function queueResultsLayoutSync(runnerId) {
  window.requestAnimationFrame(() => {
    syncResultsOffset(runnerId);
  });
}

async function streamTerminalLines(runnerId, lines) {
  const streamToken = (activeTerminalStreamTokens.get(runnerId) ?? 0) + 1;
  activeTerminalStreamTokens.set(runnerId, streamToken);

  updateResults(runnerId, [], {
    emptyMessage: 'Running suite...',
    isStreaming: true,
  });
  queueResultsLayoutSync(runnerId);
  setTerminalStreamingState(runnerId, true);

  for (const line of lines) {
    if (streamToken !== activeTerminalStreamTokens.get(runnerId)) {
      return;
    }

    prependTerminalLine(runnerId, line);
    queueResultsLayoutSync(runnerId);
    await wait(getStreamDelay(line));
  }

  if (streamToken !== activeTerminalStreamTokens.get(runnerId)) {
    return;
  }

  setTerminalStreamingState(runnerId, false);
  queueResultsLayoutSync(runnerId);
}

function setResultsExpanded(runnerId, expanded) {
  const card = document.getElementById(getRunnerElementId(runnerId, 'results-card'));
  const shell = document.getElementById(getRunnerElementId(runnerId, 'results-shell'));
  const toggle = document.getElementById(getRunnerElementId(runnerId, 'results-toggle'));
  const label = document.getElementById(getRunnerElementId(runnerId, 'results-toggle-label'));
  const icon = document.getElementById(getRunnerElementId(runnerId, 'results-toggle-icon'));

  if (!card || !shell || !toggle || !label || !icon) return;

  card.classList.toggle('is-collapsed', !expanded);
  shell.hidden = !expanded;
  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  label.textContent = expanded ? 'Collapse' : 'Open';
  icon.textContent = expanded ? 'v' : '>';

  if (!expanded) {
    const lowerStack = document.getElementById(getRunnerElementId(runnerId, 'lower-stack'));
    lowerStack?.style.setProperty('--level2-results-offset', '0px');
  }

  queueResultsLayoutSync(runnerId);
}

function scrollResultsIntoView(runnerId) {
  const card = document.getElementById(getRunnerElementId(runnerId, 'results-card'));
  if (!card) return;

  card.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function setButtonState(runnerId, isRunning) {
  const button = document.getElementById(getRunnerElementId(runnerId, 'run-tests-btn'));
  if (!button) return;

  button.disabled = isRunning;
  button.textContent = isRunning ? 'Running tests...' : 'Run tests';
}

function setResultsFileState(runnerId, fileName, isRunning) {
  const fileNode = document.getElementById(getRunnerElementId(runnerId, 'results-file'));
  if (!fileNode) return;

  fileNode.textContent = isRunning ? `>${fileName} running...` : fileName;
}

export function renderSuiteRunnerPanel(config) {
  const {
    runnerId,
    eyebrow,
    title,
    intro,
    fileName,
    levelBadgeLabel,
    requirements,
    scenarios,
    testCases,
  } = config;

  return `
    <div class="card level2-runner">
      <div class="card__header level2-runner__header">
        <div>
          <span class="level2-runner__eyebrow">${eyebrow}</span>
          <h2 class="level2-runner__title">${title}</h2>
        </div>
        <span class="badge badge--warning">Read-only</span>
      </div>
      <p class="level2-runner__intro">${intro}</p>
      <div class="level2-runner__actions">
        <button class="btn btn--primary" type="button" id="${getRunnerElementId(runnerId, 'run-tests-btn')}">Run tests</button>
        <div class="level2-runner__status-copy" id="${getRunnerElementId(runnerId, 'status')}">Ready to run the shared suite.</div>
      </div>
      <div class="level2-runner__stats">
        <div class="level2-runner__stat">
          <span class="level2-runner__stat-value" id="${getRunnerElementId(runnerId, 'total-count')}">0</span>
          <span class="level2-runner__stat-label">Total</span>
        </div>
        <div class="level2-runner__stat">
          <span class="level2-runner__stat-value" id="${getRunnerElementId(runnerId, 'pass-count')}">0</span>
          <span class="level2-runner__stat-label">Passing</span>
        </div>
        <div class="level2-runner__stat">
          <span class="level2-runner__stat-value" id="${getRunnerElementId(runnerId, 'fail-count')}">0</span>
          <span class="level2-runner__stat-label">Failing</span>
        </div>
      </div>
    </div>
    <div class="card level2-runner__results-card is-collapsed" id="${getRunnerElementId(runnerId, 'results-card')}">
      <div class="card__header level2-runner__results-head" style="margin-bottom:0;">
        <div class="level2-runner__results-head-main">
          <span class="card__title">Terminal</span>
          <span class="level2-runner__results-file" id="${getRunnerElementId(runnerId, 'results-file')}">${fileName}</span>
        </div>
        <button
          class="level2-runner__collapse-btn"
          id="${getRunnerElementId(runnerId, 'results-toggle')}"
          type="button"
          aria-expanded="false"
          aria-controls="${getRunnerElementId(runnerId, 'results-shell')}"
        >
          <span class="level2-runner__collapse-icon" id="${getRunnerElementId(runnerId, 'results-toggle-icon')}">&gt;</span>
          <span id="${getRunnerElementId(runnerId, 'results-toggle-label')}">Open</span>
        </button>
      </div>
      <div class="level2-runner__results-shell" id="${getRunnerElementId(runnerId, 'results-shell')}" hidden>
        <div class="level2-runner__results" id="${getRunnerElementId(runnerId, 'results-log')}">
          ${renderTerminal(runnerId, [])}
        </div>
      </div>
    </div>
    <div class="level2-runner__lower-stack" id="${getRunnerElementId(runnerId, 'lower-stack')}">
      <div class="card level2-runner__matrix">
        <div class="card__header" style="margin-bottom:var(--space-3);">
          <span class="card__title">Scenario matrix</span>
          <span class="badge badge--info">${scenarios.length} cases</span>
        </div>
        <div class="level2-runner__matrix-grid">
          ${renderScenarioSummary(runnerId, scenarios)}
        </div>
      </div>
      <div class="card sim-card-compact">
        <div class="card__header" style="margin-bottom:var(--space-2);">
          <span class="card__title">Requirements</span>
          <span class="badge badge--warning">${levelBadgeLabel}</span>
        </div>
        <div class="req-list">
          ${renderRequirementSummary(runnerId, requirements)}
        </div>
      </div>
    </div>
  `;
}

export function setupSuiteRunner(config) {
  const {
    runnerId,
    fileName,
    testCases,
    runSuite,
    dependencies,
  } = config;
  const button = document.getElementById(getRunnerElementId(runnerId, 'run-tests-btn'));
  const resultsToggle = document.getElementById(getRunnerElementId(runnerId, 'results-toggle'));
  const resultsShell = document.getElementById(getRunnerElementId(runnerId, 'results-shell'));
  if (!button || !resultsToggle || !resultsShell) return;

  const totalNode = document.getElementById(getRunnerElementId(runnerId, 'total-count'));
  if (totalNode) {
    totalNode.textContent = String(testCases.length);
  }

  setResultsFileState(runnerId, fileName, false);
  setResultsExpanded(runnerId, false);
  queueResultsLayoutSync(runnerId);

  const resultsResizeObserver = new ResizeObserver(() => {
    queueResultsLayoutSync(runnerId);
  });
  resultsResizeObserver.observe(resultsShell);

  resultsToggle.addEventListener('click', () => {
    const expanded = resultsToggle.getAttribute('aria-expanded') === 'true';
    setResultsExpanded(runnerId, !expanded);
  });

  button.addEventListener('click', () => {
    setButtonState(runnerId, true);
    setResultsFileState(runnerId, fileName, true);
    setResultsExpanded(runnerId, true);
    scrollResultsIntoView(runnerId);

    window.requestAnimationFrame(async () => {
      const result = runSuite(dependencies, { silent: true });
      const terminalLines = buildTerminalLines(result.results, fileName);

      updateCounts(runnerId, result.summary);
      updateCoverage(runnerId, result);
      updateRequirements(runnerId, result.requirements);
      await streamTerminalLines(runnerId, terminalLines);
      setResultsFileState(runnerId, fileName, false);
      setButtonState(runnerId, false);
    });
  });
}
