import { assert } from 'chai';
import Elevator from '../elevator';
import Person from '../person';

describe('Elevator', function () {
    let elevator = new Elevator();

    beforeEach(function () {
        elevator.reset();
    });

    it('should bring a rider to a floor above their current floor', () => {
        let mockUser = new Person("Brittany", 2, 5);
        elevator.requests.push(mockUser);
        elevator.goToFloor(mockUser);

        //check if the elevator automatically  returns to the loby and set the end values
        const endFloor = elevator.checkReturnToLoby() ? 0 : 5;
        const floorsTraversed = elevator.checkReturnToLoby() ? 10 : 5;

        assert.equal(elevator.currentFloor, endFloor);
        assert.equal(elevator.floorsTraversed, floorsTraversed);
        assert.equal(elevator.stops, 2);
    });
});