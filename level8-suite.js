"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL8_TEST_CASES = exports.LEVEL8_EXPECTED_OPTIMIZED_SNAPSHOT = exports.LEVEL8_DEMO_PEOPLE = exports.LEVEL8_REQUIREMENTS = void 0;
exports.runLevel8TestCase = runLevel8TestCase;
exports.runLevel8Suite = runLevel8Suite;
const index_1 = require("./level-suite-helpers/index");
exports.LEVEL8_REQUIREMENTS = [
    { key: 'many-people', label: 'Level 8 should seed a many-person crowd for visualization.' },
    { key: 'mixed-requests', label: 'The crowd should include different floors and mixed trip directions.' },
    { key: 'visualization-ready', label: 'The crowd run should fully complete with stable final metrics.' },
];
exports.LEVEL8_DEMO_PEOPLE = [
    { name: 'Ava', currentFloor: 0, dropOffFloor: 8 },
    { name: 'Ben', currentFloor: 2, dropOffFloor: 6 },
    { name: 'Cara', currentFloor: 4, dropOffFloor: 1 },
    { name: 'Drew', currentFloor: 7, dropOffFloor: 3 },
    { name: 'Eli', currentFloor: 1, dropOffFloor: 9 },
    { name: 'Faye', currentFloor: 5, dropOffFloor: 0 },
    { name: 'Gus', currentFloor: 8, dropOffFloor: 2 },
    { name: 'Hana', currentFloor: 3, dropOffFloor: 7 },
    { name: 'Ivan', currentFloor: 6, dropOffFloor: 4 },
];
exports.LEVEL8_EXPECTED_OPTIMIZED_SNAPSHOT = {
    currentFloor: 0,
    stops: 18,
    floorsTraversed: 18,
    requestsCount: 0,
    ridersCount: 0,
};
function createLevel8Elevator(dependencies) {
    return (0, index_1.createElevator)(dependencies, { dispatchStrategy: 'optimized' });
}
function queueCrowd(dependencies) {
    const elevator = createLevel8Elevator(dependencies);
    const riders = exports.LEVEL8_DEMO_PEOPLE.map(person => (0, index_1.createPerson)(dependencies, person.name, person.currentFloor, person.dropOffFloor));
    elevator.requests.push(...riders);
    return elevator;
}
exports.LEVEL8_TEST_CASES = [
    {
        id: 'level8-crowd-fixture-is-varied',
        title: 'Level 8 crowd fixture is varied enough for visualization',
        category: 'fixture',
        coveredMethods: [],
        requirementKeys: ['many-people', 'mixed-requests'],
        run: () => {
            const names = exports.LEVEL8_DEMO_PEOPLE.map(person => person.name);
            const uniqueNames = new Set(names);
            const upTrips = exports.LEVEL8_DEMO_PEOPLE.filter(person => person.dropOffFloor > person.currentFloor);
            const downTrips = exports.LEVEL8_DEMO_PEOPLE.filter(person => person.dropOffFloor < person.currentFloor);
            const pickupFloors = new Set(exports.LEVEL8_DEMO_PEOPLE.map(person => person.currentFloor));
            const dropOffFloors = new Set(exports.LEVEL8_DEMO_PEOPLE.map(person => person.dropOffFloor));
            (0, index_1.expectEqual)(exports.LEVEL8_DEMO_PEOPLE.length, 9, 'Level 8 total people');
            (0, index_1.expectEqual)(uniqueNames.size, 9, 'Level 8 unique names');
            (0, index_1.expectEqual)(upTrips.length > 0, true, 'Level 8 includes upward requests');
            (0, index_1.expectEqual)(downTrips.length > 0, true, 'Level 8 includes downward requests');
            (0, index_1.expectEqual)(pickupFloors.size, 9, 'Level 8 pickup floor coverage');
            (0, index_1.expectEqual)(dropOffFloors.size, 9, 'Level 8 drop-off floor coverage');
        },
    },
    {
        id: 'level8-crowd-run-completes-with-expected-metrics',
        title: 'Level 8 crowd run completes with the expected optimized metrics',
        category: 'scenario',
        coveredMethods: ['dispatch'],
        requirementKeys: ['many-people', 'mixed-requests', 'visualization-ready'],
        run: dependencies => {
            const elevator = queueCrowd(dependencies);
            elevator.dispatch();
            (0, index_1.expectSnapshot)(elevator, exports.LEVEL8_EXPECTED_OPTIMIZED_SNAPSHOT, 'Level 8 optimized crowd snapshot');
        },
    },
];
function runLevel8TestCase(testCase, dependencies, options = {}) {
    return (0, index_1.runSuiteTestCase)(testCase, dependencies, options);
}
function runLevel8Suite(dependencies, options = {}) {
    const results = exports.LEVEL8_TEST_CASES.map(testCase => runLevel8TestCase(testCase, dependencies, options));
    const summary = (0, index_1.buildSuiteSummary)(results);
    const scenarios = (0, index_1.buildCoverageItems)(['Level 8 crowd fixture', 'Level 8 crowd run'], results, result => result.category === 'fixture' ? ['Level 8 crowd fixture'] : ['Level 8 crowd run']);
    return {
        results,
        summary,
        scenarios,
        requirements: (0, index_1.buildRequirementStatus)(exports.LEVEL8_REQUIREMENTS, results),
    };
}
//# sourceMappingURL=level8-suite.js.map