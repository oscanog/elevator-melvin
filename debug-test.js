"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('=== DEBUG TEST ===');
const elevator_1 = __importDefault(require("./elevator"));
const person_1 = __importDefault(require("./person"));
console.log('Imports successful');
const elevator = new elevator_1.default();
console.log('Elevator created:', elevator);
const person = new person_1.default('Test Person', 2, 5);
console.log('Person created:', person);
elevator.requests.push(person);
console.log('Request pushed, requests:', elevator.requests);
console.log('About to call goToFloor');
elevator.goToFloor(person);
console.log('goToFloor called');
//# sourceMappingURL=debug-test.js.map