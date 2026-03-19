import {
    LEVEL2_TEST_CASES,
    runLevel2TestCase,
} from '../level2-suite';
import Elevator from '../elevator';
import Person from '../person';

const level2Dependencies = { Elevator, Person };

describe('Elevator Level 2 suite', function () {
    describe('Scenario coverage', function () {
        LEVEL2_TEST_CASES
            .filter(testCase => testCase.category === 'scenario')
            .forEach(testCase => {
                it(testCase.title, () => {
                    const result = runLevel2TestCase(testCase, level2Dependencies, { silent: true });

                    if (!result.pass) {
                        throw new Error(result.error ?? `${testCase.title} failed`);
                    }
                });
            });
    });

    describe('Method coverage', function () {
        LEVEL2_TEST_CASES
            .filter(testCase => testCase.category === 'method')
            .forEach(testCase => {
                it(testCase.title, () => {
                    const result = runLevel2TestCase(testCase, level2Dependencies, { silent: true });

                    if (!result.pass) {
                        throw new Error(result.error ?? `${testCase.title} failed`);
                    }
                });
            });
    });
});
