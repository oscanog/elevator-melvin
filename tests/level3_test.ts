import {
    LEVEL3_TEST_CASES,
    runLevel3TestCase,
} from '../level3-suite';
import Elevator from '../elevator';
import Person from '../person';

const level3Dependencies = { Elevator, Person };

describe('Elevator Level 3 suite', function () {
    describe('Scenario coverage', function () {
        LEVEL3_TEST_CASES
            .filter(testCase => testCase.category === 'scenario')
            .forEach(testCase => {
                it(testCase.title, () => {
                    const result = runLevel3TestCase(testCase, level3Dependencies, { silent: true });

                    if (!result.pass) {
                        throw new Error(result.error ?? `${testCase.title} failed`);
                    }
                });
            });
    });

    describe('Metric coverage', function () {
        LEVEL3_TEST_CASES
            .filter(testCase => testCase.category === 'metric')
            .forEach(testCase => {
                it(testCase.title, () => {
                    const result = runLevel3TestCase(testCase, level3Dependencies, { silent: true });

                    if (!result.pass) {
                        throw new Error(result.error ?? `${testCase.title} failed`);
                    }
                });
            });
    });
});
