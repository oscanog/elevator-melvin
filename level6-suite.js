"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL6_TEST_CASES = exports.LEVEL6_SCENARIOS = exports.LEVEL6_REQUIREMENTS = void 0;
exports.runLevel6TestCase = runLevel6TestCase;
exports.runLevel6Suite = runLevel6Suite;
const index_1 = require("./level-suite-helpers/index");
exports.LEVEL6_REQUIREMENTS = [
    { key: 'before-noon-return', label: 'Return to floor 0 when there are no riders and the current time is before 12:00 p.m.' },
    { key: 'after-noon-stay', label: 'Stay on the last drop-off floor when there are no riders and the current time is after 12:00 p.m.' },
    { key: 'policy-checks', label: 'Idle return policy should remain deterministic and testable.' },
];
exports.LEVEL6_SCENARIOS = [
    {
        id: 'before-noon-return-to-lobby',
        title: 'Before noon returns to the lobby after the final drop-off',
        now: () => new Date('2026-03-20T11:30:00'),
        person: { name: 'Tina', currentFloor: 4, dropOffFloor: 1 },
        expected: { currentFloor: 0, stops: 2, floorsTraversed: 8, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'before-noon-return',
    },
    {
        id: 'after-noon-stays-on-last-floor',
        title: 'After noon stays on the last drop-off floor',
        now: () => new Date('2026-03-20T13:30:00'),
        person: { name: 'Tina', currentFloor: 4, dropOffFloor: 1 },
        expected: { currentFloor: 1, stops: 2, floorsTraversed: 7, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'after-noon-stay',
    },
];
function createLevel6Elevator(dependencies, now) {
    return (0, index_1.createElevator)(dependencies, {
        idlePolicy: 'time-based',
        now,
    });
}
function runScenario(dependencies, now, personLike, expected) {
    const elevator = createLevel6Elevator(dependencies, now);
    const person = (0, index_1.createPerson)(dependencies, personLike.name, personLike.currentFloor, personLike.dropOffFloor);
    elevator.requests.push(person);
    elevator.dispatch();
    (0, index_1.expectSnapshot)(elevator, expected, 'Level 6 scenario');
}
exports.LEVEL6_TEST_CASES = [
    ...exports.LEVEL6_SCENARIOS.map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        category: 'scenario',
        coveredMethods: ['dispatch', 'checkReturnToLoby', 'returnToLoby'],
        requirementKeys: [scenario.requirementKey, 'policy-checks'],
        run: (dependencies) => runScenario(dependencies, scenario.now, scenario.person, scenario.expected),
    })),
    {
        id: 'policy-before-noon-empty-elevator-returns',
        title: 'checkReturnToLoby is true before noon when the elevator is fully idle',
        category: 'policy',
        coveredMethods: ['checkReturnToLoby'],
        requirementKeys: ['before-noon-return', 'policy-checks'],
        run: dependencies => {
            const elevator = createLevel6Elevator(dependencies, () => new Date('2026-03-20T11:30:00'));
            (0, index_1.expectEqual)(elevator.checkReturnToLoby(), true, 'before noon idle return');
        },
    },
    {
        id: 'policy-after-noon-does-not-return',
        title: 'checkReturnToLoby is false after noon',
        category: 'policy',
        coveredMethods: ['checkReturnToLoby'],
        requirementKeys: ['after-noon-stay', 'policy-checks'],
        run: dependencies => {
            const elevator = createLevel6Elevator(dependencies, () => new Date('2026-03-20T13:30:00'));
            (0, index_1.expectEqual)(elevator.checkReturnToLoby(), false, 'after noon idle return');
        },
    },
    {
        id: 'policy-pending-requests-block-lobby-return',
        title: 'checkReturnToLoby is false before noon when requests are still queued',
        category: 'policy',
        coveredMethods: ['checkReturnToLoby'],
        requirementKeys: ['policy-checks'],
        run: dependencies => {
            const elevator = createLevel6Elevator(dependencies, () => new Date('2026-03-20T11:30:00'));
            const person = (0, index_1.createPerson)(dependencies, 'Tina', 4, 1);
            elevator.requests.push(person);
            (0, index_1.expectEqual)(elevator.checkReturnToLoby(), false, 'queued requests block return');
        },
    },
];
function runLevel6TestCase(testCase, dependencies, options = {}) {
    return (0, index_1.runSuiteTestCase)(testCase, dependencies, options);
}
function runLevel6Suite(dependencies, options = {}) {
    const results = exports.LEVEL6_TEST_CASES.map(testCase => runLevel6TestCase(testCase, dependencies, options));
    const summary = (0, index_1.buildSuiteSummary)(results);
    const scenarios = (0, index_1.buildCoverageItems)(exports.LEVEL6_SCENARIOS.map(scenario => scenario.title), results, result => result.category === 'scenario' ? [result.title] : []);
    return {
        results,
        summary,
        scenarios,
        requirements: (0, index_1.buildRequirementStatus)(exports.LEVEL6_REQUIREMENTS, results),
    };
}
//# sourceMappingURL=level6-suite.js.map