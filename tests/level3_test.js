"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const level3_suite_1 = require("../level3-suite");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
const level3Dependencies = { Elevator: elevator_1.default, Person: person_1.default };
describe('Elevator Level 3 suite', function () {
    describe('Scenario coverage', function () {
        level3_suite_1.LEVEL3_TEST_CASES
            .filter(testCase => testCase.category === 'scenario')
            .forEach(testCase => {
            it(testCase.title, () => {
                const result = (0, level3_suite_1.runLevel3TestCase)(testCase, level3Dependencies, { silent: true });
                if (!result.pass) {
                    throw new Error(result.error ?? `${testCase.title} failed`);
                }
            });
        });
    });
    describe('Metric coverage', function () {
        level3_suite_1.LEVEL3_TEST_CASES
            .filter(testCase => testCase.category === 'metric')
            .forEach(testCase => {
            it(testCase.title, () => {
                const result = (0, level3_suite_1.runLevel3TestCase)(testCase, level3Dependencies, { silent: true });
                if (!result.pass) {
                    throw new Error(result.error ?? `${testCase.title} failed`);
                }
            });
        });
    });
});
//# sourceMappingURL=level3_test.js.map