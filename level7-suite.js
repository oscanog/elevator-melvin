"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL7_TEST_CASES = exports.LEVEL7_SCENARIOS = exports.LEVEL7_REQUIREMENTS = void 0;
exports.runLevel7TestCase = runLevel7TestCase;
exports.runLevel7Suite = runLevel7Suite;
const index_1 = require("./level-suite-helpers/index");
exports.LEVEL7_REQUIREMENTS = [
    { key: 'optimized-dispatch', label: 'Dispatch logic can switch between FIFO and optimized strategies.' },
    { key: 'fewer-floors', label: 'Optimized dispatch traverses fewer floors than FIFO on every comparison scenario.' },
    { key: 'complete-delivery', label: 'Both strategies still complete every request with no riders left onboard.' },
];
exports.LEVEL7_SCENARIOS = [
    {
        id: 'up-up-optimized-win',
        title: 'Up/up requests let optimization pick up the closer rider first',
        people: [
            { name: 'Ava', currentFloor: 3, dropOffFloor: 9 },
            { name: 'Ben', currentFloor: 1, dropOffFloor: 7 },
        ],
        expectedBaseline: { currentFloor: 7, stops: 4, floorsTraversed: 23, requestsCount: 0, ridersCount: 0 },
        expectedOptimized: { currentFloor: 9, stops: 4, floorsTraversed: 9, requestsCount: 0, ridersCount: 0 },
    },
    {
        id: 'up-down-optimized-win',
        title: 'Up/down requests reward clearing the closer downward rider first',
        people: [
            { name: 'Ava', currentFloor: 5, dropOffFloor: 8 },
            { name: 'Ben', currentFloor: 2, dropOffFloor: 1 },
        ],
        expectedBaseline: { currentFloor: 1, stops: 4, floorsTraversed: 15, requestsCount: 0, ridersCount: 0 },
        expectedOptimized: { currentFloor: 8, stops: 4, floorsTraversed: 10, requestsCount: 0, ridersCount: 0 },
    },
    {
        id: 'down-up-optimized-win',
        title: 'Down/up requests still benefit from minimizing the initial detour',
        people: [
            { name: 'Ava', currentFloor: 8, dropOffFloor: 1 },
            { name: 'Ben', currentFloor: 2, dropOffFloor: 9 },
        ],
        expectedBaseline: { currentFloor: 9, stops: 4, floorsTraversed: 23, requestsCount: 0, ridersCount: 0 },
        expectedOptimized: { currentFloor: 1, stops: 4, floorsTraversed: 17, requestsCount: 0, ridersCount: 0 },
    },
    {
        id: 'down-down-optimized-win',
        title: 'Down/down requests save travel by batching the upward pickups first',
        people: [
            { name: 'Ava', currentFloor: 8, dropOffFloor: 2 },
            { name: 'Ben', currentFloor: 5, dropOffFloor: 0 },
        ],
        expectedBaseline: { currentFloor: 0, stops: 4, floorsTraversed: 22, requestsCount: 0, ridersCount: 0 },
        expectedOptimized: { currentFloor: 0, stops: 4, floorsTraversed: 16, requestsCount: 0, ridersCount: 0 },
    },
];
function queuePeople(dependencies, strategy, people) {
    const elevator = (0, index_1.createElevator)(dependencies, { dispatchStrategy: strategy });
    const riders = people.map(person => (0, index_1.createPerson)(dependencies, person.name, person.currentFloor, person.dropOffFloor));
    elevator.requests.push(...riders);
    return elevator;
}
function runScenarioComparison(dependencies, people, expectedBaseline, expectedOptimized) {
    const baselineElevator = queuePeople(dependencies, 'fifo', people);
    const optimizedElevator = queuePeople(dependencies, 'optimized', people);
    baselineElevator.dispatch();
    optimizedElevator.dispatch();
    (0, index_1.expectSnapshot)(baselineElevator, expectedBaseline, 'Level 7 baseline snapshot');
    (0, index_1.expectSnapshot)(optimizedElevator, expectedOptimized, 'Level 7 optimized snapshot');
    if (optimizedElevator.floorsTraversed >= baselineElevator.floorsTraversed) {
        throw new Error(`Expected optimized floorsTraversed to be less than FIFO, received ${optimizedElevator.floorsTraversed} >= ${baselineElevator.floorsTraversed}`);
    }
}
exports.LEVEL7_TEST_CASES = exports.LEVEL7_SCENARIOS.map(scenario => ({
    id: scenario.id,
    title: scenario.title,
    category: 'comparison',
    coveredMethods: ['dispatch'],
    requirementKeys: ['optimized-dispatch', 'fewer-floors', 'complete-delivery'],
    run: dependencies => runScenarioComparison(dependencies, scenario.people, scenario.expectedBaseline, scenario.expectedOptimized),
}));
function runLevel7TestCase(testCase, dependencies, options = {}) {
    return (0, index_1.runSuiteTestCase)(testCase, dependencies, options);
}
function runLevel7Suite(dependencies, options = {}) {
    const results = exports.LEVEL7_TEST_CASES.map(testCase => runLevel7TestCase(testCase, dependencies, options));
    const summary = (0, index_1.buildSuiteSummary)(results);
    const scenarios = (0, index_1.buildCoverageItems)(exports.LEVEL7_SCENARIOS.map(scenario => scenario.title), results, result => result.category === 'comparison' ? [result.title] : []);
    return {
        results,
        summary,
        scenarios,
        requirements: (0, index_1.buildRequirementStatus)(exports.LEVEL7_REQUIREMENTS, results),
    };
}
//# sourceMappingURL=level7-suite.js.map