import {
    LEVEL8_TEST_CASES,
    runLevel8TestCase,
} from '../level8-suite';
import Elevator from '../elevator';
import Person from '../person';

const level8Dependencies = { Elevator, Person };

describe('Elevator Level 8 suite', function () {
    LEVEL8_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = runLevel8TestCase(testCase, level8Dependencies, { silent: true });

            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
