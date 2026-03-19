"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL4_TEST_CASES = exports.LEVEL4_SCENARIOS = exports.LEVEL4_REQUIREMENTS = void 0;
exports.runLevel4TestCase = runLevel4TestCase;
exports.runLevel4Suite = runLevel4Suite;
const index_1 = require("./level-suite-helpers/index");
exports.LEVEL4_REQUIREMENTS = [
    { key: 'multiple-requests', label: 'Multiple people can request drop off floors.' },
    { key: 'request-order', label: 'Elevator should pick up and drop off each person in order of the requests.' },
    { key: 'metrics', label: 'Level 4 journeys should keep accurate stop and floors traversed metrics.' },
];
exports.LEVEL4_SCENARIOS = [
    {
        id: 'bob-then-sue',
        title: 'Bob is delivered before Sue is served',
        people: [
            { name: 'Bob', currentFloor: 3, dropOffFloor: 9 },
            { name: 'Sue', currentFloor: 6, dropOffFloor: 2 },
        ],
        expected: { currentFloor: 2, stops: 4, floorsTraversed: 16, requestsCount: 0, ridersCount: 0 },
    },
];
function queuePeople(dependencies, people) {
    const elevator = (0, index_1.createElevator)(dependencies);
    const riders = people.map(person => (0, index_1.createPerson)(dependencies, person.name, person.currentFloor, person.dropOffFloor));
    elevator.requests.push(...riders);
    return { elevator, riders };
}
function runScenario(dependencies, people, expected) {
    const { elevator } = queuePeople(dependencies, people);
    elevator.dispatch();
    (0, index_1.expectSnapshot)(elevator, expected, 'Level 4 scenario');
}
exports.LEVEL4_TEST_CASES = [
    {
        id: 'bob-then-sue-scenario',
        title: 'dispatch completes Bob then Sue in FIFO order',
        category: 'scenario',
        coveredMethods: ['dispatch', 'goToFloor', 'hasPickup', 'hasDropoff'],
        requirementKeys: ['multiple-requests', 'request-order', 'metrics'],
        run: dependencies => runScenario(dependencies, exports.LEVEL4_SCENARIOS[0].people, exports.LEVEL4_SCENARIOS[0].expected),
    },
    {
        id: 'go-to-floor-does-not-serve-later-request-early',
        title: 'goToFloor completes the active request before the next pickup',
        category: 'queue',
        coveredMethods: ['goToFloor', 'hasPickup', 'hasDropoff'],
        requirementKeys: ['request-order', 'metrics'],
        run: dependencies => {
            const { elevator, riders } = queuePeople(dependencies, exports.LEVEL4_SCENARIOS[0].people);
            elevator.goToFloor(riders[0]);
            (0, index_1.expectSnapshot)(elevator, {
                currentFloor: 9,
                stops: 2,
                floorsTraversed: 9,
                requestsCount: 1,
                ridersCount: 0,
            }, 'Level 4 ordered goToFloor');
            (0, index_1.expectEqual)(elevator.requests[0]?.name, 'Sue', 'Next queued request after Bob');
        },
    },
];
function runLevel4TestCase(testCase, dependencies, options = {}) {
    return (0, index_1.runSuiteTestCase)(testCase, dependencies, options);
}
function runLevel4Suite(dependencies, options = {}) {
    const results = exports.LEVEL4_TEST_CASES.map(testCase => runLevel4TestCase(testCase, dependencies, options));
    const summary = (0, index_1.buildSuiteSummary)(results);
    const scenarios = (0, index_1.buildCoverageItems)(exports.LEVEL4_SCENARIOS.map(scenario => scenario.title), results, result => result.category === 'scenario' ? [exports.LEVEL4_SCENARIOS[0].title] : []);
    return {
        results,
        summary,
        scenarios,
        requirements: (0, index_1.buildRequirementStatus)(exports.LEVEL4_REQUIREMENTS, results),
    };
}
//# sourceMappingURL=level4-suite.js.map