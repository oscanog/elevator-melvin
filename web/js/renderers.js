import { BuildingScene } from './three-scene.js';

function personFloor(person) {
  if (person.status === 'riding') return null;
  if (person.status === 'walking-out' || person.status === 'done') return person.dropOffFloor;
  return person.currentFloor;
}

function personLane(person) {
  if (person.status === 'walking-out' || person.status === 'done') return 'right';
  if (person.status === 'riding') return 'cab';
  return 'left';
}

function personLabel(name) {
  return name.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || '?';
}

function renderPersonSprite(person) {
  const colorIndex = Number.isInteger(person.colorIndex) ? person.colorIndex : 0;
  const statusClass = {
    waiting: 'person-sprite--waiting',
    'walking-to-elevator': 'person-sprite--walking',
    riding: 'person-sprite--riding',
    'walking-out': 'person-sprite--walking',
    done: 'person-sprite--done',
  }[person.status] ?? 'person-sprite--waiting';

  return `
    <div class="person-sprite ${statusClass} person-color-${colorIndex}" title="${person.name}">
      <span class="person-nametag">${personLabel(person.name)}</span>
      <span class="person-head"></span>
      <span class="person-body"></span>
      <span class="person-legs">
        <span class="person-leg"></span>
        <span class="person-leg"></span>
      </span>
    </div>
  `;
}

class ThreeRendererAdapter {
  constructor({ containerId, isLocked }) {
    this.containerId = containerId;
    this.isLocked = isLocked;
    this.scene = null;
  }

  mount() {
    this.scene = new BuildingScene(this.containerId, this.isLocked);
    this.scene.renderLoop();
  }

  update(state) {
    this.scene?.updateState(state);
  }

  destroy() {
    this.scene?.destroy?.();
    this.scene = null;
    const container = document.getElementById(this.containerId);
    if (container) container.innerHTML = '';
  }
}

class FrontViewRendererAdapter {
  constructor({ containerId, totalFloors = 10, isLocked = false }) {
    this.containerId = containerId;
    this.totalFloors = totalFloors;
    this.isLocked = isLocked;
    this.container = null;
    this.building = null;
    this.cab = null;
    this.cable = null;
    this.riders = null;
    this.shaft = null;
    this.leftFloors = new Map();
    this.rightFloors = new Map();
    this.rowHeight = 56;
  }

  mount() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) return;

    const floorsMarkup = Array.from({ length: this.totalFloors }, (_, index) => {
      const floor = this.totalFloors - index - 1;
      return `
        <div class="floor-row ${floor === 0 ? 'floor-row--lobby' : ''}" data-floor-row="${floor}">
          <div class="floor-num ${floor === 0 ? 'floor-num--lobby' : ''}">${floor === 0 ? 'L' : floor}</div>
          <div class="floor-outside" data-floor-left="${floor}"></div>
          <div class="elevator-shaft"></div>
          <div class="floor-right" data-floor-right="${floor}"></div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="sim-front-view ${this.isLocked ? 'sim-front-view--locked' : ''}">
        <div class="sim-front-view__frame">
          <div class="sim-front-view__building" data-front-view-building="true">
            ${floorsMarkup}
            <div class="sim-front-view__cab elevator-cab-3d" data-front-view-cab="true">
              <div class="cab-cable" data-front-view-cable="true"></div>
              <div class="cab-door cab-door--left"></div>
              <div class="cab-door cab-door--right"></div>
              <div class="cab-riders" data-front-view-riders="true"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.building = this.container.querySelector('[data-front-view-building]');
    this.cab = this.container.querySelector('[data-front-view-cab]');
    this.cable = this.container.querySelector('[data-front-view-cable]');
    this.riders = this.container.querySelector('[data-front-view-riders]');
    this.shaft = this.container.querySelector('.elevator-shaft');

    this.leftFloors.clear();
    this.rightFloors.clear();

    this.container.querySelectorAll('[data-floor-left]').forEach(node => {
      this.leftFloors.set(Number(node.dataset.floorLeft), node);
    });

    this.container.querySelectorAll('[data-floor-right]').forEach(node => {
      this.rightFloors.set(Number(node.dataset.floorRight), node);
    });

    this.syncCabGeometry();
  }

  syncCabGeometry() {
    if (!this.building || !this.cab || !this.shaft) return;

    const buildingRect = this.building.getBoundingClientRect();
    const shaftRect = this.shaft.getBoundingClientRect();
    this.rowHeight = this.building.querySelector('[data-floor-row]')?.getBoundingClientRect().height || 56;

    this.cab.style.left = `${shaftRect.left - buildingRect.left + 5}px`;
    this.cab.style.width = `${Math.max(shaftRect.width - 10, 56)}px`;
    this.cab.style.height = `${Math.max(this.rowHeight - 6, 40)}px`;
  }

  update(state) {
    if (!this.container || !this.building || !this.cab || !state) return;

    this.syncCabGeometry();

    this.building.querySelectorAll('[data-floor-row]').forEach(node => {
      const isActive = Number(node.dataset.floorRow) === state.currentFloor;
      node.classList.toggle('floor-row--active', isActive);
    });

    const top = (this.totalFloors - state.currentFloor - 1) * this.rowHeight + 3;
    this.cab.style.top = `${top}px`;
    this.cab.classList.toggle('doors-open', Boolean(state.doorsOpen));

    if (this.cable) {
      this.cable.style.height = `${Math.max(top, 10)}px`;
    }

    this.leftFloors.forEach(node => { node.innerHTML = ''; });
    this.rightFloors.forEach(node => { node.innerHTML = ''; });

    const ridingPeople = [];
    for (const person of state.allPersons) {
      const lane = personLane(person);
      if (lane === 'cab') {
        ridingPeople.push(person);
        continue;
      }

      const floor = personFloor(person);
      const target = lane === 'right' ? this.rightFloors.get(floor) : this.leftFloors.get(floor);
      if (!target) continue;
      target.insertAdjacentHTML('beforeend', renderPersonSprite(person));
    }

    if (this.riders) {
      this.riders.innerHTML = ridingPeople.map(renderPersonSprite).join('');
    }
  }

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.container = null;
    this.building = null;
    this.cab = null;
    this.cable = null;
    this.riders = null;
    this.leftFloors.clear();
    this.rightFloors.clear();
  }
}

export function createRenderer(options) {
  const { mode } = options;
  if (mode === '2d') {
    return new FrontViewRendererAdapter(options);
  }

  return new ThreeRendererAdapter(options);
}
