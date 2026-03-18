"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const elevator_1 = __importDefault(require("../elevator"));
const person_1 = __importDefault(require("../person"));
describe('Elevator', function () {
    let elevator = new elevator_1.default();
    beforeEach(function () {
        elevator.reset();
    });
    it('should bring a rider to a floor above their current floor', () => {
        let mockUser = new person_1.default("Brittany", 2, 5);
        elevator.requests.push(mockUser);
        elevator.goToFloor(mockUser);
        //check if the elevator automatically  returns to the loby and set the end values
        const endFloor = elevator.checkReturnToLoby() ? 0 : 5;
        const floorsTraversed = elevator.checkReturnToLoby() ? 10 : 5;
        chai_1.assert.equal(elevator.currentFloor, endFloor);
        chai_1.assert.equal(elevator.floorsTraversed, floorsTraversed);
        chai_1.assert.equal(elevator.stops, 2);
    });
});
//# sourceMappingURL=elevator_test.js.map