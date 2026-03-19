"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Elevator {
    constructor(config = {}) {
        this.currentFloor = 0;
        this.stops = 0;
        this.floorsTraversed = 0;
        this.requests = [];
        this.riders = [];
        this.idlePolicy = config.idlePolicy ?? 'none';
        this.now = config.now ?? (() => new Date());
    }
    dispatch() {
        while (this.requests.length > 0) {
            this.goToFloor(this.requests[0]);
        }
        if (this.checkReturnToLoby()) {
            console.log('Returning to lobby');
            this.returnToLoby();
        }
    }
    goToFloor(person) {
        console.log('!!! ENTERING goToFloor !!!');
        console.log('Person:', person);
        console.log('Current floor:', this.currentFloor);
        console.log('Requests:', this.requests);
        // Move to pick up floor
        console.log('Moving to pickup floor:', person.currentFloor);
        while (this.currentFloor < person.currentFloor) {
            console.log('Moving up from', this.currentFloor, 'to', this.currentFloor + 1);
            this.moveUp();
        }
        while (this.currentFloor > person.currentFloor) {
            console.log('Moving down from', this.currentFloor, 'to', this.currentFloor - 1);
            this.moveDown();
        }
        console.log('Arrived at pickup floor:', this.currentFloor);
        this.hasPickup(person);
        // Move to drop off floor
        console.log('Moving to dropoff floor:', person.dropOffFloor);
        while (this.currentFloor < person.dropOffFloor) {
            this.moveUp();
        }
        while (this.currentFloor > person.dropOffFloor) {
            this.moveDown();
        }
        console.log('Arrived at dropoff floor:', this.currentFloor);
        this.hasDropoff(person);
        console.log('=== goToFloor end ===');
    }
    moveUp() {
        console.log('moveUp called');
        this.currentFloor++;
        this.floorsTraversed++;
    }
    moveDown() {
        console.log('moveDown called');
        if (this.currentFloor > 0) {
            this.currentFloor--;
            this.floorsTraversed++;
        }
    }
    hasStop() {
        // Check for pickup
        let hasPickup = false;
        for (let i = 0; i < this.requests.length; i++) {
            if (this.requests[i].currentFloor === this.currentFloor) {
                hasPickup = true;
                break;
            }
        }
        // Check for dropoff
        let hasDropoff = false;
        for (let i = 0; i < this.riders.length; i++) {
            if (this.riders[i].dropOffFloor === this.currentFloor) {
                hasDropoff = true;
                break;
            }
        }
        console.log('hasStop check:', { currentFloor: this.currentFloor, hasPickup, hasDropoff, requestsLength: this.requests.length, ridersLength: this.riders.length });
        return hasPickup || hasDropoff;
    }
    hasPickup(targetPerson) {
        console.log('=== hasPickup ===');
        console.log('Current floor:', this.currentFloor);
        console.log('Requests:', this.requests);
        const index = targetPerson
            ? this.requests.findIndex(req => req === targetPerson)
            : this.requests.findIndex(req => req.currentFloor === this.currentFloor);
        if (index !== -1 && this.requests[index].currentFloor === this.currentFloor) {
            const person = this.requests.splice(index, 1)[0];
            this.riders.push(person);
            this.stops++;
            console.log('Picked up person:', person);
            console.log('Requests after splice:', this.requests);
            console.log('Riders after push:', this.riders);
        }
        else {
            console.log('No request found at current floor');
        }
    }
    hasDropoff(targetPerson) {
        console.log('=== hasDropoff ===');
        console.log('Current floor:', this.currentFloor);
        console.log('Riders:', this.riders);
        const index = targetPerson
            ? this.riders.findIndex(rider => rider === targetPerson)
            : this.riders.findIndex(rider => rider.dropOffFloor === this.currentFloor);
        if (index !== -1 && this.riders[index].dropOffFloor === this.currentFloor) {
            this.riders.splice(index, 1);
            this.stops++;
            console.log('Dropped off person at index', index);
            console.log('Riders after splice:', this.riders);
        }
        else {
            console.log('No rider to drop off at current floor');
        }
    }
    checkReturnToLoby() {
        if (this.idlePolicy !== 'time-based') {
            return false;
        }
        if (this.riders.length > 0 || this.requests.length > 0) {
            return false;
        }
        return this.now().getHours() < 12;
    }
    returnToLoby() {
        while (this.currentFloor > 0) {
            this.moveDown();
        }
    }
    reset() {
        this.currentFloor = 0;
        this.stops = 0;
        this.floorsTraversed = 0;
        this.riders = [];
        this.requests = [];
    }
}
exports.default = Elevator;
//# sourceMappingURL=elevator.js.map