"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL2_TEST_CASES = exports.LEVEL2_SCENARIOS = exports.LEVEL2_ELEVATOR_METHODS = exports.LEVEL2_REQUIREMENTS = void 0;
exports.runLevel2TestCase = runLevel2TestCase;
exports.runLevel2Suite = runLevel2Suite;
exports.LEVEL2_REQUIREMENTS = [
    { key: 'scenario-up', label: 'Person A goes up.' },
    { key: 'scenario-down', label: 'Person A goes down.' },
    { key: 'metrics', label: 'Both tests should assert total number of stops and floors the elevator traversed.' },
    { key: 'methods', label: 'There should also be a unit test for every Elevator method.' },
];
exports.LEVEL2_ELEVATOR_METHODS = [
    'constructor',
    'dispatch',
    'goToFloor',
    'moveUp',
    'moveDown',
    'hasStop',
    'hasPickup',
    'hasDropoff',
    'checkReturnToLoby',
    'returnToLoby',
    'reset',
];
exports.LEVEL2_SCENARIOS = [
    {
        id: 'person-a-up',
        title: 'Person A goes up',
        person: { name: 'Alice', currentFloor: 2, dropOffFloor: 7 },
        expected: { currentFloor: 7, stops: 2, floorsTraversed: 7, requestsCount: 0, ridersCount: 0 },
    },
    {
        id: 'person-a-down',
        title: 'Person A goes down',
        person: { name: 'Person A', currentFloor: 8, dropOffFloor: 3 },
        expected: { currentFloor: 3, stops: 2, floorsTraversed: 13, requestsCount: 0, ridersCount: 0 },
    },
];
function createElevator(dependencies) {
    return new dependencies.Elevator();
}
function createPerson(dependencies, name, currentFloor, dropOffFloor) {
    return new dependencies.Person(name, currentFloor, dropOffFloor);
}
function snapshotElevator(elevator) {
    return {
        currentFloor: elevator.currentFloor,
        stops: elevator.stops,
        floorsTraversed: elevator.floorsTraversed,
        requestsCount: elevator.requests.length,
        ridersCount: elevator.riders.length,
    };
}
function formatValue(value) {
    if (typeof value === 'string') {
        return value;
    }
    if (value instanceof Error) {
        return value.message;
    }
    try {
        return JSON.stringify(value);
    }
    catch (_error) {
        return String(value);
    }
}
function expectEqual(actual, expected, label) {
    if (actual !== expected) {
        throw new Error(`${label}: expected ${formatValue(expected)} but received ${formatValue(actual)}`);
    }
}
function expectSnapshot(elevator, expected, label) {
    const actual = snapshotElevator(elevator);
    expectEqual(actual.currentFloor, expected.currentFloor, `${label} currentFloor`);
    expectEqual(actual.stops, expected.stops, `${label} stops`);
    expectEqual(actual.floorsTraversed, expected.floorsTraversed, `${label} floorsTraversed`);
    expectEqual(actual.requestsCount, expected.requestsCount, `${label} requestsCount`);
    expectEqual(actual.ridersCount, expected.ridersCount, `${label} ridersCount`);
}
function runScenario(dependencies, personName, currentFloor, dropOffFloor, expected) {
    const elevator = createElevator(dependencies);
    const person = createPerson(dependencies, personName, currentFloor, dropOffFloor);
    elevator.requests.push(person);
    elevator.goToFloor(person);
    expectSnapshot(elevator, expected, `Scenario ${personName}`);
}
function buildScenarioCases() {
    return exports.LEVEL2_SCENARIOS.map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        category: 'scenario',
        coveredMethods: ['goToFloor'],
        requirementKeys: [
            scenario.id === 'person-a-up' ? 'scenario-up' : 'scenario-down',
            'metrics',
            'methods',
        ],
        run: dependencies => runScenario(dependencies, scenario.person.name, scenario.person.currentFloor, scenario.person.dropOffFloor, scenario.expected),
    }));
}
function buildMethodCases() {
    return [
        {
            id: 'constructor-initial-state',
            title: 'constructor initializes the elevator state',
            category: 'method',
            coveredMethods: ['constructor'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                expectSnapshot(elevator, {
                    currentFloor: 0,
                    stops: 0,
                    floorsTraversed: 0,
                    requestsCount: 0,
                    ridersCount: 0,
                }, 'Constructor');
            },
        },
        {
            id: 'dispatch-processes-the-first-queued-request',
            title: 'dispatch processes the first queued request with the current implementation',
            category: 'method',
            coveredMethods: ['dispatch'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                const first = createPerson(dependencies, 'Alice', 2, 7);
                const second = createPerson(dependencies, 'Bob', 8, 3);
                elevator.requests = [first, second];
                elevator.dispatch();
                expectSnapshot(elevator, {
                    currentFloor: 7,
                    stops: 2,
                    floorsTraversed: 7,
                    requestsCount: 1,
                    ridersCount: 0,
                }, 'Dispatch');
                expectEqual(elevator.requests[0]?.name, 'Bob', 'Dispatch leaves the second request queued');
            },
        },
        {
            id: 'move-up-advances-one-floor',
            title: 'moveUp advances the elevator one floor',
            category: 'method',
            coveredMethods: ['moveUp'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                elevator.moveUp();
                expectSnapshot(elevator, {
                    currentFloor: 1,
                    stops: 0,
                    floorsTraversed: 1,
                    requestsCount: 0,
                    ridersCount: 0,
                }, 'moveUp');
            },
        },
        {
            id: 'move-down-stops-at-lobby',
            title: 'moveDown decreases one floor and never goes below the lobby',
            category: 'method',
            coveredMethods: ['moveDown'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                elevator.currentFloor = 1;
                elevator.moveDown();
                expectEqual(elevator.currentFloor, 0, 'moveDown currentFloor after moving');
                expectEqual(elevator.floorsTraversed, 1, 'moveDown floorsTraversed after moving');
                elevator.moveDown();
                expectEqual(elevator.currentFloor, 0, 'moveDown lobby floor guard');
                expectEqual(elevator.floorsTraversed, 1, 'moveDown floorsTraversed lobby guard');
            },
        },
        {
            id: 'has-stop-detects-pickups-and-dropoffs',
            title: 'hasStop detects a pickup or dropoff on the current floor',
            category: 'method',
            coveredMethods: ['hasStop'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                const pickup = createPerson(dependencies, 'Anne', 4, 6);
                const rider = createPerson(dependencies, 'Chris', 1, 4);
                elevator.currentFloor = 4;
                elevator.requests.push(pickup);
                expectEqual(elevator.hasStop(), true, 'hasStop pickup detection');
                elevator.requests = [];
                elevator.riders.push(rider);
                expectEqual(elevator.hasStop(), true, 'hasStop dropoff detection');
            },
        },
        {
            id: 'has-pickup-moves-request-into-riders',
            title: 'hasPickup moves a request into the riders collection',
            category: 'method',
            coveredMethods: ['hasPickup'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                const request = createPerson(dependencies, 'Anne', 3, 1);
                elevator.requests.push(request);
                elevator.currentFloor = 3;
                elevator.hasPickup();
                expectEqual(elevator.requests.length, 0, 'hasPickup requests length');
                expectEqual(elevator.riders[0], request, 'hasPickup riders entry');
            },
        },
        {
            id: 'has-dropoff-removes-rider-on-current-floor',
            title: 'hasDropoff removes a rider when the elevator reaches the drop-off floor',
            category: 'method',
            coveredMethods: ['hasDropoff'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                const rider = createPerson(dependencies, 'Anne', 1, 3);
                elevator.riders.push(rider);
                elevator.currentFloor = 3;
                elevator.hasDropoff();
                expectEqual(elevator.riders.length, 0, 'hasDropoff riders length');
            },
        },
        {
            id: 'check-return-to-loby-stays-false',
            title: 'checkReturnToLoby returns false for the current Level 1 and 2 behavior',
            category: 'method',
            coveredMethods: ['checkReturnToLoby'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                expectEqual(elevator.checkReturnToLoby(), false, 'checkReturnToLoby');
            },
        },
        {
            id: 'return-to-loby-brings-the-elevator-back-to-zero',
            title: 'returnToLoby brings the elevator back to the lobby',
            category: 'method',
            coveredMethods: ['returnToLoby'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                elevator.currentFloor = 4;
                elevator.returnToLoby();
                expectEqual(elevator.currentFloor, 0, 'returnToLoby currentFloor');
                expectEqual(elevator.floorsTraversed, 4, 'returnToLoby floorsTraversed');
            },
        },
        {
            id: 'reset-clears-the-elevator-state',
            title: 'reset clears the elevator state back to its defaults',
            category: 'method',
            coveredMethods: ['reset'],
            requirementKeys: ['methods'],
            run: dependencies => {
                const elevator = createElevator(dependencies);
                const rider = createPerson(dependencies, 'Dana', 2, 6);
                elevator.currentFloor = 6;
                elevator.stops = 3;
                elevator.floorsTraversed = 9;
                elevator.requests.push(rider);
                elevator.riders.push(rider);
                elevator.reset();
                expectSnapshot(elevator, {
                    currentFloor: 0,
                    stops: 0,
                    floorsTraversed: 0,
                    requestsCount: 0,
                    ridersCount: 0,
                }, 'reset');
            },
        },
    ];
}
exports.LEVEL2_TEST_CASES = [
    ...buildScenarioCases(),
    ...buildMethodCases(),
];
function runLevel2TestCase(testCase, dependencies, options = {}) {
    const silent = options.silent ?? true;
    const logs = [];
    const consoleMethods = ['log', 'warn', 'error'];
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };
    const record = (level, values) => {
        logs.push({
            level,
            text: values.map(formatValue).join(' '),
        });
    };
    for (const methodName of consoleMethods) {
        console[methodName] = (...values) => {
            record(methodName, values);
            if (!silent) {
                originalConsole[methodName](...values);
            }
        };
    }
    const startedAt = Date.now();
    let error = null;
    try {
        testCase.run(dependencies);
    }
    catch (caughtError) {
        error = caughtError instanceof Error ? caughtError.message : String(caughtError);
    }
    finally {
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
function buildCoverageItems(names, results, selector) {
    return names.map(name => {
        const relevantResults = results.filter(result => selector(result).includes(name));
        return {
            name,
            pass: relevantResults.length > 0 && relevantResults.every(result => result.pass),
        };
    });
}
function buildRequirementStatus(results, methods) {
    const byId = new Map(results.map(result => [result.id, result]));
    return {
        'scenario-up': byId.get('person-a-up')?.pass ?? false,
        'scenario-down': byId.get('person-a-down')?.pass ?? false,
        'metrics': ['person-a-up', 'person-a-down'].every(id => byId.get(id)?.pass),
        'methods': methods.every(method => method.pass),
    };
}
function runLevel2Suite(dependencies, options = {}) {
    const results = exports.LEVEL2_TEST_CASES.map(testCase => runLevel2TestCase(testCase, dependencies, options));
    const passed = results.filter(result => result.pass).length;
    const failed = results.length - passed;
    const scenarios = buildCoverageItems(exports.LEVEL2_SCENARIOS.map(scenario => scenario.title), results, result => result.category === 'scenario' ? [result.title] : []);
    const methods = buildCoverageItems(exports.LEVEL2_ELEVATOR_METHODS, results, result => result.coveredMethods);
    return {
        results,
        summary: {
            total: results.length,
            passed,
            failed,
        },
        scenarios,
        methods,
        requirements: buildRequirementStatus(results, methods),
    };
}
//# sourceMappingURL=level2-suite.js.map