import {
    buildCoverageItems,
    buildRequirementStatus,
    buildSuiteSummary,
    createElevator,
    createPerson,
    ElevatorSnapshot,
    expectSnapshot,
    SuiteCoverageItem,
    SuiteDependencies,
    SuiteRequirementDefinition,
    SuiteSummary,
    SuiteTestCaseDefinition,
    SuiteTestCaseResult,
    runSuiteTestCase,
} from './level-suite-helpers/index';

export type Level5Category = 'scenario';
export type Level5RequirementKey =
    | 'scenario-up-up'
    | 'scenario-up-down'
    | 'scenario-down-up'
    | 'scenario-down-down'
    | 'metrics'
    | 'counts';

export type Level5SuiteDependencies = SuiteDependencies;
export type Level5TestCaseDefinition = SuiteTestCaseDefinition<Level5Category, Level5RequirementKey>;
export type Level5TestCaseResult = SuiteTestCaseResult<Level5Category, Level5RequirementKey>;
export type Level5CoverageItem = SuiteCoverageItem;
export type Level5SuiteSummary = SuiteSummary;

export interface Level5SuiteResult {
    results: Level5TestCaseResult[];
    summary: Level5SuiteSummary;
    scenarios: Level5CoverageItem[];
    requirements: Record<Level5RequirementKey, boolean>;
}

export const LEVEL5_REQUIREMENTS: Array<SuiteRequirementDefinition<Level5RequirementKey>> = [
    { key: 'scenario-up-up', label: 'Person A goes up, Person B goes up.' },
    { key: 'scenario-up-down', label: 'Person A goes up, Person B goes down.' },
    { key: 'scenario-down-up', label: 'Person A goes down, Person B goes up.' },
    { key: 'scenario-down-down', label: 'Person A goes down, Person B goes down.' },
    { key: 'metrics', label: 'All four tests should assert total number of stops and floors the elevator traversed.' },
    { key: 'counts', label: 'All four tests should assert the total number of requests and current riders.' },
];

export const LEVEL5_SCENARIOS = [
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
] as const;

function runScenario(
    dependencies: Level5SuiteDependencies,
    people: ReadonlyArray<{ name: string; currentFloor: number; dropOffFloor: number; }>,
    expected: ElevatorSnapshot
): void {
    const elevator = createElevator(dependencies);
    const riders = people.map(person => createPerson(
        dependencies,
        person.name,
        person.currentFloor,
        person.dropOffFloor
    ));

    elevator.requests.push(...riders);
    elevator.dispatch();

    expectSnapshot(elevator, expected, 'Level 5 scenario');
}

export const LEVEL5_TEST_CASES: Level5TestCaseDefinition[] = LEVEL5_SCENARIOS.map(scenario => ({
    id: scenario.id,
    title: scenario.title,
    category: 'scenario',
    coveredMethods: ['dispatch', 'goToFloor', 'hasPickup', 'hasDropoff'],
    requirementKeys: [scenario.requirementKey, 'metrics', 'counts'],
    run: dependencies => runScenario(
        dependencies,
        scenario.people,
        scenario.expected
    ),
}));

export function runLevel5TestCase(
    testCase: Level5TestCaseDefinition,
    dependencies: Level5SuiteDependencies,
    options: { silent?: boolean } = {}
): Level5TestCaseResult {
    return runSuiteTestCase(testCase, dependencies, options);
}

export function runLevel5Suite(
    dependencies: Level5SuiteDependencies,
    options: { silent?: boolean } = {}
): Level5SuiteResult {
    const results = LEVEL5_TEST_CASES.map(testCase => runLevel5TestCase(testCase, dependencies, options));
    const summary = buildSuiteSummary(results);
    const scenarios = buildCoverageItems(
        LEVEL5_SCENARIOS.map(scenario => scenario.title),
        results,
        result => result.category === 'scenario' ? [result.title] : []
    );

    return {
        results,
        summary,
        scenarios,
        requirements: buildRequirementStatus(LEVEL5_REQUIREMENTS, results),
    };
}
