"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const level2_suite_1 = require("../level2-suite");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
const level2Dependencies = { Elevator: elevator_1.default, Person: person_1.default };
describe('Elevator Level 2 suite', function () {
    describe('Scenario coverage', function () {
        level2_suite_1.LEVEL2_TEST_CASES
            .filter(testCase => testCase.category === 'scenario')
            .forEach(testCase => {
            it(testCase.title, () => {
                const result = (0, level2_suite_1.runLevel2TestCase)(testCase, level2Dependencies, { silent: true });
                if (!result.pass) {
                    throw new Error(result.error ?? `${testCase.title} failed`);
                }
            });
        });
    });
    describe('Method coverage', function () {
        level2_suite_1.LEVEL2_TEST_CASES
            .filter(testCase => testCase.category === 'method')
            .forEach(testCase => {
            it(testCase.title, () => {
                const result = (0, level2_suite_1.runLevel2TestCase)(testCase, level2Dependencies, { silent: true });
                if (!result.pass) {
                    throw new Error(result.error ?? `${testCase.title} failed`);
                }
            });
        });
    });
});
//# sourceMappingURL=elevator_test.js.map