"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createElevator = createElevator;
exports.createPerson = createPerson;
exports.snapshotElevator = snapshotElevator;
exports.formatValue = formatValue;
exports.expectEqual = expectEqual;
exports.expectSnapshot = expectSnapshot;
exports.runSuiteTestCase = runSuiteTestCase;
exports.buildCoverageItems = buildCoverageItems;
exports.buildRequirementStatus = buildRequirementStatus;
exports.buildSuiteSummary = buildSuiteSummary;
function createElevator(dependencies, config) {
    return new dependencies.Elevator(config);
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
function runSuiteTestCase(testCase, dependencies, options = {}) {
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
function buildRequirementStatus(requirements, results) {
    return requirements.reduce((status, requirement) => {
        const relevantResults = results.filter(result => result.requirementKeys.includes(requirement.key));
        status[requirement.key] = relevantResults.length > 0 && relevantResults.every(result => result.pass);
        return status;
    }, {});
}
function buildSuiteSummary(results) {
    const passed = results.filter(result => result.pass).length;
    return {
        total: results.length,
        passed,
        failed: results.length - passed,
    };
}
//# sourceMappingURL=index.js.map