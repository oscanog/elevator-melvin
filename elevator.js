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
        this.dispatchStrategy = config.dispatchStrategy ?? 'fifo';
        this.now = config.now ?? (() => new Date());
    }
    dispatch() {
        if (this.dispatchStrategy === 'optimized') {
            this.dispatchOptimized();
        }
        else {
            this.dispatchFifo();
        }
        if (this.checkReturnToLoby()) {
            this.returnToLoby();
        }
    }
    dispatchFifo() {
        while (this.requests.length > 0) {
            this.goToFloor(this.requests[0]);
        }
    }
    dispatchOptimized() {
        this.serviceCurrentFloor();
        for (const floor of this.buildOptimizedPlan()) {
            this.moveToFloor(floor);
            this.serviceCurrentFloor();
        }
    }
    goToFloor(person) {
        this.moveToFloor(person.currentFloor);
        this.hasPickup(person);
        this.moveToFloor(person.dropOffFloor);
        this.hasDropoff(person);
    }
    moveToFloor(targetFloor) {
        while (this.currentFloor < targetFloor) {
            this.moveUp();
        }
        while (this.currentFloor > targetFloor) {
            this.moveDown();
        }
    }
    moveUp() {
        this.currentFloor++;
        this.floorsTraversed++;
    }
    moveDown() {
        if (this.currentFloor > 0) {
            this.currentFloor--;
            this.floorsTraversed++;
        }
    }
    hasStop() {
        return this.requests.some(request => request.currentFloor === this.currentFloor)
            || this.riders.some(rider => rider.dropOffFloor === this.currentFloor);
    }
    hasPickup(targetPerson) {
        const index = targetPerson
            ? this.requests.findIndex(request => request === targetPerson)
            : this.requests.findIndex(request => request.currentFloor === this.currentFloor);
        if (index !== -1 && this.requests[index].currentFloor === this.currentFloor) {
            const person = this.requests.splice(index, 1)[0];
            this.riders.push(person);
            this.stops++;
            return true;
        }
        return false;
    }
    hasDropoff(targetPerson) {
        const index = targetPerson
            ? this.riders.findIndex(rider => rider === targetPerson)
            : this.riders.findIndex(rider => rider.dropOffFloor === this.currentFloor);
        if (index !== -1 && this.riders[index].dropOffFloor === this.currentFloor) {
            this.riders.splice(index, 1);
            this.stops++;
            return true;
        }
        return false;
    }
    serviceCurrentFloor() {
        let progressed = false;
        do {
            progressed = false;
            while (this.hasDropoff()) {
                progressed = true;
            }
            while (this.hasPickup()) {
                progressed = true;
            }
        } while (progressed);
    }
    buildOptimizedPlan() {
        const people = Array.from(new Set([...this.requests, ...this.riders]));
        const items = people.map(person => ({
            person,
            pickupFloor: person.currentFloor,
            dropOffFloor: person.dropOffFloor,
            startsOnboard: this.riders.includes(person),
        }));
        const allDeliveredMask = items.length === 0 ? 0 : (1 << items.length) - 1;
        const initialPickedMask = items.reduce((mask, item, index) => (item.startsOnboard ? mask | (1 << index) : mask), 0);
        const memo = new Map();
        const normalize = (floor, pickedMask, deliveredMask) => {
            let nextPickedMask = pickedMask;
            let nextDeliveredMask = deliveredMask;
            for (let index = 0; index < items.length; index++) {
                const bit = 1 << index;
                const item = items[index];
                if ((nextPickedMask & bit) === 0 && item.pickupFloor === floor) {
                    nextPickedMask |= bit;
                }
                if ((nextPickedMask & bit) !== 0
                    && (nextDeliveredMask & bit) === 0
                    && item.dropOffFloor === floor) {
                    nextDeliveredMask |= bit;
                }
            }
            return {
                pickedMask: nextPickedMask,
                deliveredMask: nextDeliveredMask,
            };
        };
        const search = (floor, pickedMask, deliveredMask) => {
            const normalizedState = normalize(floor, pickedMask, deliveredMask);
            const key = `${floor}|${normalizedState.pickedMask}|${normalizedState.deliveredMask}`;
            const cached = memo.get(key);
            if (cached) {
                return cached;
            }
            if (normalizedState.deliveredMask === allDeliveredMask) {
                const completed = { cost: 0, stops: [] };
                memo.set(key, completed);
                return completed;
            }
            const candidateFloors = new Set();
            for (let index = 0; index < items.length; index++) {
                const bit = 1 << index;
                const item = items[index];
                if ((normalizedState.pickedMask & bit) === 0) {
                    candidateFloors.add(item.pickupFloor);
                    continue;
                }
                if ((normalizedState.deliveredMask & bit) === 0) {
                    candidateFloors.add(item.dropOffFloor);
                }
            }
            let best = null;
            for (const nextFloor of candidateFloors) {
                const tail = search(nextFloor, normalizedState.pickedMask, normalizedState.deliveredMask);
                const candidate = {
                    cost: Math.abs(nextFloor - floor) + tail.cost,
                    stops: [nextFloor, ...tail.stops],
                };
                if (best === null || candidate.cost < best.cost) {
                    best = candidate;
                }
            }
            const result = best ?? { cost: 0, stops: [] };
            memo.set(key, result);
            return result;
        };
        return search(this.currentFloor, initialPickedMask, 0).stops;
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
        this.moveToFloor(0);
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