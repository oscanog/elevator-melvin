import Person from './person';

export type ElevatorIdlePolicy = 'none' | 'time-based';
export type ElevatorDispatchStrategy = 'fifo' | 'optimized';

export interface ElevatorConfig {
    idlePolicy?: ElevatorIdlePolicy;
    dispatchStrategy?: ElevatorDispatchStrategy;
    now?: () => Date;
}

interface OptimizedDispatchItem {
    person: Person;
    pickupFloor: number;
    dropOffFloor: number;
    startsOnboard: boolean;
}

interface OptimizedSearchResult {
    cost: number;
    stops: number[];
}

export default class Elevator {
    currentFloor: number;
    stops: number;
    floorsTraversed: number;
    requests: Person[];
    riders: Person[];
    idlePolicy: ElevatorIdlePolicy;
    dispatchStrategy: ElevatorDispatchStrategy;
    now: () => Date;

    constructor(config: ElevatorConfig = {}) {
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
        } else {
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

    goToFloor(person: Person) {
        this.moveToFloor(person.currentFloor);
        this.hasPickup(person);
        this.moveToFloor(person.dropOffFloor);
        this.hasDropoff(person);
    }

    moveToFloor(targetFloor: number) {
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

    hasStop(): boolean {
        return this.requests.some(request => request.currentFloor === this.currentFloor)
            || this.riders.some(rider => rider.dropOffFloor === this.currentFloor);
    }

    hasPickup(targetPerson?: Person): boolean {
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

    hasDropoff(targetPerson?: Person): boolean {
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

    buildOptimizedPlan(): number[] {
        const people = Array.from(new Set([...this.requests, ...this.riders]));
        const items: OptimizedDispatchItem[] = people.map(person => ({
            person,
            pickupFloor: person.currentFloor,
            dropOffFloor: person.dropOffFloor,
            startsOnboard: this.riders.includes(person),
        }));
        const allDeliveredMask = items.length === 0 ? 0 : (1 << items.length) - 1;
        const initialPickedMask = items.reduce((mask, item, index) => (
            item.startsOnboard ? mask | (1 << index) : mask
        ), 0);
        const memo = new Map<string, OptimizedSearchResult>();

        const normalize = (floor: number, pickedMask: number, deliveredMask: number) => {
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

        const search = (floor: number, pickedMask: number, deliveredMask: number): OptimizedSearchResult => {
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

            const candidateFloors = new Set<number>();

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

            let best: OptimizedSearchResult | null = null;

            for (const nextFloor of candidateFloors) {
                const tail = search(
                    nextFloor,
                    normalizedState.pickedMask,
                    normalizedState.deliveredMask
                );
                const candidate: OptimizedSearchResult = {
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

    checkReturnToLoby(): boolean {
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
