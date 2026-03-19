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

export type Level6Category = 'scenario' | 'policy';
export type Level6RequirementKey =
    | 'before-noon-return'
    | 'after-noon-stay'
    | 'policy-checks';

export type Level6SuiteDependencies = SuiteDependencies;
export type Level6TestCaseDefinition = SuiteTestCaseDefinition<Level6Category, Level6RequirementKey>;
export type Level6TestCaseResult = SuiteTestCaseResult<Level6Category, Level6RequirementKey>;
export type Level6CoverageItem = SuiteCoverageItem;
export type Level6SuiteSummary = SuiteSummary;

export interface Level6SuiteResult {
    results: Level6TestCaseResult[];
    summary: Level6SuiteSummary;
    scenarios: Level6CoverageItem[];
    requirements: Record<Level6RequirementKey, boolean>;
}

export const LEVEL6_REQUIREMENTS: Array<SuiteRequirementDefinition<Level6RequirementKey>> = [
    { key: 'before-noon-return', label: 'Return to floor 0 when there are no riders and the current time is before 12:00 p.m.' },
    { key: 'after-noon-stay', label: 'Stay on the last drop-off floor when there are no riders and the current time is after 12:00 p.m.' },
    { key: 'policy-checks', label: 'Idle return policy should remain deterministic and testable.' },
];

export const LEVEL6_SCENARIOS = [
    {
        id: 'before-noon-return-to-lobby',
        title: 'Before noon returns to the lobby after the final drop-off',
        now: () => new Date('2026-03-20T11:30:00'),
        person: { name: 'Tina', currentFloor: 4, dropOffFloor: 1 },
        expected: { currentFloor: 0, stops: 2, floorsTraversed: 8, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'before-noon-return' as const,
    },
    {
        id: 'after-noon-stays-on-last-floor',
        title: 'After noon stays on the last drop-off floor',
        now: () => new Date('2026-03-20T13:30:00'),
        person: { name: 'Tina', currentFloor: 4, dropOffFloor: 1 },
        expected: { currentFloor: 1, stops: 2, floorsTraversed: 7, requestsCount: 0, ridersCount: 0 },
        requirementKey: 'after-noon-stay' as const,
    },
] as const;

function createLevel6Elevator(
    dependencies: Level6SuiteDependencies,
    now: () => Date
) {
    return createElevator(dependencies, {
        idlePolicy: 'time-based',
        now,
    });
}

function runScenario(
    dependencies: Level6SuiteDependencies,
    now: () => Date,
    personLike: { name: string; currentFloor: number; dropOffFloor: number; },
    expected: ElevatorSnapshot
): void {
    const elevator = createLevel6Elevator(dependencies, now);
    const person = createPerson(
        dependencies,
        personLike.name,
        personLike.currentFloor,
        personLike.dropOffFloor
    );

    elevator.requests.push(person);
    elevator.dispatch();

    expectSnapshot(elevator, expected, 'Level 6 scenario');
}

export const LEVEL6_TEST_CASES: Level6TestCaseDefinition[] = [
    ...LEVEL6_SCENARIOS.map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        category: 'scenario' as const,
        coveredMethods: ['dispatch', 'checkReturnToLoby', 'returnToLoby'],
        requirementKeys: [scenario.requirementKey, 'policy-checks'] as Level6RequirementKey[],
        run: (dependencies: Level6SuiteDependencies) => runScenario(
            dependencies,
            scenario.now,
            scenario.person,
            scenario.expected
        ),
    })),
    {
        id: 'policy-before-noon-empty-elevator-returns',
        title: 'checkReturnToLoby is true before noon when the elevator is fully idle',
        category: 'policy',
        coveredMethods: ['checkReturnToLoby'],
        requirementKeys: ['before-noon-return', 'policy-checks'] as Level6RequirementKey[],
        run: dependencies => {
            const elevator = createLevel6Elevator(
                dependencies,
                () => new Date('2026-03-20T11:30:00')
            );

            expectEqual(elevator.checkReturnToLoby(), true, 'before noon idle return');
        },
    },
    {
        id: 'policy-after-noon-does-not-return',
        title: 'checkReturnToLoby is false after noon',
        category: 'policy',
        coveredMethods: ['checkReturnToLoby'],
        requirementKeys: ['after-noon-stay', 'policy-checks'] as Level6RequirementKey[],
        run: dependencies => {
            const elevator = createLevel6Elevator(
                dependencies,
                () => new Date('2026-03-20T13:30:00')
            );

            expectEqual(elevator.checkReturnToLoby(), false, 'after noon idle return');
        },
    },
    {
        id: 'policy-pending-requests-block-lobby-return',
        title: 'checkReturnToLoby is false before noon when requests are still queued',
        category: 'policy',
        coveredMethods: ['checkReturnToLoby'],
        requirementKeys: ['policy-checks'] as Level6RequirementKey[],
        run: dependencies => {
            const elevator = createLevel6Elevator(
                dependencies,
                () => new Date('2026-03-20T11:30:00')
            );
            const person = createPerson(dependencies, 'Tina', 4, 1);

            elevator.requests.push(person);

            expectEqual(elevator.checkReturnToLoby(), false, 'queued requests block return');
        },
    },
];

export function runLevel6TestCase(
    testCase: Level6TestCaseDefinition,
    dependencies: Level6SuiteDependencies,
    options: { silent?: boolean } = {}
): Level6TestCaseResult {
    return runSuiteTestCase(testCase, dependencies, options);
}

export function runLevel6Suite(
    dependencies: Level6SuiteDependencies,
    options: { silent?: boolean } = {}
): Level6SuiteResult {
    const results = LEVEL6_TEST_CASES.map(testCase => runLevel6TestCase(testCase, dependencies, options));
    const summary = buildSuiteSummary(results);
    const scenarios = buildCoverageItems(
        LEVEL6_SCENARIOS.map(scenario => scenario.title),
        results,
        result => result.category === 'scenario' ? [result.title] : []
    );

    return {
        results,
        summary,
        scenarios,
        requirements: buildRequirementStatus(LEVEL6_REQUIREMENTS, results),
    };
}
