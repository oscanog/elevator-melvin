"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const level6_suite_1 = require("../level6-suite");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
const level6Dependencies = { Elevator: elevator_1.default, Person: person_1.default };
describe('Elevator Level 6 suite', function () {
    level6_suite_1.LEVEL6_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = (0, level6_suite_1.runLevel6TestCase)(testCase, level6Dependencies, { silent: true });
            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
//# sourceMappingURL=level6_test.js.map