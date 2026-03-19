import {
    LEVEL4_TEST_CASES,
    runLevel4TestCase,
} from '../level4-suite';
import Elevator from '../elevator';
import Person from '../person';

const level4Dependencies = { Elevator, Person };

describe('Elevator Level 4 suite', function () {
    LEVEL4_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = runLevel4TestCase(testCase, level4Dependencies, { silent: true });

            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
