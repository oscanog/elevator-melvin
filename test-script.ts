import Elevator from './elevator';
import Person from './person';

console.log('=== Elevator Test Script ===');

// Create elevator instance
const elevator = new Elevator();
console.log(`Initial floor: ${elevator.currentFloor}`);
console.log(`Stops: ${elevator.stops}`);
console.log(`Floors traversed: ${elevator.floorsTraversed}`);

// Create person and add to requests
const person = new Person('Test Person', 2, 5);
elevator.requests.push(person);
console.log(`\nRequest added: ${person.name} from floor ${person.currentFloor} to ${person.dropOffFloor}`);

// Call goToFloor
console.log('\n=== Calling goToFloor ===');
try {
    elevator.goToFloor(person);
    console.log('goToFloor completed successfully');
} catch (error) {
    console.error('Error in goToFloor:', error);
}

// Check results
console.log(`\nFinal floor: ${elevator.currentFloor}`);
console.log(`Floors traversed: ${elevator.floorsTraversed}`);
console.log(`Stops: ${elevator.stops}`);
console.log('Requests:', elevator.requests);
console.log('Riders:', elevator.riders);