"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL5_TEST_CASES = exports.LEVEL5_SCENARIOS = exports.LEVEL5_REQUIREMENTS = void 0;
exports.runLevel5TestCase = runLevel5TestCase;
exports.runLevel5Suite = runLevel5Suite;
const index_1 = require("./level-suite-helpers/index");
exports.LEVEL5_REQUIREMENTS = [
    { key: 'scenario-up-up', label: 'Person A goes up, Person B goes up.' },
    { key: 'scenario-up-down', label: 'Person A goes up, Person B goes down.' },
    { key: 'scenario-down-up', label: 'Person A goes down, Person B goes up.' },
    { key: 'scenario-down-down', label: 'Person A goes down, Person B goes down.' },
    { key: 'metrics', label: 'All four tests should assert total number of stops and floors the elevator traversed.' },
    { key: 'counts', label: 'All four tests should assert the total number of requests and current riders.' },
];
exports.LEVEL5_SCENARIOS = [
    {
        id: 'person-a-up-person-b-up',
        title: 'Person A up, Person B up',
        people: [
            { name: 'Person A', currentFloor: 1, dropOffFloor: 6 },
            { name: 'Person B', currentFloor: 2, dropOffFloor: 8 },
        ],
        expected: { currentFloor: 8, stops: 4, floorsTraversed: 16, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'scenario-up-up',
    },
    {
        id: 'person-a-up-person-b-down',
        title: 'Person A up, Person B down',
        people: [
            { name: 'Person A', currentFloor: 1, dropOffFloor: 7 },
            { name: 'Person B', currentFloor: 8, dropOffFloor: 3 },
        ],
        expected: { currentFloor: 3, stops: 4, floorsTraversed: 13, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'scenario-up-down',
    },
    {
        id: 'person-a-down-person-b-up',
        title: 'Person A down, Person B up',
        people: [
            { name: 'Person A', currentFloor: 8, dropOffFloor: 2 },
            { name: 'Person B', currentFloor: 1, dropOffFloor: 7 },
        ],
        expected: { currentFloor: 7, stops: 4, floorsTraversed: 21, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'scenario-down-up',
    },
    {
        id: 'person-a-down-person-b-down',
        title: 'Person A down, Person B down',
        people: [
            { name: 'Person A', currentFloor: 8, dropOffFloor: 3 },
            { name: 'Person B', currentFloor: 6, dropOffFloor: 1 },
        ],
        expected: { currentFloor: 1, stops: 4, floorsTraversed: 21, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'scenario-down-down',
    },
];
function runScenario(dependencies, people, expected) {
    const elevator = (0, index_1.createElevator)(dependencies);
    const riders = people.map(person => (0, index_1.createPerson)(dependencies, person.name, person.currentFloor, person.dropOffFloor));
    elevator.requests.push(...riders);
    elevator.dispatch();
    (0, index_1.expectSnapshot)(elevator, expected, 'Level 5 scenario');
}
exports.LEVEL5_TEST_CASES = exports.LEVEL5_SCENARIOS.map(scenario => ({
    id: scenario.id,
    title: scenario.title,
    category: 'scenario',
    coveredMethods: ['dispatch', 'goToFloor', 'hasPickup', 'hasDropoff'],
    requirementKeys: [scenario.requirementKey, 'metrics', 'counts'],
    run: dependencies => runScenario(dependencies, scenario.people, scenario.expected),
}));
function runLevel5TestCase(testCase, dependencies, options = {}) {
    return (0, index_1.runSuiteTestCase)(testCase, dependencies, options);
}
function runLevel5Suite(dependencies, options = {}) {
    const results = exports.LEVEL5_TEST_CASES.map(testCase => runLevel5TestCase(testCase, dependencies, options));
    const summary = (0, index_1.buildSuiteSummary)(results);
    const scenarios = (0, index_1.buildCoverageItems)(exports.LEVEL5_SCENARIOS.map(scenario => scenario.title), results, result => result.category === 'scenario' ? [result.title] : []);
    return {
        results,
        summary,
        scenarios,
        requirements: (0, index_1.buildRequirementStatus)(exports.LEVEL5_REQUIREMENTS, results),
    };
}
//# sourceMappingURL=level5-suite.js.map