"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const level4_suite_1 = require("../level4-suite");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
const level4Dependencies = { Elevator: elevator_1.default, Person: person_1.default };
describe('Elevator Level 4 suite', function () {
    level4_suite_1.LEVEL4_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = (0, level4_suite_1.runLevel4TestCase)(testCase, level4Dependencies, { silent: true });
            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
//# sourceMappingURL=level4_test.js.map