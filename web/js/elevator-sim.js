/* ========================================
   Elevator Simulator Engine v3 (Module)
   ======================================== */

export const PERSON_COLORS = [
  '#f59e0b', '#ef4444', '#22c55e', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

export class ElevatorSim {
  constructor(totalFloors = 10, options = {}) {
    this.totalFloors = totalFloors;
    this.idlePolicy = options.idlePolicy ?? 'none';
    this.dispatchStrategy = options.dispatchStrategy ?? 'fifo';
    this.now = options.now ?? (() => new Date());
    this.currentFloor = 0;
    this.requests = [];
    this.riders = [];
    this.stops = 0;
    this.floorsTraversed = 0;
    this.state = 'idle';
    this.direction = null;
    this.doorsOpen = false;
    this.log = [];
    this.onUpdate = null;
    this.speed = 1;
    this._running = false;
    this._paused = false;
    this._pauseResolve = null;
    this._colorIndex = 0;
    this._allPersons = [];
    this.stepMode = false;
    this._stepResolve = null;
    this._atCheckpoint = false;
    this._checkpointWaiters = [];
    this._logSequence = 0;
    this._stateBeforePause = null;
  }

  get baseDelay() {
    return [600, 300, 120][this.speed - 1] || 600;
  }

  setSpeed(s) {
    this.speed = Math.max(1, Math.min(3, s));
    this._notify();
  }

  pause() {
    if (this._running && !this._paused) {
      this._stateBeforePause = this.state;
      this._paused = true;
      this.state = 'paused';
      this._notify();
    }
  }

  resume() {
    if (!this._paused) return;

    this._paused = false;
    if (this._stateBeforePause) {
      this.state = this._stateBeforePause;
      this._stateBeforePause = null;
    }
    if (this._pauseResolve) {
      this._pauseResolve();
      this._pauseResolve = null;
    }
    this._notify();
  }

  addPerson(name, currentFloor, dropOffFloor) {
    const color = PERSON_COLORS[this._colorIndex % PERSON_COLORS.length];
    this._colorIndex++;

    const person = {
      id: Date.now() + Math.random(),
      name,
      currentFloor,
      dropOffFloor,
      color,
      colorIndex: (this._colorIndex - 1) % PERSON_COLORS.length,
      status: 'waiting',
    };

    this.requests.push(person);
    this._allPersons.push(person);
    this._addLog(`[request] ${name}: Floor ${currentFloor} -> ${dropOffFloor}`);
    this._notify();
    return person;
  }

  async run() {
    if (this._running) return;

    this._running = true;
    this._paused = false;

    this._addLog('[start] Simulation started');
    this._notify();
    await this._checkpoint();

    if (this.dispatchStrategy === 'optimized') {
      await this._runOptimized();
    } else {
      await this._runFifo();
    }

    if (this._shouldReturnToLobby()) {
      this._addLog('[idle] Before noon and idle - returning to lobby');
      this._notify();
      await this._checkpoint();
      await this._moveTo(0);
    } else if (this.idlePolicy === 'time-based' && this.riders.length === 0 && this.requests.length === 0) {
      this._addLog(`[idle] After noon and idle - staying on Floor ${this.currentFloor}`);
      this._notify();
      await this._checkpoint();
    }

    this.state = 'complete';
    this.direction = null;
    this._addLog('[done] All requests complete - elevator idle');
    this._notify();
    this._running = false;
  }

  async _runFifo() {
    while (this.requests.length > 0) {
      const person = this.requests[0];

      await this._moveTo(person.currentFloor);
      await this._openDoors();
      await this._pickupPerson(person);
      await this._closeDoors();

      await this._moveTo(person.dropOffFloor);
      await this._openDoors();
      await this._dropoffPerson(person);
      await this._closeDoors();
    }
  }

  async _runOptimized() {
    if (this._hasPendingActionsAtCurrentFloor()) {
      await this._openDoors();
      await this._serviceCurrentFloor();
      await this._closeDoors();
    }

    const plan = this._buildOptimizedPlan();

    for (const floor of plan) {
      await this._moveTo(floor);
      await this._openDoors();
      await this._serviceCurrentFloor();
      await this._closeDoors();
    }
  }

  reset() {
    this._running = false;
    this._paused = false;

    if (this._pauseResolve) {
      this._pauseResolve();
      this._pauseResolve = null;
    }

    if (this._stepResolve) {
      const resolve = this._stepResolve;
      this._stepResolve = null;
      resolve();
    }

    this.currentFloor = 0;
    this.requests = [];
    this.riders = [];
    this.stops = 0;
    this.floorsTraversed = 0;
    this.state = 'idle';
    this.direction = null;
    this.doorsOpen = false;
    this.log = [];
    this._colorIndex = 0;
    this._allPersons = [];
    this._atCheckpoint = false;
    this._checkpointWaiters = [];
    this._logSequence = 0;
    this._stateBeforePause = null;
    this._addLog('[reset] Elevator reset to lobby');
    this._notify();
  }

  async _moveTo(floor) {
    if (floor === this.currentFloor) return;

    const dir = floor > this.currentFloor ? 'up' : 'down';
    this.direction = dir;
    this.state = dir === 'up' ? 'moving-up' : 'moving-down';
    this._addLog(`[move] Moving ${dir} to Floor ${floor}`);
    this._notify();
    await this._checkpoint();

    while (this.currentFloor !== floor) {
      await this._wait(this.baseDelay);
      this.currentFloor += dir === 'up' ? 1 : -1;
      this.floorsTraversed++;
      this._notify();
    }

    this.state = 'idle';
    this.direction = null;
  }

  async _openDoors() {
    this.doorsOpen = true;
    this.state = 'doors-open';
    this._notify();
    await this._wait(this.baseDelay * 0.6);
  }

  async _closeDoors() {
    this.doorsOpen = false;
    this.state = 'idle';
    this._notify();
    await this._wait(this.baseDelay * 0.4);
  }

  _shouldReturnToLobby() {
    if (this.idlePolicy !== 'time-based') return false;
    if (this.riders.length > 0 || this.requests.length > 0) return false;
    return this.now().getHours() < 12;
  }

  _hasPendingActionsAtCurrentFloor() {
    return this.requests.some(person => person.currentFloor === this.currentFloor)
      || this.riders.some(person => person.dropOffFloor === this.currentFloor);
  }

  async _serviceCurrentFloor() {
    let progressed = false;

    do {
      progressed = false;

      while (true) {
        const rider = this.riders.find(person => person.dropOffFloor === this.currentFloor);
        if (!rider) break;
        await this._dropoffPerson(rider);
        progressed = true;
      }

      while (true) {
        const person = this.requests.find(candidate => candidate.currentFloor === this.currentFloor);
        if (!person) break;
        await this._pickupPerson(person);
        progressed = true;
      }
    } while (progressed);
  }

  async _pickupPerson(person) {
    person.status = 'walking-to-elevator';
    this._addLog(`[pickup] ${person.name} walking to elevator on Floor ${person.currentFloor}`);
    this._notify();
    await this._checkpoint();
    await this._wait(this.baseDelay * 0.8);

    const requestIndex = this.requests.indexOf(person);
    if (requestIndex !== -1) {
      this.requests.splice(requestIndex, 1);
    }

    person.status = 'riding';
    this.riders.push(person);
    this.stops++;
    this._addLog(`[board] ${person.name} boarded the elevator`);
    this._notify();
    await this._checkpoint();
    await this._wait(this.baseDelay * 0.5);
  }

  async _dropoffPerson(person) {
    person.status = 'walking-out';
    const riderIndex = this.riders.indexOf(person);
    if (riderIndex !== -1) {
      this.riders.splice(riderIndex, 1);
    }

    this.stops++;
    this._addLog(`[dropoff] ${person.name} exiting on Floor ${person.dropOffFloor}`);
    this._notify();
    await this._checkpoint();
    await this._wait(this.baseDelay * 0.8);

    person.status = 'done';
    this._addLog(`[done] ${person.name} delivered to Floor ${person.dropOffFloor}`);
    this._notify();
    await this._checkpoint();
  }

  _buildOptimizedPlan() {
    const people = Array.from(new Set([...this.requests, ...this.riders]));
    const items = people.map(person => ({
      pickupFloor: person.currentFloor,
      dropOffFloor: person.dropOffFloor,
      startsOnboard: this.riders.includes(person),
    }));
    const allDeliveredMask = items.length === 0 ? 0 : (1 << items.length) - 1;
    const initialPickedMask = items.reduce(
      (mask, item, index) => (item.startsOnboard ? mask | (1 << index) : mask),
      0,
    );
    const memo = new Map();

    const normalize = (floor, pickedMask, deliveredMask) => {
      let nextPickedMask = pickedMask;
      let nextDeliveredMask = deliveredMask;

      items.forEach((item, index) => {
        const bit = 1 << index;

        if ((nextPickedMask & bit) === 0 && item.pickupFloor === floor) {
          nextPickedMask |= bit;
        }

        if ((nextPickedMask & bit) !== 0
          && (nextDeliveredMask & bit) === 0
          && item.dropOffFloor === floor) {
          nextDeliveredMask |= bit;
        }
      });

      return {
        pickedMask: nextPickedMask,
        deliveredMask: nextDeliveredMask,
      };
    };

    const search = (floor, pickedMask, deliveredMask) => {
      const normalized = normalize(floor, pickedMask, deliveredMask);
      const key = `${floor}|${normalized.pickedMask}|${normalized.deliveredMask}`;
      const cached = memo.get(key);

      if (cached) {
        return cached;
      }

      if (normalized.deliveredMask === allDeliveredMask) {
        const completed = { cost: 0, stops: [] };
        memo.set(key, completed);
        return completed;
      }

      const candidateFloors = new Set();

      items.forEach((item, index) => {
        const bit = 1 << index;

        if ((normalized.pickedMask & bit) === 0) {
          candidateFloors.add(item.pickupFloor);
          return;
        }

        if ((normalized.deliveredMask & bit) === 0) {
          candidateFloors.add(item.dropOffFloor);
        }
      });

      let best = null;

      candidateFloors.forEach(nextFloor => {
        const tail = search(nextFloor, normalized.pickedMask, normalized.deliveredMask);
        const candidate = {
          cost: Math.abs(nextFloor - floor) + tail.cost,
          stops: [nextFloor, ...tail.stops],
        };

        if (best === null || candidate.cost < best.cost) {
          best = candidate;
        }
      });

      const result = best ?? { cost: 0, stops: [] };
      memo.set(key, result);
      return result;
    };

    return search(this.currentFloor, initialPickedMask, 0).stops;
  }

  _addLog(message) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    this.log.unshift({ id: ++this._logSequence, time, message });
    if (this.log.length > 50) this.log.pop();
  }

  _notify() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.getState());
    }
  }

  async _wait(ms) {
    if (this._paused) {
      await new Promise(resolve => {
        this._pauseResolve = resolve;
      });
    }

    if (this.stepMode) return;

    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async _checkpoint() {
    if (!this.stepMode) return;

    this._atCheckpoint = true;
    this._flushCheckpointWaiters();

    await new Promise(resolve => {
      this._stepResolve = resolve;
    });

    this._stepResolve = null;
    this._atCheckpoint = false;
  }

  _flushCheckpointWaiters() {
    while (this._checkpointWaiters.length > 0) {
      const resolve = this._checkpointWaiters.shift();
      resolve();
    }
  }

  waitForCheckpoint() {
    if (this._atCheckpoint) return Promise.resolve();

    return new Promise(resolve => {
      this._checkpointWaiters.push(resolve);
    });
  }

  async advanceToNextEvent() {
    this.stepMode = true;

    if (!this._running) {
      this.run();
      await this.waitForCheckpoint();
      return this.getState();
    }

    if (this._paused) {
      this.resume();
    }

    if (this._atCheckpoint) {
      this.step();
    }

    await this.waitForCheckpoint();
    return this.getState();
  }

  step() {
    if (this._stepResolve) {
      const resolve = this._stepResolve;
      this._stepResolve = null;
      resolve();
      return;
    }

    if (this._paused) {
      this.resume();
      return;
    }

    if (!this._running) {
      this.run();
    }
  }

  getState() {
    return {
      currentFloor: this.currentFloor,
      state: this.state,
      direction: this.direction,
      doorsOpen: this.doorsOpen,
      requests: [...this.requests],
      riders: [...this.riders],
      allPersons: [...this._allPersons],
      stops: this.stops,
      floorsTraversed: this.floorsTraversed,
      log: [...this.log],
      totalFloors: this.totalFloors,
      running: this._running,
      paused: this._paused,
      speed: this.speed,
    };
  }
}
