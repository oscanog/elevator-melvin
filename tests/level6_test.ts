import {
    LEVEL6_TEST_CASES,
    runLevel6TestCase,
} from '../level6-suite';
import Elevator from '../elevator';
import Person from '../person';

const level6Dependencies = { Elevator, Person };

describe('Elevator Level 6 suite', function () {
    LEVEL6_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = runLevel6TestCase(testCase, level6Dependencies, { silent: true });

            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
