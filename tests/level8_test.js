"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const level8_suite_1 = require("../level8-suite");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
const level8Dependencies = { Elevator: elevator_1.default, Person: person_1.default };
describe('Elevator Level 8 suite', function () {
    level8_suite_1.LEVEL8_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = (0, level8_suite_1.runLevel8TestCase)(testCase, level8Dependencies, { silent: true });
            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
//# sourceMappingURL=level8_test.js.map