"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const level7_suite_1 = require("../level7-suite");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
const level7Dependencies = { Elevator: elevator_1.default, Person: person_1.default };
describe('Elevator Level 7 suite', function () {
    level7_suite_1.LEVEL7_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = (0, level7_suite_1.runLevel7TestCase)(testCase, level7Dependencies, { silent: true });
            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
//# sourceMappingURL=level7_test.js.map