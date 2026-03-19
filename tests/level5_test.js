"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const level5_suite_1 = require("../level5-suite");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
const level5Dependencies = { Elevator: elevator_1.default, Person: person_1.default };
describe('Elevator Level 5 suite', function () {
    level5_suite_1.LEVEL5_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = (0, level5_suite_1.runLevel5TestCase)(testCase, level5Dependencies, { silent: true });
            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
//# sourceMappingURL=level5_test.js.map