/* ========================================
   Elevator Simulator Engine v3 (Module)
   ======================================== */

export const PERSON_COLORS = [
  '#f59e0b', '#ef4444', '#22c55e', '#a855f7',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
];

export class ElevatorSim {
  constructor(totalFloors = 10) {
    this.totalFloors = totalFloors;
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
      this._paused = true;
      this.state = 'paused';
      this._addLog('⏸️ Simulation paused');
      this._notify();
    }
  }

  resume() {
    if (this._paused) {
      this._paused = false;
      this._addLog('▶️ Simulation resumed');
      if (this._pauseResolve) {
        this._pauseResolve();
        this._pauseResolve = null;
      }
      this._notify();
    }
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
    this._addLog(`📋 ${name} requests: Floor ${currentFloor} → ${dropOffFloor}`);
    this._notify();
    return person;
  }

  async run() {
    if (this._running) return;
    this._running = true;
    this._paused = false;

    this._addLog('🚀 Simulation started');
    this._notify();

    while (this.requests.length > 0) {
      const person = this.requests[0];

      await this._moveTo(person.currentFloor);
      await this._openDoors();

      person.status = 'walking-to-elevator';
      this._addLog(`🚶 ${person.name} walking to elevator on Floor ${person.currentFloor}`);
      this._notify();
      await this._wait(this.baseDelay * 0.8);

      this.requests.shift();
      person.status = 'riding';
      this.riders.push(person);
      this.stops++;
      this._addLog(`🔼 ${person.name} boarded the elevator`);
      this._notify();
      await this._wait(this.baseDelay * 0.5);

      await this._closeDoors();
      await this._moveTo(person.dropOffFloor);
      await this._openDoors();

      person.status = 'walking-out';
      const idx = this.riders.indexOf(person);
      if (idx !== -1) this.riders.splice(idx, 1);
      this.stops++;
      this._addLog(`🔽 ${person.name} exiting on Floor ${person.dropOffFloor}`);
      this._notify();
      await this._wait(this.baseDelay * 0.8);

      person.status = 'done';
      this._addLog(`✅ ${person.name} delivered to Floor ${person.dropOffFloor}`);
      this._notify();

      await this._closeDoors();
    }

    this.state = 'complete';
    this.direction = null;
    this._addLog('🏁 All requests complete — elevator idle');
    this._notify();
    this._running = false;
  }

  reset() {
    this._running = false;
    this._paused = false;
    if (this._pauseResolve) {
      this._pauseResolve();
      this._pauseResolve = null;
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
    this._addLog('🔄 Elevator reset to lobby');
    this._notify();
  }

  async _moveTo(floor) {
    if (floor === this.currentFloor) return;
    const dir = floor > this.currentFloor ? 'up' : 'down';
    this.direction = dir;
    this.state = dir === 'up' ? 'moving-up' : 'moving-down';
    this._addLog(`${dir === 'up' ? '⬆️' : '⬇️'} Moving ${dir} to Floor ${floor}`);
    this._notify();

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

  _addLog(message) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.log.unshift({ time, message });
    if (this.log.length > 50) this.log.pop();
  }

  _notify() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.getState());
    }
  }

  async _wait(ms) {
    if (this.stepMode) {
      this._notify(); // Notify that we are waiting for step
      await new Promise(resolve => { this._stepResolve = resolve; });
      return;
    }
    if (this._paused) {
      await new Promise(resolve => { this._pauseResolve = resolve; });
    }
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  step() {
    if (this._stepResolve) {
      const resolve = this._stepResolve;
      this._stepResolve = null;
      resolve();
    } else if (!this._running) {
      this.run(); // Start if not running
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
