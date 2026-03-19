import {
    LEVEL7_TEST_CASES,
    runLevel7TestCase,
} from '../level7-suite';
import Elevator from '../elevator';
import Person from '../person';

const level7Dependencies = { Elevator, Person };

describe('Elevator Level 7 suite', function () {
    LEVEL7_TEST_CASES.forEach(testCase => {
        it(testCase.title, () => {
            const result = runLevel7TestCase(testCase, level7Dependencies, { silent: true });

            if (!result.pass) {
                throw new Error(result.error ?? `${testCase.title} failed`);
            }
        });
    });
});
