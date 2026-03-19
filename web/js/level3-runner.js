import {
  LEVEL3_REQUIREMENTS,
  LEVEL3_SCENARIOS,
  LEVEL3_TEST_CASES,
  runLevel3Suite,
} from '../../level3-suite.ts';
import Elevator from '../../elevator.ts';
import Person from '../../person.ts';
import {
  renderSuiteRunnerPanel,
  setupSuiteRunner,
} from './level-suite-runner.js';

const level3RunnerConfig = {
  runnerId: 'level3',
  eyebrow: 'Level 3 runner',
  title: 'Metrics efficiency suite',
  intro: 'Run the shared Level 3 suite here to verify stops, floors traversed, and efficiency metrics without changing the Level 1 and Level 2 behavior.',
  fileName: 'level3-suite.js',
  levelBadgeLabel: 'Level 3',
  requirements: LEVEL3_REQUIREMENTS,
  scenarios: LEVEL3_SCENARIOS,
  testCases: LEVEL3_TEST_CASES,
  runSuite: runLevel3Suite,
  dependencies: { Elevator, Person },
};

export function renderLevel3RunnerPanel() {
  return renderSuiteRunnerPanel(level3RunnerConfig);
}

export function setupLevel3Runner() {
  setupSuiteRunner(level3RunnerConfig);
}
