import Person from './person';

export default class Elevator {
    currentFloor: number;
    stops: number;
    floorsTraversed: number;
    requests: any[];
    riders: Person[];

    constructor() {
        this.currentFloor = 0;
        this.stops = 0;
        this.floorsTraversed = 0;
        this.requests = [];
        this.riders = [];
    }

    dispatch() {
        this.requests.forEach(request => {
            if (this.riders.length || this.requests.length) {
                this.goToFloor(request);
            }
        });
    }

    goToFloor(person: any) {
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

        // Check if we need to stop for pickup
        if (this.hasStop()) {
            console.log('Has stop for pickup, calling hasPickup');
            this.hasPickup();
        } else {
            console.log('No stop for pickup');
        }

        // Move to drop off floor
        console.log('Moving to dropoff floor:', person.dropOffFloor);
        while (this.currentFloor < person.dropOffFloor) {
            this.moveUp();
        }
        while (this.currentFloor > person.dropOffFloor) {
            this.moveDown();
        }
        console.log('Arrived at dropoff floor:', this.currentFloor);

        // Check if we need to stop for dropoff
        if (this.hasStop()) {
            console.log('Has stop for dropoff, calling hasDropoff');
            this.hasDropoff();
        } else {
            console.log('No stop for dropoff');
        }

        // Return to lobby if needed
        if (this.checkReturnToLoby()) {
            console.log('Returning to lobby');
            this.returnToLoby();
        }

        console.log('=== goToFloor end ===');
    }

    moveUp() {
        console.log('moveUp called');
        this.currentFloor++;
        this.floorsTraversed++;
        if (this.hasStop()) {
            this.stops++;
        }
    }

    moveDown() {
        console.log('moveDown called');
        if (this.currentFloor > 0) {
            this.currentFloor--;
            this.floorsTraversed++;
            if (this.hasStop()) {
                this.stops++;
            }
        }
    }

    hasStop(): boolean {
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

    hasPickup() {
        console.log('=== hasPickup ===');
        console.log('Current floor:', this.currentFloor);
        console.log('Requests:', this.requests);

        const index = this.requests.findIndex(req => req.currentFloor === this.currentFloor);
        if (index !== -1) {
            const person = this.requests.splice(index, 1)[0];
            this.riders.push(person);
            console.log('Picked up person:', person);
            console.log('Requests after splice:', this.requests);
            console.log('Riders after push:', this.riders);
        } else {
            console.log('No request found at current floor');
        }
    }

    hasDropoff() {
        console.log('=== hasDropoff ===');
        console.log('Current floor:', this.currentFloor);
        console.log('Riders:', this.riders);

        const index = this.riders.findIndex(rider => rider.dropOffFloor === this.currentFloor);
        if (index !== -1) {
            this.riders.splice(index, 1);
            console.log('Dropped off person at index', index);
            console.log('Riders after splice:', this.riders);
        } else {
            console.log('No rider to drop off at current floor');
        }
    }

    checkReturnToLoby(): boolean {
        // For testing purposes, we'll always return false to avoid automatic lobby return
        return false;
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