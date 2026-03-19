import * as THREE from 'three';

/* ========================================
   Three.js Building Scene v3
   — Taller Floors, Full Glass X-Ray
   ======================================== */

const FLOOR_H = 1.8;          // TALLER floors for visibility
const TOTAL_FLOORS = 10;
const TOTAL_HEIGHT = TOTAL_FLOORS * FLOOR_H;
const BLDG_W = 7;
const BLDG_D = 5;
const SHAFT_W = 1.8;
const SHAFT_D = 2.2;
const LOBBY_D = 2.0;          // waiting platform depth

export class BuildingScene {
  constructor(containerId, isLocked = false) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this._isLocked = isLocked;


    // ---- Renderer ----
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // ---- Scene ----
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1120');
    this.scene.fog = new THREE.FogExp2('#0b1120', 0.008);

    // ---- Camera — adjust zoom and look target to fit taller building ----
    this.d = 13.5;
    this.camera = new THREE.OrthographicCamera(-this.d, this.d, this.d, -this.d, 0.1, 200);
    this.camera.position.set(22, 18, 22);
    this.camera.lookAt(0, TOTAL_HEIGHT * 0.48, 0);

    // ---- Lights ----
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(14, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -10;
    this.scene.add(dirLight);

    const blueRim = new THREE.DirectionalLight(0x4488ff, 0.25);
    blueRim.position.set(-12, 10, -12);
    this.scene.add(blueRim);

    // ---- Groups ----
    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);
    this.personsMap = new Map();

    // ---- Build ----
    this._buildGround();
    this._buildFoundation();
    this._buildFloorSlabs();
    this._buildBackWall();
    this._buildSideWalls();
    this._buildGlassFront();
    this._buildGlassSideRight();
    this._buildFloorLabels(); // Add new floor labels
    this._buildShaft();
    this._buildElevatorCab();
    this._buildRoof();
    this._buildWaitingPlatforms();

    // ---- Construction (If Locked) ----
    if (this._isLocked) {
      this._buildConstructionSite();
    }


    // ---- State ----
    this._targetCabY = 0.5 * FLOOR_H + 0.4;
    this._doorsOpen = 0;

    this._animationFrame = null;
    this._destroyed = false;
    this._onResize = () => this._resize();

    this._resize();
    window.addEventListener('resize', this._onResize);
  }

  // ==================== GROUND ====================

  _buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshLambertMaterial({ color: '#141e30' })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(50, 50, 0x1a2a44, 0x1a2a44);
    this.scene.add(grid);
  }

  // ==================== FOUNDATION ====================

  _buildFoundation() {
    // Sidewalk
    const sw = new THREE.Mesh(
      new THREE.BoxGeometry(BLDG_W + 4, 0.08, BLDG_D + LOBBY_D + 4),
      new THREE.MeshLambertMaterial({ color: '#2a3a4e' })
    );
    sw.position.set(0, 0.04, LOBBY_D / 2);
    sw.receiveShadow = true;
    this.buildingGroup.add(sw);

    // Foundation block
    const fb = new THREE.Mesh(
      new THREE.BoxGeometry(BLDG_W + 0.6, 0.4, BLDG_D + 0.6),
      new THREE.MeshLambertMaterial({ color: '#2c3e50' })
    );
    fb.position.set(0, 0.2, 0);
    fb.castShadow = true;
    this.buildingGroup.add(fb);
  }

  // ==================== FLOOR SLABS ====================

  _buildFloorSlabs() {
    const mat = new THREE.MeshLambertMaterial({ color: '#d8d0c0' });
    for (let i = 0; i <= TOTAL_FLOORS; i++) {
      const y = i * FLOOR_H + 0.4;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, 0.08, BLDG_D), mat);
      slab.position.set(0, y, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      this.buildingGroup.add(slab);
    }
  }

  // ==================== BACK WALL ====================

  _buildBackWall() {
    // Solid opaque back wall
    const mat = new THREE.MeshPhongMaterial({ color: '#7a8898', specular: '#111', shininess: 15 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W, TOTAL_HEIGHT, 0.12), mat);
    wall.position.set(0, TOTAL_HEIGHT / 2 + 0.4, -BLDG_D / 2);
    wall.castShadow = true;
    this.buildingGroup.add(wall);
  }

  // ==================== SIDE WALLS ====================

  _buildSideWalls() {
    // Left wall — mostly opaque with window cutouts simulated
    const leftMat = new THREE.MeshPhongMaterial({ color: '#8a96aa', specular: '#222', shininess: 20 });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, TOTAL_HEIGHT, BLDG_D), leftMat);
    left.position.set(-BLDG_W / 2, TOTAL_HEIGHT / 2 + 0.4, 0);
    left.castShadow = true;
    this.buildingGroup.add(left);

    // Vertical mullions on left
    const mMat = new THREE.MeshLambertMaterial({ color: '#5a6a7e' });
    for (let c = 0; c < 4; c++) {
      const z = -BLDG_D / 2 + (BLDG_D / 5) * (c + 1);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, TOTAL_HEIGHT, 0.06), mMat);
      m.position.set(-BLDG_W / 2 - 0.06, TOTAL_HEIGHT / 2 + 0.4, z);
      this.buildingGroup.add(m);
    }
  }

  // ==================== GLASS FRONT (X-RAY) ====================

  _buildGlassFront() {
    // Very transparent glass panels on front face (left and right of shaft)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#aaddff',
      transparent: true,
      opacity: 0.06,        // nearly invisible — pure x-ray
      roughness: 0.02,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const sideW = (BLDG_W - SHAFT_W) / 2;

    // Left glass
    const lg = new THREE.Mesh(new THREE.PlaneGeometry(sideW, TOTAL_HEIGHT), glassMat);
    lg.position.set(-SHAFT_W / 2 - sideW / 2, TOTAL_HEIGHT / 2 + 0.4, BLDG_D / 2);
    this.buildingGroup.add(lg);

    // Right glass
    const rg = new THREE.Mesh(new THREE.PlaneGeometry(sideW, TOTAL_HEIGHT), glassMat);
    rg.position.set(SHAFT_W / 2 + sideW / 2, TOTAL_HEIGHT / 2 + 0.4, BLDG_D / 2);
    this.buildingGroup.add(rg);

    // Mullion grid lines (horizontal + vertical) — these give the glass curtain wall look
    const mullMat = new THREE.MeshLambertMaterial({ color: '#3a5a7a' });

    // Horizontal floor lines
    for (let f = 0; f <= TOTAL_FLOORS; f++) {
      const y = f * FLOOR_H + 0.4;
      for (let side = -1; side <= 1; side += 2) {
        const x = side * (SHAFT_W / 2 + sideW / 2);
        const h = new THREE.Mesh(new THREE.BoxGeometry(sideW, 0.04, 0.03), mullMat);
        h.position.set(x, y, BLDG_D / 2);
        this.buildingGroup.add(h);
      }
    }

    // Vertical mullions
    for (let side = -1; side <= 1; side += 2) {
      const baseX = side * (SHAFT_W / 2);
      for (let v = 0; v <= 3; v++) {
        const x = baseX + side * (sideW / 3) * v;
        const vm = new THREE.Mesh(new THREE.BoxGeometry(0.035, TOTAL_HEIGHT, 0.03), mullMat);
        vm.position.set(x, TOTAL_HEIGHT / 2 + 0.4, BLDG_D / 2);
        this.buildingGroup.add(vm);
      }
    }

    // Warm interior glow panes (seen through glass)
    const glowMat = new THREE.MeshBasicMaterial({
      color: '#ffcc66',
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
    });
    for (let f = 0; f < TOTAL_FLOORS; f++) {
      const y = f * FLOOR_H + 0.4 + FLOOR_H / 2;
      for (let side = -1; side <= 1; side += 2) {
        const x = side * (SHAFT_W / 2 + sideW / 2);
        const g = new THREE.Mesh(new THREE.PlaneGeometry(sideW * 0.9, FLOOR_H * 0.7), glowMat);
        g.position.set(x, y, BLDG_D / 2 - 0.15);
        this.buildingGroup.add(g);
      }
    }
  }

  // ==================== GLASS RIGHT SIDE (X-RAY) ====================

  _buildGlassSideRight() {
    // Make the right side also mostly transparent with mullion grid
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#88bbff',
      transparent: true,
      opacity: 0.08,
      roughness: 0.03,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    const rg = new THREE.Mesh(new THREE.PlaneGeometry(BLDG_D, TOTAL_HEIGHT), glassMat);
    rg.rotation.y = -Math.PI / 2;
    rg.position.set(BLDG_W / 2, TOTAL_HEIGHT / 2 + 0.4, 0);
    this.buildingGroup.add(rg);

    // mullions
    const mMat = new THREE.MeshLambertMaterial({ color: '#3a5a7a' });
    // horizontal
    for (let f = 0; f <= TOTAL_FLOORS; f++) {
      const y = f * FLOOR_H + 0.4;
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, BLDG_D), mMat);
      h.position.set(BLDG_W / 2, y, 0);
      this.buildingGroup.add(h);
    }
    // vertical
    for (let c = 0; c < 5; c++) {
      const z = -BLDG_D / 2 + (BLDG_D / 5) * (c + 0.5);
      const vm = new THREE.Mesh(new THREE.BoxGeometry(0.03, TOTAL_HEIGHT, 0.035), mMat);
      vm.position.set(BLDG_W / 2, TOTAL_HEIGHT / 2 + 0.4, z);
      this.buildingGroup.add(vm);
    }
  }

  // ==================== ELEVATOR SHAFT ====================

  _buildShaft() {
    // Thin transparent shaft walls
    const shaftMat = new THREE.MeshPhysicalMaterial({
      color: '#334',
      transparent: true,
      opacity: 0.15,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });

    // Left shaft wall
    const lw = new THREE.Mesh(new THREE.PlaneGeometry(SHAFT_D, TOTAL_HEIGHT), shaftMat);
    lw.rotation.y = Math.PI / 2;
    lw.position.set(-SHAFT_W / 2, TOTAL_HEIGHT / 2 + 0.4, 0);
    this.buildingGroup.add(lw);

    // Right shaft wall
    const rw = new THREE.Mesh(new THREE.PlaneGeometry(SHAFT_D, TOTAL_HEIGHT), shaftMat);
    rw.rotation.y = Math.PI / 2;
    rw.position.set(SHAFT_W / 2, TOTAL_HEIGHT / 2 + 0.4, 0);
    this.buildingGroup.add(rw);

    // Rail guides
    const railMat = new THREE.MeshLambertMaterial({ color: '#556' });
    for (let sx = -1; sx <= 1; sx += 2) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, TOTAL_HEIGHT, 0.04), railMat);
      r.position.set(sx * (SHAFT_W / 2 - 0.12), TOTAL_HEIGHT / 2 + 0.4, BLDG_D / 2 - SHAFT_D / 2);
      this.buildingGroup.add(r);
    }
  }

  // ==================== ELEVATOR CAB ====================

  _buildElevatorCab() {
    const cabGroup = new THREE.Group();

    // Cab body — glass
    const cabMat = new THREE.MeshPhysicalMaterial({
      color: '#44aaff',
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.2,
    });
    const cabH = FLOOR_H - 0.2;
    const cabBody = new THREE.Mesh(
      new THREE.BoxGeometry(SHAFT_W - 0.3, cabH, SHAFT_D - 0.3),
      cabMat
    );
    cabGroup.add(cabBody);

    // Cab floor (solid dark)
    const cfMat = new THREE.MeshLambertMaterial({ color: '#2a2a3a' });
    const cf = new THREE.Mesh(new THREE.BoxGeometry(SHAFT_W - 0.25, 0.06, SHAFT_D - 0.25), cfMat);
    cf.position.y = -cabH / 2 + 0.03;
    cabGroup.add(cf);

    // Top glow edge
    const egMat = new THREE.MeshBasicMaterial({ color: '#66bbff' });
    const eg = new THREE.Mesh(new THREE.BoxGeometry(SHAFT_W - 0.25, 0.04, SHAFT_D - 0.25), egMat);
    eg.position.y = cabH / 2 - 0.02;
    cabGroup.add(eg);

    // Doors
    const doorMat = new THREE.MeshPhongMaterial({ color: '#c0c8d0', specular: '#444', shininess: 60 });
    const doorW = (SHAFT_W - 0.4) / 2;
    const doorH = cabH - 0.2;
    const dGeo = new THREE.BoxGeometry(doorW, doorH, 0.06);

    this._doorL = new THREE.Mesh(dGeo, doorMat);
    this._doorL.position.set(-doorW / 2 - 0.02, 0, (SHAFT_D - 0.3) / 2 + 0.03);
    cabGroup.add(this._doorL);

    this._doorR = new THREE.Mesh(dGeo, doorMat);
    this._doorR.position.set(doorW / 2 + 0.02, 0, (SHAFT_D - 0.3) / 2 + 0.03);
    cabGroup.add(this._doorR);

    this._doorClosedLX = this._doorL.position.x;
    this._doorClosedRX = this._doorR.position.x;
    this._doorOpenOffset = doorW * 0.9;

    cabGroup.position.set(0, 0.5 * FLOOR_H + 0.4, BLDG_D / 2 - SHAFT_D / 2);
    this.buildingGroup.add(cabGroup);
    this._cab = cabGroup;

    // Cable
    const cableMat = new THREE.LineBasicMaterial({ color: 0x667788 });
    const cableGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, TOTAL_HEIGHT, 0),
    ]);
    this._cable = new THREE.Line(cableGeo, cableMat);
    this._cable.position.set(0, 0.4, BLDG_D / 2 - SHAFT_D / 2);
    this.buildingGroup.add(this._cable);
  }

  // ==================== ROOF ====================

  _buildRoof() {
    const roofMat = new THREE.MeshLambertMaterial({ color: '#5a6a7a' });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(BLDG_W + 0.4, 0.3, BLDG_D + 0.4), roofMat);
    roof.position.set(0, TOTAL_HEIGHT + 0.4 + 0.15, 0);
    roof.castShadow = true;
    this.buildingGroup.add(roof);

    // AC units
    const acMat = new THREE.MeshLambertMaterial({ color: '#bbb' });
    const ac1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.2), acMat);
    ac1.position.set(-2, TOTAL_HEIGHT + 0.4 + 0.65, -0.5);
    ac1.castShadow = true;
    this.buildingGroup.add(ac1);

    const ac2 = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 0.9), acMat);
    ac2.position.set(1.8, TOTAL_HEIGHT + 0.4 + 0.75, 0.7);
    ac2.castShadow = true;
    this.buildingGroup.add(ac2);

    // Antenna
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 6), new THREE.MeshLambertMaterial({ color: '#888' }));
    ant.position.set(0, TOTAL_HEIGHT + 0.4 + 1.3, 0);
    this.buildingGroup.add(ant);
  }

  // ==================== WAITING PLATFORMS ====================

  _buildWaitingPlatforms() {
    const platMat = new THREE.MeshLambertMaterial({ color: '#2e3e52' });
    const railMat = new THREE.MeshLambertMaterial({ color: '#4a5a6e' });
    const markerLobby = new THREE.MeshBasicMaterial({ color: '#44aaff' });
    const markerOther = new THREE.MeshBasicMaterial({ color: '#8899aa' });

    for (let f = 0; f < TOTAL_FLOORS; f++) {
      const y = f * FLOOR_H + 0.4;

      // Platform slab
      const pw = SHAFT_W + 2;
      const plat = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.06, LOBBY_D), platMat);
      plat.position.set(0, y + 0.03, BLDG_D / 2 + LOBBY_D / 2);
      plat.receiveShadow = true;
      this.buildingGroup.add(plat);

      // Small safety railing on the front edge
      if (f > 0) {
        const fr = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.5, 0.04), railMat);
        fr.position.set(0, y + 0.29, BLDG_D / 2 + LOBBY_D - 0.02);
        this.buildingGroup.add(fr);

        // Side railings
        for (let sx = -1; sx <= 1; sx += 2) {
          const sr = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, LOBBY_D), railMat);
          sr.position.set(sx * (pw / 2), y + 0.29, BLDG_D / 2 + LOBBY_D / 2);
          this.buildingGroup.add(sr);
        }
      }
    }
  }

  // ==================== FLOOR LABELS ====================

  _buildFloorLabels() {
    for (let f = 0; f < TOTAL_FLOORS; f++) {
      const y = f * FLOOR_H + 0.4 + FLOOR_H / 2;
      const label = this._createFloorLabel(f);

      // Position on the right side glass, near the front corner
      // BLDG_W / 2 is the right-most edge. We push it slightly out (+0.05)
      // BLDG_D / 2 is the front-most depth. We place it a bit back (-0.6)
      label.position.set(BLDG_W / 2 + 0.05, y, BLDG_D / 2 - 0.6);
      label.rotation.y = Math.PI / 2; // Face right

      this.buildingGroup.add(label);
    }
  }

  _createFloorLabel(floorNum) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Single color (Blue) with subtle incrementing lightness per floor base on typical UI schema
    const hue = 215;
    const step = floorNum * 2.5; // Subtle increment so top floors don't wash out

    // Circular plaque background
    ctx.fillStyle = `hsl(${hue}, 80%, ${30 + step}%)`;
    ctx.beginPath();
    ctx.arc(128, 128, 112, 0, Math.PI * 2);
    ctx.fill();

    // Glowing border outline
    ctx.strokeStyle = `hsl(${hue}, 90%, ${60 + step}%)`;
    ctx.lineWidth = 12;
    ctx.stroke();

    // Text number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 100px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(floorNum.toString(), 128, 136);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // Basic material so it is fully lit and readable
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.FrontSide
    });

    // Plane mesh for the label (size 1.4 fits perfectly within the 1.8 FLOOR_H without overlapping)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), mat);
    return mesh;
  }

  // ==================== UPDATE STATE ====================

  updateState(state) {
    this._targetCabY = (state.currentFloor + 0.5) * FLOOR_H + 0.4;
    this._doorsOpen = state.doorsOpen ? 1 : 0;
    this._syncPersons(state.allPersons, state.currentFloor);
  }

  _syncPersons(allPersons, cabFloor) {
    const currentIds = new Set(allPersons.map(p => p.id));

    for (const [id, group] of this.personsMap) {
      if (!currentIds.has(id)) {
        this.buildingGroup.remove(group);
        this.personsMap.delete(id);
      }
    }

    allPersons.forEach((p, idx) => {
      if (!this.personsMap.has(p.id)) {
        const pg = this._createPerson(p.color);
        this.buildingGroup.add(pg);
        this.personsMap.set(p.id, pg);

        pg.position.set(
          -0.6 - idx * 0.5,
          p.currentFloor * FLOOR_H + 0.4 + 0.03,
          BLDG_D / 2 + LOBBY_D * 0.7,
        );
        pg._tx = pg.position.x;
        pg._ty = pg.position.y;
        pg._tz = pg.position.z;
      }

      const mesh = this.personsMap.get(p.id);

      if (p.status === 'waiting') {
        mesh._tx = -0.5 - idx * 0.5;
        mesh._ty = p.currentFloor * FLOOR_H + 0.4 + 0.03;
        mesh._tz = BLDG_D / 2 + LOBBY_D * 0.5;
        mesh._isRiding = false;
      } else if (p.status === 'walking-to-elevator') {
        mesh._tx = 0;
        mesh._ty = p.currentFloor * FLOOR_H + 0.4 + 0.03;
        mesh._tz = BLDG_D / 2 - SHAFT_D / 2;
        mesh._isRiding = false;
      } else if (p.status === 'riding') {
        mesh._tx = (idx % 2 === 0 ? -0.3 : 0.3);
        mesh._ty = this._targetCabY - FLOOR_H / 2 + 0.03;
        mesh._tz = BLDG_D / 2 - SHAFT_D / 2 + 0.15;
        mesh._isRiding = true;
      } else if (p.status === 'walking-out') {
        mesh._tx = 0.6 + idx * 0.5;
        mesh._ty = p.dropOffFloor * FLOOR_H + 0.4 + 0.03;
        mesh._tz = BLDG_D / 2 + LOBBY_D * 0.4;
        mesh._isRiding = false;
      } else if (p.status === 'done') {
        mesh._tx = 1.5 + idx * 0.5;
        mesh._ty = p.dropOffFloor * FLOOR_H + 0.4 + 0.03;
        mesh._tz = BLDG_D / 2 + LOBBY_D * 0.7;
        mesh._isRiding = false;
      }
    });
  }

  _createPerson(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color });

    // Head — bigger
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat);
    head.position.y = 0.85;
    head.castShadow = true;
    group.add(head);

    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8), mat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Left leg
    const lleg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), mat);
    lleg.position.set(-0.07, 0.175, 0);
    group.add(lleg);
    group._lleg = lleg;

    // Right leg
    const rleg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), mat);
    rleg.position.set(0.07, 0.175, 0);
    group.add(rleg);
    group._rleg = rleg;

    group._tx = 0;
    group._ty = 0;
    group._tz = 0;
    group._isRiding = false;

    return group;
  }

  // ==================== ANIMATION ====================

  renderLoop() {
    const animate = () => {
      if (this._destroyed) return;

      this._animationFrame = requestAnimationFrame(animate);

      // Cab
      this._cab.position.y += (this._targetCabY - this._cab.position.y) * 0.08;

      // Cable
      const cabTop = this._cab.position.y + FLOOR_H / 2;
      this._cable.geometry.setFromPoints([
        new THREE.Vector3(0, cabTop, 0),
        new THREE.Vector3(0, TOTAL_HEIGHT + 0.4, 0),
      ]);

      // Doors
      const lTarget = this._doorClosedLX - this._doorsOpen * this._doorOpenOffset;
      const rTarget = this._doorClosedRX + this._doorsOpen * this._doorOpenOffset;
      this._doorL.position.x += (lTarget - this._doorL.position.x) * 0.12;
      this._doorR.position.x += (rTarget - this._doorR.position.x) * 0.12;

      // Persons
      const time = Date.now() * 0.001;
      for (const [, pg] of this.personsMap) {
        const dx = pg._tx - pg.position.x;
        const dy = pg._ty - pg.position.y;
        const dz = pg._tz - pg.position.z;

        pg.position.x += dx * 0.06;
        pg.position.z += dz * 0.06;

        if (pg._isRiding) {
          pg.position.y = this._cab.position.y - FLOOR_H / 2 + 0.03;
        } else {
          pg.position.y += dy * 0.1;
        }

        // Walk animation
        const moving = Math.abs(dx) > 0.05 || Math.abs(dz) > 0.05;
        if (moving) {
          const swing = Math.sin(time * 8) * 0.4;
          pg._lleg.rotation.x = swing;
          pg._rleg.rotation.x = -swing;
        } else {
          pg._lleg.rotation.x *= 0.9;
          pg._rleg.rotation.x *= 0.9;
          // idle head bob
          pg.children[0].position.y = 0.85 + Math.sin(time * 2 + pg.position.x * 10) * 0.02;
        }
      }

      // Construction Animations
      if (this._excavatorArmGroup) {
        const swing = Math.sin(time * 0.8) * 0.25;
        this._excavatorArmGroup.rotation.z = swing; // baseline 0 points up (as set by initial rotation)
        // Do NOT override the bucket rotation here, allow it to keep its 'to the sky' orientation
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  destroy() {
    this._destroyed = true;

    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
    }

    this.renderer?.dispose?.();
    this.container?.replaceChildren();
  }

  // ==================== CONSTRUCTION SITE ====================

  _buildConstructionSite() {
    this.constGroup = new THREE.Group();
    this.scene.add(this.constGroup);

    // === Materials (Polished cartoon style) ===
    const yellowGlossy = new THREE.MeshPhongMaterial({
      color: '#f5b800', specular: '#ffffcc', shininess: 80
    });
    const yellowDark = new THREE.MeshPhongMaterial({
      color: '#d4a010', specular: '#ffeeaa', shininess: 60
    });
    const silverMat = new THREE.MeshPhongMaterial({
      color: '#b0b8c0', specular: '#ffffff', shininess: 100
    });
    const darkMetalMat = new THREE.MeshPhongMaterial({
      color: '#333', specular: '#666', shininess: 40
    });
    const trackPlateMat = new THREE.MeshPhongMaterial({
      color: '#3a3a3a', specular: '#555', shininess: 30
    });
    const cabGlassMat = new THREE.MeshPhongMaterial({
      color: '#88ccff', specular: '#ffffff', shininess: 120,
      transparent: true, opacity: 0.6
    });
    const hydraulicMat = new THREE.MeshPhongMaterial({
      color: '#c0c8d0', specular: '#ffffff', shininess: 110
    });
    const blackMetalMat = new THREE.MeshPhongMaterial({
      color: '#000000', specular: '#ffffff', shininess: 200
    });

    // === UNDERCARRIAGE (Crawler Tracks) ===
    const tracksGroup = new THREE.Group();

    // Main track frames (left & right)
    for (let side = -1; side <= 1; side += 2) {
      const z = side * 1.1;

      // Track frame box
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 0.45, 0.5),
        trackPlateMat
      );
      frame.position.set(0, 0.25, z);
      frame.castShadow = true;
      tracksGroup.add(frame);

      // 4 road wheels (rollers) per side
      for (let i = -1.2; i <= 1.2; i += 0.8) {
        const roller = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.55, 12),
          blackMetalMat
        );
        roller.position.set(i, 0.2, z);
        roller.rotation.x = Math.PI / 2;
        tracksGroup.add(roller);
      }

      // Front idler wheel (larger)
      const frontIdler = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.55, 12),
        blackMetalMat
      );
      frontIdler.position.set(1.7, 0.3, z);
      frontIdler.rotation.x = Math.PI / 2;
      tracksGroup.add(frontIdler);

      // Rear drive sprocket (larger, toothed look)
      const rearSprocket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.55, 8),
        blackMetalMat
      );
      rearSprocket.position.set(-1.7, 0.35, z);
      rearSprocket.rotation.x = Math.PI / 2;
      tracksGroup.add(rearSprocket);

      // Track plates (segmented belt around the frame)
      // Top track surface
      const topTrack = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.08, 0.55),
        darkMetalMat
      );
      topTrack.position.set(0, 0.5, z);
      tracksGroup.add(topTrack);

      // Bottom track surface
      const botTrack = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.08, 0.55),
        darkMetalMat
      );
      botTrack.position.set(0, 0.02, z);
      tracksGroup.add(botTrack);

      // Track grooves (segmented lines on top)
      for (let g = -1.6; g <= 1.6; g += 0.35) {
        const groove = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.1, 0.56),
          new THREE.MeshPhongMaterial({ color: '#555' })
        );
        groove.position.set(g, 0.5, z);
        tracksGroup.add(groove);
      }
    }

    // Cross-beam connecting the two tracks
    const crossBeam = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.2, 2.4),
      yellowDark
    );
    crossBeam.position.set(0, 0.55, 0);
    tracksGroup.add(crossBeam);

    this.constGroup.add(tracksGroup);

    // === TURNTABLE / MAIN BODY ===
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.7;

    // Turntable ring
    const turntable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.12, 16),
      silverMat
    );
    turntable.position.set(0, 0, 0);
    bodyGroup.add(turntable);

    // Main body platform
    const bodyPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.5, 2.0),
      yellowGlossy
    );
    bodyPlatform.position.set(0, 0.3, 0);
    bodyPlatform.castShadow = true;
    bodyGroup.add(bodyPlatform);

    // Engine compartment (rear)
    const engineBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.7, 1.8),
      yellowGlossy
    );
    engineBox.position.set(-0.7, 0.7, 0);
    engineBox.castShadow = true;
    bodyGroup.add(engineBox);

    // Engine exhaust pipe
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8),
      darkMetalMat
    );
    exhaust.position.set(-1.1, 1.1, 0.5);
    bodyGroup.add(exhaust);

    // === OPERATOR CAB ===
    const cabGroup = new THREE.Group();
    // Shift cabin to LEFT side (-Z) so it does not block the arm
    cabGroup.position.set(0.5, 0.55, -0.4);
    bodyGroup.add(cabGroup);

    // Cab body
    const cabBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.4, 1.3),
      yellowGlossy
    );
    cabBody.position.set(0, 0.7, 0);
    cabBody.castShadow = true;
    cabGroup.add(cabBody);

    // Cab roof (slightly larger)
    const cabRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.08, 1.4),
      yellowDark
    );
    cabRoof.position.set(0, 1.44, 0);
    cabGroup.add(cabRoof);

    // Front window (shiny black)
    const winFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 1.0, 1.0),
      blackMetalMat
    );
    winFront.position.set(0.6, 0.8, 0);
    cabGroup.add(winFront);

    // Side window/door right (shiny black solid)
    const winSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.25, 0.08),
      blackMetalMat
    );
    winSide.position.set(0.1, 0.75, 0.66);
    cabGroup.add(winSide);

    // Side door left (shiny black solid)
    const doorL = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.25, 0.08),
      blackMetalMat
    );
    doorL.position.set(0.1, 0.75, -0.66);
    cabGroup.add(doorL);

    // === BOOM 1 (Base Arm of Articulated Boom) ===
    this._excavatorArmGroup = new THREE.Group();
    this._excavatorArmGroup.position.set(0.8, 0.5, 0.6);
    // Set initial rotation to point up and forward
    this._excavatorArmGroup.rotation.x = 2 * Math.PI / 3;   // 120 degrees
    this._excavatorArmGroup.rotation.y = Math.PI / 4;       // 45 degrees
    // We leave rotation.z at 0 (default) to be set by the animation loop
    bodyGroup.add(this._excavatorArmGroup);

    const boom1 = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.45, 0.4),
      yellowGlossy
    );
    boom1.position.set(1.0, 0, 0); // center
    boom1.castShadow = true;
    this._excavatorArmGroup.add(boom1);

    // Boom 1 Hydraulic (bottom mount)
    const b1Hyd = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 8), hydraulicMat);
    b1Hyd.position.set(0.8, -0.3, 0);
    b1Hyd.rotation.z = Math.PI / 2;
    this._excavatorArmGroup.add(b1Hyd);

    const b1Pin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), silverMat);
    b1Pin.rotation.x = Math.PI / 2;
    this._excavatorArmGroup.add(b1Pin);

    // === BOOM 2 (Middle Arm) ===
    const boom2Group = new THREE.Group();
    boom2Group.position.set(1.9, 0, 0); // At end of Boom 1
    // Mid arch gently forwards
    boom2Group.rotation.z = -Math.PI * 0.1;
    this._excavatorArmGroup.add(boom2Group);

    const boom2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.4, 0.35),
      yellowGlossy
    );
    boom2.position.set(0.75, 0, 0);
    boom2.castShadow = true;
    boom2Group.add(boom2);

    // Middle joint pin
    const b2Pin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 8), silverMat);
    b2Pin.rotation.x = Math.PI / 2;
    boom2Group.add(b2Pin);

    // === STICK (Outer Arm) ===
    const stickGroup = new THREE.Group();
    stickGroup.position.set(1.4, 0, 0); // At end of Boom 2
    // Decends forwards without hitting ground
    stickGroup.rotation.z = -Math.PI * 0.35;
    boom2Group.add(stickGroup);

    const stick = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.35, 0.3),
      yellowGlossy
    );
    stick.position.set(1.1, 0, 0);
    stick.castShadow = true;
    stickGroup.add(stick);

    // Stick Hydraulic (top mount)
    const stickHyd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), hydraulicMat);
    stickHyd.position.set(1.0, 0.25, 0);
    stickHyd.rotation.z = Math.PI / 2;
    stickGroup.add(stickHyd);

    // Elbow pin
    const elbowPin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.45, 8), silverMat);
    elbowPin.rotation.x = Math.PI / 2;
    stickGroup.add(elbowPin);

    // === BUCKET (Spoon) ===
    const bucketGroup = new THREE.Group();
    bucketGroup.position.set(2.1, 0, 0); // At end of Stick
    bucketGroup.rotation.z = -Math.PI * 0.4;
    stickGroup.add(bucketGroup);
    this._excavatorBucket = bucketGroup;

    // Wrist pin
    const wristPin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), silverMat);
    wristPin.rotation.x = Math.PI / 2;
    bucketGroup.add(wristPin);

    // Bucket cylinder frame
    const bucketScoop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12, 1, true, 0, Math.PI),
      blackMetalMat
    );
    bucketScoop.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    bucketScoop.position.set(0.6, 0, 0);
    bucketGroup.add(bucketScoop);

    // Left plate
    const bSideL = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12, 0, Math.PI), blackMetalMat);
    bSideL.rotation.set(0, 0, Math.PI);
    bSideL.position.set(0.6, 0, -0.7);
    bucketGroup.add(bSideL);

    // Right plate
    const bSideR = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12, 0, Math.PI), blackMetalMat);
    bSideR.rotation.set(0, 0, Math.PI);
    bSideR.position.set(0.6, 0, 0.7);
    bucketGroup.add(bSideR);

    // Cutting edge
    const cuttingEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.04, 1.4),
      blackMetalMat
    );
    cuttingEdge.position.set(1.2, 0, 0);
    bucketGroup.add(cuttingEdge);

    this.constGroup.add(bodyGroup);
    // Base excavator coordinate
    this.constGroup.position.set(-14, 0, 8);
    // True side profile orientation
    this.constGroup.rotation.y = 0;

    // --- Tower Crane (matching reference) ---
    const craneGroup = new THREE.Group();
    // Position the crane to the right of the building
    craneGroup.position.set(8, 0, 2);

    const craneMat = new THREE.MeshStandardMaterial({ color: '#d4911e' }); // Orange-yellow
    const craneDarkMat = new THREE.MeshStandardMaterial({ color: '#b07a18' });
    const craneBlackMat = new THREE.MeshStandardMaterial({ color: '#333' });

    // === MAST (Vertical Tower) — as tall as the building ===
    const mastHeight = TOTAL_HEIGHT + 4; // Slightly taller than building

    // Main mast vertical columns (4 corner posts)
    const postGeo = new THREE.BoxGeometry(0.15, mastHeight, 0.15);
    const postPositions = [
      [-0.5, 0, -0.5], [0.5, 0, -0.5],
      [-0.5, 0, 0.5], [0.5, 0, 0.5]
    ];
    postPositions.forEach(([px, , pz]) => {
      const post = new THREE.Mesh(postGeo, craneMat);
      post.position.set(px, mastHeight / 2, pz);
      post.castShadow = true;
      craneGroup.add(post);
    });

    // Horizontal cross-braces on mast (every ~2 units up)
    const braceGeo = new THREE.BoxGeometry(1.0, 0.08, 0.08);
    const braceSideGeo = new THREE.BoxGeometry(0.08, 0.08, 1.0);
    for (let by = 1; by < mastHeight; by += 2) {
      // Front & back braces
      const fb = new THREE.Mesh(braceGeo, craneDarkMat);
      fb.position.set(0, by, -0.5);
      craneGroup.add(fb);
      const bb = new THREE.Mesh(braceGeo, craneDarkMat);
      bb.position.set(0, by, 0.5);
      craneGroup.add(bb);
      // Side braces
      const lb = new THREE.Mesh(braceSideGeo, craneDarkMat);
      lb.position.set(-0.5, by, 0);
      craneGroup.add(lb);
      const rb = new THREE.Mesh(braceSideGeo, craneDarkMat);
      rb.position.set(0.5, by, 0);
      craneGroup.add(rb);
    }

    // Diagonal X-braces on mast (for lattice look)
    for (let by = 0; by < mastHeight - 2; by += 4) {
      const diagGeo = new THREE.BoxGeometry(0.06, 3.0, 0.06);
      // Front face diagonals
      const d1 = new THREE.Mesh(diagGeo, craneDarkMat);
      d1.position.set(0, by + 1.5, -0.5);
      d1.rotation.z = Math.PI / 6;
      craneGroup.add(d1);
      const d2 = new THREE.Mesh(diagGeo, craneDarkMat);
      d2.position.set(0, by + 1.5, 0.5);
      d2.rotation.z = -Math.PI / 6;
      craneGroup.add(d2);
    }

    // === SLEWING UNIT (at the top of the mast) ===
    const slewing = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 1.6),
      craneMat
    );
    slewing.position.set(0, mastHeight + 0.25, 0);
    craneGroup.add(slewing);

    // === OPERATOR CAB (below the jib, at the turntable) ===
    const operatorCab = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.6, 1.4),
      craneMat
    );
    operatorCab.position.set(0, mastHeight - 1.0, 0);
    operatorCab.castShadow = true;
    craneGroup.add(operatorCab);

    // Cab windows
    const cabWinF = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.05),
      craneBlackMat
    );
    cabWinF.position.set(0, mastHeight - 0.8, 0.73);
    craneGroup.add(cabWinF);
    const cabWinS = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.9, 0.9),
      craneBlackMat
    );
    cabWinS.position.set(-0.73, mastHeight - 0.8, 0);
    craneGroup.add(cabWinS);

    // === JIB (Horizontal arm extending OVER the building) ===
    const jibLength = 14;
    const jibGroup = new THREE.Group();
    jibGroup.position.set(0, mastHeight + 0.5, 0);
    craneGroup.add(jibGroup);

    // Main jib beams (top & bottom, forming a lattice box)
    const jibTopGeo = new THREE.BoxGeometry(jibLength, 0.12, 0.12);
    const jibTop1 = new THREE.Mesh(jibTopGeo, craneMat);
    jibTop1.position.set(-jibLength / 2, 0.5, -0.3);
    jibGroup.add(jibTop1);
    const jibTop2 = new THREE.Mesh(jibTopGeo, craneMat);
    jibTop2.position.set(-jibLength / 2, 0.5, 0.3);
    jibGroup.add(jibTop2);
    const jibBot1 = new THREE.Mesh(jibTopGeo, craneMat);
    jibBot1.position.set(-jibLength / 2, 0, -0.3);
    jibGroup.add(jibBot1);
    const jibBot2 = new THREE.Mesh(jibTopGeo, craneMat);
    jibBot2.position.set(-jibLength / 2, 0, 0.3);
    jibGroup.add(jibBot2);

    // Jib vertical cross-braces
    const jibBraceGeo = new THREE.BoxGeometry(0.06, 0.5, 0.06);
    for (let jx = 0; jx < jibLength; jx += 1.2) {
      const jb = new THREE.Mesh(jibBraceGeo, craneDarkMat);
      jb.position.set(-jx, 0.25, -0.3);
      jibGroup.add(jb);
      const jb2 = new THREE.Mesh(jibBraceGeo, craneDarkMat);
      jb2.position.set(-jx, 0.25, 0.3);
      jibGroup.add(jb2);
    }

    // Jib horizontal cross-braces (connecting the two sides)
    for (let jx = 0; jx < jibLength; jx += 2.4) {
      const hb = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.6),
        craneDarkMat
      );
      hb.position.set(-jx, 0.5, 0);
      jibGroup.add(hb);
    }

    // === COUNTER-JIB (Short arm extending the opposite direction) ===
    const counterJibLen = 4;
    const cjTop = new THREE.Mesh(
      new THREE.BoxGeometry(counterJibLen, 0.12, 0.12), craneMat
    );
    cjTop.position.set(counterJibLen / 2, 0.5, 0);
    jibGroup.add(cjTop);
    const cjBot = new THREE.Mesh(
      new THREE.BoxGeometry(counterJibLen, 0.12, 0.12), craneMat
    );
    cjBot.position.set(counterJibLen / 2, 0, 0);
    jibGroup.add(cjBot);

    // Counter-weight block
    const counterWeight = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: '#555' })
    );
    counterWeight.position.set(counterJibLen - 0.2, -0.3, 0);
    jibGroup.add(counterWeight);

    // === SUPPORT CABLES (from mast top-peak to jib tips) ===
    // Peak above the slewing unit
    const peakY = 2.5;
    const peakMast = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, peakY, 0.1),
      craneMat
    );
    peakMast.position.set(0, 0.5 + peakY / 2, 0);
    jibGroup.add(peakMast);

    // Cable from peak to jib tip (front cable)
    const cableToJibMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    const cableToJibGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.5 + peakY, 0),
      new THREE.Vector3(-jibLength + 1, 0.5, 0),
    ]);
    const cableToJib = new THREE.Line(cableToJibGeo, cableToJibMat);
    jibGroup.add(cableToJib);

    // Cable from peak to counter-jib tip
    const cableToCJGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.5 + peakY, 0),
      new THREE.Vector3(counterJibLen, 0.5, 0),
    ]);
    const cableToCJ = new THREE.Line(cableToCJGeo, cableToJibMat);
    jibGroup.add(cableToCJ);

    // === HOIST CABLE + HOOK (dropping from jib, near building) ===
    // The jib extends to the left (negative X), over the building
    // Drop cable at about 2/3 of jib length
    const hookDropX = -jibLength * 0.6;
    const hookDropLen = mastHeight + 0.5 - (TOTAL_HEIGHT + 1.5); // Drop to just above roof

    const hoistCable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, hookDropLen),
      new THREE.MeshStandardMaterial({ color: '#666' })
    );
    hoistCable.position.set(hookDropX, -hookDropLen / 2, 0);
    jibGroup.add(hoistCable);

    // Hook at the end of the hoist cable
    const craneHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.08, 8, 16),
      new THREE.MeshStandardMaterial({ color: '#444' })
    );
    craneHook.position.set(hookDropX, -hookDropLen - 0.1, 0);
    craneHook.rotation.x = Math.PI / 2;
    jibGroup.add(craneHook);

    // Small pulley wheel at the cable attachment point on jib
    const pulleyWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12),
      craneBlackMat
    );
    pulleyWheel.position.set(hookDropX, 0, 0);
    pulleyWheel.rotation.x = Math.PI / 2;
    jibGroup.add(pulleyWheel);

    // === CRANE BASE (concrete foundation pad) ===
    const craneBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.3, 2.5),
      new THREE.MeshStandardMaterial({ color: '#555' })
    );
    craneBase.position.set(0, 0.15, 0);
    craneGroup.add(craneBase);

    this.scene.add(craneGroup);

    // --- Sand & Stones ---
    const sandColor = '#d2b48c';
    const stoneColor = '#5a5a5a';

    // Mountain of Sand
    const sandMound = new THREE.Mesh(
      new THREE.ConeGeometry(3, 1.8, 32),
      new THREE.MeshStandardMaterial({ color: sandColor, roughness: 1.0 })
    );
    sandMound.position.set(-14, 0.9, 5);
    this.constGroup.add(sandMound);

    // Stones Scattered
    for (let i = 0; i < 15; i++) {
      const stoneSize = 0.15 + Math.random() * 0.3;
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(stoneSize),
        new THREE.MeshStandardMaterial({ color: stoneColor })
      );
      const angle = Math.random() * Math.PI * 2;
      const dist = 3.5 + Math.random() * 2;
      stone.position.set(
        sandMound.position.x + Math.cos(angle) * dist,
        stoneSize / 2,
        sandMound.position.z + Math.sin(angle) * dist
      );
      stone.rotation.set(Math.random(), Math.random(), Math.random());
      this.constGroup.add(stone);
    }
  }

  // ==================== RESIZE ====================


  _resize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const a = rect.width / rect.height;
    this.camera.left = -this.d * a;
    this.camera.right = this.d * a;
    this.camera.top = this.d;
    this.camera.bottom = -this.d;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
