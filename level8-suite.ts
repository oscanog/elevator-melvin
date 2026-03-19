import {
    buildCoverageItems,
    buildRequirementStatus,
    buildSuiteSummary,
    createElevator,
    createPerson,
    ElevatorSnapshot,
    expectEqual,
    expectSnapshot,
    SuiteCoverageItem,
    SuiteDependencies,
    SuiteRequirementDefinition,
    SuiteSummary,
    SuiteTestCaseDefinition,
    SuiteTestCaseResult,
    runSuiteTestCase,
} from './level-suite-helpers/index';

export type Level8Category = 'fixture' | 'scenario';
export type Level8RequirementKey =
    | 'many-people'
    | 'mixed-requests'
    | 'visualization-ready';

export type Level8SuiteDependencies = SuiteDependencies;
export type Level8TestCaseDefinition = SuiteTestCaseDefinition<Level8Category, Level8RequirementKey>;
export type Level8TestCaseResult = SuiteTestCaseResult<Level8Category, Level8RequirementKey>;
export type Level8CoverageItem = SuiteCoverageItem;
export type Level8SuiteSummary = SuiteSummary;

export interface Level8SuiteResult {
    results: Level8TestCaseResult[];
    summary: Level8SuiteSummary;
    scenarios: Level8CoverageItem[];
    requirements: Record<Level8RequirementKey, boolean>;
}

export const LEVEL8_REQUIREMENTS: Array<SuiteRequirementDefinition<Level8RequirementKey>> = [
    { key: 'many-people', label: 'Level 8 should seed a many-person crowd for visualization.' },
    { key: 'mixed-requests', label: 'The crowd should include different floors and mixed trip directions.' },
    { key: 'visualization-ready', label: 'The crowd run should fully complete with stable final metrics.' },
];

export const LEVEL8_DEMO_PEOPLE = [
    { name: 'Ava', currentFloor: 0, dropOffFloor: 8 },
    { name: 'Ben', currentFloor: 2, dropOffFloor: 6 },
    { name: 'Cara', currentFloor: 4, dropOffFloor: 1 },
    { name: 'Drew', currentFloor: 7, dropOffFloor: 3 },
    { name: 'Eli', currentFloor: 1, dropOffFloor: 9 },
    { name: 'Faye', currentFloor: 5, dropOffFloor: 0 },
    { name: 'Gus', currentFloor: 8, dropOffFloor: 2 },
    { name: 'Hana', currentFloor: 3, dropOffFloor: 7 },
    { name: 'Ivan', currentFloor: 6, dropOffFloor: 4 },
] as const;

export const LEVEL8_EXPECTED_OPTIMIZED_SNAPSHOT: ElevatorSnapshot = {
    currentFloor: 0,
    stops: 18,
    floorsTraversed: 18,
    requestsCount: 0,
    ridersCount: 0,
};

function createLevel8Elevator(dependencies: Level8SuiteDependencies) {
    return createElevator(dependencies, { dispatchStrategy: 'optimized' });
}

function queueCrowd(dependencies: Level8SuiteDependencies) {
    const elevator = createLevel8Elevator(dependencies);
    const riders = LEVEL8_DEMO_PEOPLE.map(person => createPerson(
        dependencies,
        person.name,
        person.currentFloor,
        person.dropOffFloor
    ));

    elevator.requests.push(...riders);

    return elevator;
}

export const LEVEL8_TEST_CASES: Level8TestCaseDefinition[] = [
    {
        id: 'level8-crowd-fixture-is-varied',
        title: 'Level 8 crowd fixture is varied enough for visualization',
        category: 'fixture',
        coveredMethods: [],
        requirementKeys: ['many-people', 'mixed-requests'],
        run: () => {
            const names = LEVEL8_DEMO_PEOPLE.map(person => person.name);
            const uniqueNames = new Set(names);
            const upTrips = LEVEL8_DEMO_PEOPLE.filter(person => person.dropOffFloor > person.currentFloor);
            const downTrips = LEVEL8_DEMO_PEOPLE.filter(person => person.dropOffFloor < person.currentFloor);
            const pickupFloors = new Set(LEVEL8_DEMO_PEOPLE.map(person => person.currentFloor));
            const dropOffFloors = new Set(LEVEL8_DEMO_PEOPLE.map(person => person.dropOffFloor));

            expectEqual(LEVEL8_DEMO_PEOPLE.length, 9, 'Level 8 total people');
            expectEqual(uniqueNames.size, 9, 'Level 8 unique names');
            expectEqual(upTrips.length > 0, true, 'Level 8 includes upward requests');
            expectEqual(downTrips.length > 0, true, 'Level 8 includes downward requests');
            expectEqual(pickupFloors.size, 9, 'Level 8 pickup floor coverage');
            expectEqual(dropOffFloors.size, 9, 'Level 8 drop-off floor coverage');
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

            expectSnapshot(elevator, LEVEL8_EXPECTED_OPTIMIZED_SNAPSHOT, 'Level 8 optimized crowd snapshot');
        },
    },
];

export function runLevel8TestCase(
    testCase: Level8TestCaseDefinition,
    dependencies: Level8SuiteDependencies,
    options: { silent?: boolean } = {}
): Level8TestCaseResult {
    return runSuiteTestCase(testCase, dependencies, options);
}

export function runLevel8Suite(
    dependencies: Level8SuiteDependencies,
    options: { silent?: boolean } = {}
): Level8SuiteResult {
    const results = LEVEL8_TEST_CASES.map(testCase => runLevel8TestCase(testCase, dependencies, options));
    const summary = buildSuiteSummary(results);
    const scenarios = buildCoverageItems(
        ['Level 8 crowd fixture', 'Level 8 crowd run'],
        results,
        result => result.category === 'fixture' ? ['Level 8 crowd fixture'] : ['Level 8 crowd run']
    );

    return {
        results,
        summary,
        scenarios,
        requirements: buildRequirementStatus(LEVEL8_REQUIREMENTS, results),
    };
}
