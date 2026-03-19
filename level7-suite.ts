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

export type Level7Category = 'comparison';
export type Level7RequirementKey =
    | 'optimized-dispatch'
    | 'fewer-floors'
    | 'complete-delivery';

export type Level7SuiteDependencies = SuiteDependencies;
export type Level7TestCaseDefinition = SuiteTestCaseDefinition<Level7Category, Level7RequirementKey>;
export type Level7TestCaseResult = SuiteTestCaseResult<Level7Category, Level7RequirementKey>;
export type Level7CoverageItem = SuiteCoverageItem;
export type Level7SuiteSummary = SuiteSummary;

export interface Level7SuiteResult {
    results: Level7TestCaseResult[];
    summary: Level7SuiteSummary;
    scenarios: Level7CoverageItem[];
    requirements: Record<Level7RequirementKey, boolean>;
}

export const LEVEL7_REQUIREMENTS: Array<SuiteRequirementDefinition<Level7RequirementKey>> = [
    { key: 'optimized-dispatch', label: 'Dispatch logic can switch between FIFO and optimized strategies.' },
    { key: 'fewer-floors', label: 'Optimized dispatch traverses fewer floors than FIFO on every comparison scenario.' },
    { key: 'complete-delivery', label: 'Both strategies still complete every request with no riders left onboard.' },
];

export const LEVEL7_SCENARIOS = [
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
] as const;

function queuePeople(
    dependencies: Level7SuiteDependencies,
    strategy: 'fifo' | 'optimized',
    people: ReadonlyArray<{ name: string; currentFloor: number; dropOffFloor: number; }>
) {
    const elevator = createElevator(dependencies, { dispatchStrategy: strategy });
    const riders = people.map(person => createPerson(
        dependencies,
        person.name,
        person.currentFloor,
        person.dropOffFloor
    ));

    elevator.requests.push(...riders);

    return elevator;
}

function runScenarioComparison(
    dependencies: Level7SuiteDependencies,
    people: ReadonlyArray<{ name: string; currentFloor: number; dropOffFloor: number; }>,
    expectedBaseline: ElevatorSnapshot,
    expectedOptimized: ElevatorSnapshot
) {
    const baselineElevator = queuePeople(dependencies, 'fifo', people);
    const optimizedElevator = queuePeople(dependencies, 'optimized', people);

    baselineElevator.dispatch();
    optimizedElevator.dispatch();

    expectSnapshot(baselineElevator, expectedBaseline, 'Level 7 baseline snapshot');
    expectSnapshot(optimizedElevator, expectedOptimized, 'Level 7 optimized snapshot');

    if (optimizedElevator.floorsTraversed >= baselineElevator.floorsTraversed) {
        throw new Error(
            `Expected optimized floorsTraversed to be less than FIFO, received ${optimizedElevator.floorsTraversed} >= ${baselineElevator.floorsTraversed}`
        );
    }
}

export const LEVEL7_TEST_CASES: Level7TestCaseDefinition[] = LEVEL7_SCENARIOS.map(scenario => ({
    id: scenario.id,
    title: scenario.title,
    category: 'comparison',
    coveredMethods: ['dispatch'],
    requirementKeys: ['optimized-dispatch', 'fewer-floors', 'complete-delivery'],
    run: dependencies => runScenarioComparison(
        dependencies,
        scenario.people,
        scenario.expectedBaseline,
        scenario.expectedOptimized
    ),
}));

export function runLevel7TestCase(
    testCase: Level7TestCaseDefinition,
    dependencies: Level7SuiteDependencies,
    options: { silent?: boolean } = {}
): Level7TestCaseResult {
    return runSuiteTestCase(testCase, dependencies, options);
}

export function runLevel7Suite(
    dependencies: Level7SuiteDependencies,
    options: { silent?: boolean } = {}
): Level7SuiteResult {
    const results = LEVEL7_TEST_CASES.map(testCase => runLevel7TestCase(testCase, dependencies, options));
    const summary = buildSuiteSummary(results);
    const scenarios = buildCoverageItems(
        LEVEL7_SCENARIOS.map(scenario => scenario.title),
        results,
        result => result.category === 'comparison' ? [result.title] : []
    );

    return {
        results,
        summary,
        scenarios,
        requirements: buildRequirementStatus(LEVEL7_REQUIREMENTS, results),
    };
}
