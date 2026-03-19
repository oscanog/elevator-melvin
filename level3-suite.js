"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL3_TEST_CASES = exports.LEVEL3_SCENARIOS = exports.LEVEL3_REQUIREMENTS = void 0;
exports.runLevel3TestCase = runLevel3TestCase;
exports.runLevel3Suite = runLevel3Suite;
const index_1 = require("./level-suite-helpers/index");
exports.LEVEL3_REQUIREMENTS = [
    { key: 'floors-traversed', label: 'Elevator should keep track of how many total floors it has traversed.' },
    { key: 'stops', label: 'Elevator should keep track of how many total stops it has made.' },
    { key: 'efficiency', label: 'Measure elevator efficiency (the less number of floors an elevator traverses, the better).' },
];
exports.LEVEL3_SCENARIOS = [
    {
        id: 'short-trip',
        title: 'Short trip metrics',
        person: { name: 'Charlie', currentFloor: 1, dropOffFloor: 3 },
        expected: { currentFloor: 3, stops: 2, floorsTraversed: 3, requestsCount: 0, ridersCount: 0 },
    },
    {
        id: 'long-trip',
        title: 'Long trip metrics',
        person: { name: 'Charlie', currentFloor: 2, dropOffFloor: 8 },
        expected: { currentFloor: 8, stops: 2, floorsTraversed: 8, requestsCount: 0, ridersCount: 0 },
    },
];
function runScenario(dependencies, personName, currentFloor, dropOffFloor, expected) {
    const elevator = (0, index_1.createElevator)(dependencies);
    const person = (0, index_1.createPerson)(dependencies, personName, currentFloor, dropOffFloor);
    elevator.requests.push(person);
    elevator.goToFloor(person);
    (0, index_1.expectSnapshot)(elevator, expected, `Level 3 scenario ${personName}`);
}
function buildScenarioCases() {
    return exports.LEVEL3_SCENARIOS.map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        category: 'scenario',
        coveredMethods: ['goToFloor'],
        requirementKeys: ['floors-traversed', 'stops', 'efficiency'],
        run: dependencies => runScenario(dependencies, scenario.person.name, scenario.person.currentFloor, scenario.person.dropOffFloor, scenario.expected),
    }));
}
function buildMetricCases() {
    return [
        {
            id: 'metrics-start-at-zero',
            title: 'metrics start at zero',
            category: 'metric',
            coveredMethods: ['constructor'],
            requirementKeys: ['floors-traversed', 'stops'],
            run: dependencies => {
                const elevator = (0, index_1.createElevator)(dependencies);
                (0, index_1.expectEqual)(elevator.floorsTraversed, 0, 'initial floorsTraversed');
                (0, index_1.expectEqual)(elevator.stops, 0, 'initial stops');
            },
        },
        {
            id: 'move-up-increments-floors-traversed',
            title: 'moveUp increments floorsTraversed by one',
            category: 'metric',
            coveredMethods: ['moveUp'],
            requirementKeys: ['floors-traversed'],
            run: dependencies => {
                const elevator = (0, index_1.createElevator)(dependencies);
                elevator.moveUp();
                (0, index_1.expectEqual)(elevator.floorsTraversed, 1, 'moveUp floorsTraversed');
                (0, index_1.expectEqual)(elevator.currentFloor, 1, 'moveUp currentFloor');
            },
        },
        {
            id: 'move-down-increments-only-when-moving',
            title: 'moveDown increments floorsTraversed only when movement happens',
            category: 'metric',
            coveredMethods: ['moveDown'],
            requirementKeys: ['floors-traversed'],
            run: dependencies => {
                const elevator = (0, index_1.createElevator)(dependencies);
                elevator.moveDown();
                (0, index_1.expectEqual)(elevator.floorsTraversed, 0, 'moveDown floorsTraversed at lobby');
                elevator.currentFloor = 2;
                elevator.moveDown();
                (0, index_1.expectEqual)(elevator.floorsTraversed, 1, 'moveDown floorsTraversed after movement');
                (0, index_1.expectEqual)(elevator.currentFloor, 1, 'moveDown currentFloor after movement');
            },
        },
        {
            id: 'trip-metrics-count-two-stops',
            title: 'pickup and dropoff journeys count the expected total stops',
            category: 'metric',
            coveredMethods: ['goToFloor'],
            requirementKeys: ['stops'],
            run: dependencies => {
                const elevator = (0, index_1.createElevator)(dependencies);
                const person = (0, index_1.createPerson)(dependencies, 'Charlie', 1, 3);
                elevator.requests.push(person);
                elevator.goToFloor(person);
                (0, index_1.expectEqual)(elevator.stops, 2, 'trip stops');
            },
        },
        {
            id: 'shorter-route-is-more-efficient',
            title: 'a shorter route is more efficient than a longer route',
            category: 'metric',
            coveredMethods: ['goToFloor'],
            requirementKeys: ['efficiency'],
            run: dependencies => {
                const shortTripElevator = (0, index_1.createElevator)(dependencies);
                const shortTripPerson = (0, index_1.createPerson)(dependencies, 'Charlie', 1, 3);
                shortTripElevator.requests.push(shortTripPerson);
                shortTripElevator.goToFloor(shortTripPerson);
                const longTripElevator = (0, index_1.createElevator)(dependencies);
                const longTripPerson = (0, index_1.createPerson)(dependencies, 'Charlie', 2, 8);
                longTripElevator.requests.push(longTripPerson);
                longTripElevator.goToFloor(longTripPerson);
                (0, index_1.expectEqual)(shortTripElevator.floorsTraversed < longTripElevator.floorsTraversed, true, 'efficiency comparison');
            },
        },
    ];
}
exports.LEVEL3_TEST_CASES = [
    ...buildScenarioCases(),
    ...buildMetricCases(),
];
function runLevel3TestCase(testCase, dependencies, options = {}) {
    return (0, index_1.runSuiteTestCase)(testCase, dependencies, options);
}
function runLevel3Suite(dependencies, options = {}) {
    const results = exports.LEVEL3_TEST_CASES.map(testCase => runLevel3TestCase(testCase, dependencies, options));
    const summary = (0, index_1.buildSuiteSummary)(results);
    const scenarios = (0, index_1.buildCoverageItems)(exports.LEVEL3_SCENARIOS.map(scenario => scenario.title), results, result => result.category === 'scenario' ? [result.title] : []);
    return {
        results,
        summary,
        scenarios,
        requirements: (0, index_1.buildRequirementStatus)(exports.LEVEL3_REQUIREMENTS, results),
    };
}
//# sourceMappingURL=level3-suite.js.map