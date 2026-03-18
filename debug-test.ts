console.log('=== DEBUG TEST ===');

import Elevator from './elevator';
import Person from './person';

console.log('Imports successful');

const elevator = new Elevator();
console.log('Elevator created:', elevator);

const person = new Person('Test Person', 2, 5);
console.log('Person created:', person);

elevator.requests.push(person);
console.log('Request pushed, requests:', elevator.requests);

console.log('About to call goToFloor');
elevator.goToFloor(person);
console.log('goToFloor called');