export interface SuitePersonLike {
    name: string;
    currentFloor: number;
    dropOffFloor: number;
}

export interface SuiteElevatorConfig {
    idlePolicy?: 'none' | 'time-based';
    dispatchStrategy?: 'fifo' | 'optimized';
    now?: () => Date;
}

export interface SuiteElevatorLike {
    currentFloor: number;
    stops: number;
    floorsTraversed: number;
    requests: SuitePersonLike[];
    riders: SuitePersonLike[];
    dispatch: () => void;
    goToFloor: (person: SuitePersonLike) => void;
    moveUp: () => void;
    moveDown: () => void;
    hasStop: () => boolean;
    hasPickup: () => void;
    hasDropoff: () => void;
    checkReturnToLoby: () => boolean;
    returnToLoby: () => void;
    reset: () => void;
}

export interface SuiteDependencies {
    Elevator: new (config?: SuiteElevatorConfig) => SuiteElevatorLike;
    Person: new (name: string, currentFloor: number, dropOffFloor: number) => SuitePersonLike;
}

export interface ElevatorSnapshot {
    currentFloor: number;
    stops: number;
    floorsTraversed: number;
    requestsCount: number;
    ridersCount: number;
}

export interface SuiteConsoleEntry {
    level: 'log' | 'warn' | 'error';
    text: string;
}

export interface SuiteCoverageItem {
    name: string;
    pass: boolean;
}

export interface SuiteSummary {
    total: number;
    passed: number;
    failed: number;
}

export interface SuiteRequirementDefinition<RequirementKey extends string> {
    key: RequirementKey;
    label: string;
}

export interface SuiteTestCaseDefinition<Category extends string, RequirementKey extends string> {
    id: string;
    title: string;
    category: Category;
    coveredMethods: string[];
    requirementKeys: RequirementKey[];
    run: (dependencies: SuiteDependencies) => void;
}

export interface SuiteTestCaseResult<Category extends string, RequirementKey extends string> {
    id: string;
    title: string;
    category: Category;
    coveredMethods: string[];
    requirementKeys: RequirementKey[];
    pass: boolean;
    durationMs: number;
    logs: SuiteConsoleEntry[];
    error: string | null;
}

export function createElevator(
    dependencies: SuiteDependencies,
    config?: SuiteElevatorConfig
): SuiteElevatorLike {
    return new dependencies.Elevator(config);
}

export function createPerson(
    dependencies: SuiteDependencies,
    name: string,
    currentFloor: number,
    dropOffFloor: number
): SuitePersonLike {
    return new dependencies.Person(name, currentFloor, dropOffFloor);
}

export function snapshotElevator(elevator: SuiteElevatorLike): ElevatorSnapshot {
    return {
        currentFloor: elevator.currentFloor,
        stops: elevator.stops,
        floorsTraversed: elevator.floorsTraversed,
        requestsCount: elevator.requests.length,
        ridersCount: elevator.riders.length,
    };
}

export function formatValue(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }

    if (value instanceof Error) {
        return value.message;
    }

    try {
        return JSON.stringify(value);
    } catch (_error) {
        return String(value);
    }
}

export function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (actual !== expected) {
        throw new Error(`${label}: expected ${formatValue(expected)} but received ${formatValue(actual)}`);
    }
}

export function expectSnapshot(elevator: SuiteElevatorLike, expected: ElevatorSnapshot, label: string): void {
    const actual = snapshotElevator(elevator);

    expectEqual(actual.currentFloor, expected.currentFloor, `${label} currentFloor`);
    expectEqual(actual.stops, expected.stops, `${label} stops`);
    expectEqual(actual.floorsTraversed, expected.floorsTraversed, `${label} floorsTraversed`);
    expectEqual(actual.requestsCount, expected.requestsCount, `${label} requestsCount`);
    expectEqual(actual.ridersCount, expected.ridersCount, `${label} ridersCount`);
}

export function runSuiteTestCase<Category extends string, RequirementKey extends string>(
    testCase: SuiteTestCaseDefinition<Category, RequirementKey>,
    dependencies: SuiteDependencies,
    options: { silent?: boolean } = {}
): SuiteTestCaseResult<Category, RequirementKey> {
    const silent = options.silent ?? true;
    const logs: SuiteConsoleEntry[] = [];
    const consoleMethods: Array<'log' | 'warn' | 'error'> = ['log', 'warn', 'error'];
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };

    const record = (level: 'log' | 'warn' | 'error', values: unknown[]): void => {
        logs.push({
            level,
            text: values.map(formatValue).join(' '),
        });
    };

    for (const methodName of consoleMethods) {
        console[methodName] = (...values: unknown[]) => {
            record(methodName, values);
            if (!silent) {
                originalConsole[methodName](...values);
            }
        };
    }

    const startedAt = Date.now();
    let error: string | null = null;

    try {
        testCase.run(dependencies);
    } catch (caughtError) {
        error = caughtError instanceof Error ? caughtError.message : String(caughtError);
    } finally {
        console.log = originalConsole.log;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
    }

    return {
        id: testCase.id,
        title: testCase.title,
        category: testCase.category,
        coveredMethods: [...testCase.coveredMethods],
        requirementKeys: [...testCase.requirementKeys],
        pass: error === null,
        durationMs: Date.now() - startedAt,
        logs,
        error,
    };
}

export function buildCoverageItems<Category extends string, RequirementKey extends string>(
    names: readonly string[],
    results: Array<SuiteTestCaseResult<Category, RequirementKey>>,
    selector: (result: SuiteTestCaseResult<Category, RequirementKey>) => string[]
): SuiteCoverageItem[] {
    return names.map(name => {
        const relevantResults = results.filter(result => selector(result).includes(name));
        return {
            name,
            pass: relevantResults.length > 0 && relevantResults.every(result => result.pass),
        };
    });
}

export function buildRequirementStatus<Category extends string, RequirementKey extends string>(
    requirements: Array<SuiteRequirementDefinition<RequirementKey>>,
    results: Array<SuiteTestCaseResult<Category, RequirementKey>>
): Record<RequirementKey, boolean> {
    return requirements.reduce((status, requirement) => {
        const relevantResults = results.filter(result => result.requirementKeys.includes(requirement.key));
        status[requirement.key] = relevantResults.length > 0 && relevantResults.every(result => result.pass);
        return status;
    }, {} as Record<RequirementKey, boolean>);
}

export function buildSuiteSummary<Category extends string, RequirementKey extends string>(
    results: Array<SuiteTestCaseResult<Category, RequirementKey>>
): SuiteSummary {
    const passed = results.filter(result => result.pass).length;
    return {
        total: results.length,
        passed,
        failed: results.length - passed,
    };
}
