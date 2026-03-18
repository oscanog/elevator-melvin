"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elevator_1 = __importDefault(require("./elevator"));
const person_1 = __importDefault(require("./person"));
console.log('=== Elevator Test Script ===');
// Create elevator instance
const elevator = new elevator_1.default();
console.log(`Initial floor: ${elevator.currentFloor}`);
console.log(`Stops: ${elevator.stops}`);
console.log(`Floors traversed: ${elevator.floorsTraversed}`);
// Create person and add to requests
const person = new person_1.default('Test Person', 2, 5);
elevator.requests.push(person);
console.log(`\nRequest added: ${person.name} from floor ${person.currentFloor} to ${person.dropOffFloor}`);
// Call goToFloor
console.log('\n=== Calling goToFloor ===');
try {
    elevator.goToFloor(person);
    console.log('goToFloor completed successfully');
}
catch (error) {
    console.error('Error in goToFloor:', error);
}
// Check results
console.log(`\nFinal floor: ${elevator.currentFloor}`);
console.log(`Floors traversed: ${elevator.floorsTraversed}`);
console.log(`Stops: ${elevator.stops}`);
console.log('Requests:', elevator.requests);
console.log('Riders:', elevator.riders);
//# sourceMappingURL=test-script.js.map