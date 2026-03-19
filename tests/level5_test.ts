import {
    LEVEL5_TEST_CASES,
    runLevel5TestCase,
} from '../level5-suite';
import Elevator from '../elevator';
import Person from '../person';

const level5Dependencies = { Elevator, Person };

describe('Elevator Level 5 suite', function () {
    LEVEL5_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = runLevel5TestCase(testCase, level5Dependencies, { silent: true });

            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
