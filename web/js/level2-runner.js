import {
  LEVEL2_REQUIREMENTS,
  LEVEL2_SCENARIOS,
  LEVEL2_TEST_CASES,
  runLevel2Suite,
} from '../../level2-suite.ts';
import Elevator from '../../elevator.ts';
import Person from '../../person.ts';
import {
  renderSuiteRunnerPanel,
  setupSuiteRunner,
} from './level-suite-runner.js';

const level2RunnerConfig = {
  runnerId: 'level2',
  eyebrow: 'Level 2 runner',
  title: 'Built-in test suite',
  intro: 'Run the shared Level 2 suite here to verify the two rider scenarios and full Elevator method coverage without leaving the page.',
  fileName: 'level2-suite.js',
  levelBadgeLabel: 'Level 2',
  requirements: LEVEL2_REQUIREMENTS,
  scenarios: LEVEL2_SCENARIOS,
  testCases: LEVEL2_TEST_CASES,
  runSuite: runLevel2Suite,
  dependencies: { Elevator, Person },
};

export function renderLevel2RunnerPanel() {
  return renderSuiteRunnerPanel(level2RunnerConfig);
}

export function setupLevel2Runner() {
  setupSuiteRunner(level2RunnerConfig);
}
