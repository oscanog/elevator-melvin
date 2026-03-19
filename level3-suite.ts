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

export type Level3Category = 'scenario' | 'metric';
export type Level3RequirementKey = 'floors-traversed' | 'stops' | 'efficiency';

export type Level3SuiteDependencies = SuiteDependencies;
export type Level3TestCaseDefinition = SuiteTestCaseDefinition<Level3Category, Level3RequirementKey>;
export type Level3TestCaseResult = SuiteTestCaseResult<Level3Category, Level3RequirementKey>;
export type Level3CoverageItem = SuiteCoverageItem;
export type Level3SuiteSummary = SuiteSummary;

export interface Level3SuiteResult {
    results: Level3TestCaseResult[];
    summary: Level3SuiteSummary;
    scenarios: Level3CoverageItem[];
    requirements: Record<Level3RequirementKey, boolean>;
}

export const LEVEL3_REQUIREMENTS: Array<SuiteRequirementDefinition<Level3RequirementKey>> = [
    { key: 'floors-traversed', label: 'Elevator should keep track of how many total floors it has traversed.' },
    { key: 'stops', label: 'Elevator should keep track of how many total stops it has made.' },
    { key: 'efficiency', label: 'Measure elevator efficiency (the less number of floors an elevator traverses, the better).' },
];

export const LEVEL3_SCENARIOS = [
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
] as const;

function runScenario(
    dependencies: Level3SuiteDependencies,
    personName: string,
    currentFloor: number,
    dropOffFloor: number,
    expected: ElevatorSnapshot
): void {
    const elevator = createElevator(dependencies);
    const person = createPerson(dependencies, personName, currentFloor, dropOffFloor);

    elevator.requests.push(person);
    elevator.goToFloor(person);

    expectSnapshot(elevator, expected, `Level 3 scenario ${personName}`);
}

function buildScenarioCases(): Level3TestCaseDefinition[] {
    return LEVEL3_SCENARIOS.map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        category: 'scenario',
        coveredMethods: ['goToFloor'],
        requirementKeys: ['floors-traversed', 'stops', 'efficiency'],
        run: dependencies => runScenario(
            dependencies,
            scenario.person.name,
            scenario.person.currentFloor,
            scenario.person.dropOffFloor,
            scenario.expected
        ),
    }));
}

function buildMetricCases(): Level3TestCaseDefinition[] {
    return [
        {
            id: 'metrics-start-at-zero',
            title: 'metrics start at zero',
            category: 'metric',
            coveredMethods: ['constructor'],
            requirementKeys: ['floors-traversed', 'stops'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                expectEqual(elevator.floorsTraversed, 0, 'initial floorsTraversed');
                expectEqual(elevator.stops, 0, 'initial stops');
            },
        },
        {
            id: 'move-up-increments-floors-traversed',
            title: 'moveUp increments floorsTraversed by one',
            category: 'metric',
            coveredMethods: ['moveUp'],
            requirementKeys: ['floors-traversed'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                elevator.moveUp();
                expectEqual(elevator.floorsTraversed, 1, 'moveUp floorsTraversed');
                expectEqual(elevator.currentFloor, 1, 'moveUp currentFloor');
            },
        },
        {
            id: 'move-down-increments-only-when-moving',
            title: 'moveDown increments floorsTraversed only when movement happens',
            category: 'metric',
            coveredMethods: ['moveDown'],
            requirementKeys: ['floors-traversed'],
            run: dependencies => {
                const elevator = createElevator(dependencies);

                elevator.moveDown();
                expectEqual(elevator.floorsTraversed, 0, 'moveDown floorsTraversed at lobby');

                elevator.currentFloor = 2;
                elevator.moveDown();
                expectEqual(elevator.floorsTraversed, 1, 'moveDown floorsTraversed after movement');
                expectEqual(elevator.currentFloor, 1, 'moveDown currentFloor after movement');
            },
        },
        {
            id: 'trip-metrics-count-two-stops',
            title: 'pickup and dropoff journeys count the expected total stops',
            category: 'metric',
            coveredMethods: ['goToFloor'],
            requirementKeys: ['stops'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                const person = createPerson(dependencies, 'Charlie', 1, 3);

                elevator.requests.push(person);
                elevator.goToFloor(person);

                expectEqual(elevator.stops, 2, 'trip stops');
            },
        },
        {
            id: 'shorter-route-is-more-efficient',
            title: 'a shorter route is more efficient than a longer route',
            category: 'metric',
            coveredMethods: ['goToFloor'],
            requirementKeys: ['efficiency'],
            run: dependencies => {
                const shortTripElevator = createElevator(dependencies);
                const shortTripPerson = createPerson(dependencies, 'Charlie', 1, 3);
                shortTripElevator.requests.push(shortTripPerson);
                shortTripElevator.goToFloor(shortTripPerson);

                const longTripElevator = createElevator(dependencies);
                const longTripPerson = createPerson(dependencies, 'Charlie', 2, 8);
                longTripElevator.requests.push(longTripPerson);
                longTripElevator.goToFloor(longTripPerson);

                expectEqual(shortTripElevator.floorsTraversed < longTripElevator.floorsTraversed, true, 'efficiency comparison');
            },
        },
    ];
}

export const LEVEL3_TEST_CASES: Level3TestCaseDefinition[] = [
    ...buildScenarioCases(),
    ...buildMetricCases(),
];

export function runLevel3TestCase(
    testCase: Level3TestCaseDefinition,
    dependencies: Level3SuiteDependencies,
    options: { silent?: boolean } = {}
): Level3TestCaseResult {
    return runSuiteTestCase(testCase, dependencies, options);
}

export function runLevel3Suite(
    dependencies: Level3SuiteDependencies,
    options: { silent?: boolean } = {}
): Level3SuiteResult {
    const results = LEVEL3_TEST_CASES.map(testCase => runLevel3TestCase(testCase, dependencies, options));
    const summary = buildSuiteSummary(results);
    const scenarios = buildCoverageItems(
        LEVEL3_SCENARIOS.map(scenario => scenario.title),
        results,
        result => result.category === 'scenario' ? [result.title] : []
    );

    return {
        results,
        summary,
        scenarios,
        requirements: buildRequirementStatus(LEVEL3_REQUIREMENTS, results),
    };
}
