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

export type Level4Category = 'scenario' | 'queue';
export type Level4RequirementKey = 'multiple-requests' | 'request-order' | 'metrics';

export type Level4SuiteDependencies = SuiteDependencies;
export type Level4TestCaseDefinition = SuiteTestCaseDefinition<Level4Category, Level4RequirementKey>;
export type Level4TestCaseResult = SuiteTestCaseResult<Level4Category, Level4RequirementKey>;
export type Level4CoverageItem = SuiteCoverageItem;
export type Level4SuiteSummary = SuiteSummary;

export interface Level4SuiteResult {
    results: Level4TestCaseResult[];
    summary: Level4SuiteSummary;
    scenarios: Level4CoverageItem[];
    requirements: Record<Level4RequirementKey, boolean>;
}

export const LEVEL4_REQUIREMENTS: Array<SuiteRequirementDefinition<Level4RequirementKey>> = [
    { key: 'multiple-requests', label: 'Multiple people can request drop off floors.' },
    { key: 'request-order', label: 'Elevator should pick up and drop off each person in order of the requests.' },
    { key: 'metrics', label: 'Level 4 journeys should keep accurate stop and floors traversed metrics.' },
];

export const LEVEL4_SCENARIOS = [
    {
        id: 'bob-then-sue',
        title: 'Bob is delivered before Sue is served',
        people: [
            { name: 'Bob', currentFloor: 3, dropOffFloor: 9 },
            { name: 'Sue', currentFloor: 6, dropOffFloor: 2 },
        ],
        expected: { currentFloor: 2, stops: 4, floorsTraversed: 16, requestsCount: 0, ridersCount: 0 },
    },
] as const;

function queuePeople(
    dependencies: Level4SuiteDependencies,
    people: ReadonlyArray<{ name: string; currentFloor: number; dropOffFloor: number; }>
) {
    const elevator = createElevator(dependencies);
    const riders = people.map(person => createPerson(
        dependencies,
        person.name,
        person.currentFloor,
        person.dropOffFloor
    ));

    elevator.requests.push(...riders);

    return { elevator, riders };
}

function runScenario(
    dependencies: Level4SuiteDependencies,
    people: ReadonlyArray<{ name: string; currentFloor: number; dropOffFloor: number; }>,
    expected: ElevatorSnapshot
): void {
    const { elevator } = queuePeople(dependencies, people);

    elevator.dispatch();

    expectSnapshot(elevator, expected, 'Level 4 scenario');
}

export const LEVEL4_TEST_CASES: Level4TestCaseDefinition[] = [
    {
        id: 'bob-then-sue-scenario',
        title: 'dispatch completes Bob then Sue in FIFO order',
        category: 'scenario',
        coveredMethods: ['dispatch', 'goToFloor', 'hasPickup', 'hasDropoff'],
        requirementKeys: ['multiple-requests', 'request-order', 'metrics'],
        run: dependencies => runScenario(
            dependencies,
            LEVEL4_SCENARIOS[0].people,
            LEVEL4_SCENARIOS[0].expected
        ),
    },
    {
        id: 'go-to-floor-does-not-serve-later-request-early',
        title: 'goToFloor completes the active request before the next pickup',
        category: 'queue',
        coveredMethods: ['goToFloor', 'hasPickup', 'hasDropoff'],
        requirementKeys: ['request-order', 'metrics'],
        run: dependencies => {
            const { elevator, riders } = queuePeople(dependencies, LEVEL4_SCENARIOS[0].people);

            elevator.goToFloor(riders[0]);

            expectSnapshot(elevator, {
                currentFloor: 9,
                stops: 2,
                floorsTraversed: 9,
                requestsCount: 1,
                ridersCount: 0,
            }, 'Level 4 ordered goToFloor');
            expectEqual(elevator.requests[0]?.name, 'Sue', 'Next queued request after Bob');
        },
    },
];

export function runLevel4TestCase(
    testCase: Level4TestCaseDefinition,
    dependencies: Level4SuiteDependencies,
    options: { silent?: boolean } = {}
): Level4TestCaseResult {
    return runSuiteTestCase(testCase, dependencies, options);
}

export function runLevel4Suite(
    dependencies: Level4SuiteDependencies,
    options: { silent?: boolean } = {}
): Level4SuiteResult {
    const results = LEVEL4_TEST_CASES.map(testCase => runLevel4TestCase(testCase, dependencies, options));
    const summary = buildSuiteSummary(results);
    const scenarios = buildCoverageItems(
        LEVEL4_SCENARIOS.map(scenario => scenario.title),
        results,
        result => result.category === 'scenario' ? [LEVEL4_SCENARIOS[0].title] : []
    );

    return {
        results,
        summary,
        scenarios,
        requirements: buildRequirementStatus(LEVEL4_REQUIREMENTS, results),
    };
}
