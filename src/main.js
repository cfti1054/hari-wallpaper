// 하리 데스크톱: 뼈대 없는 아기 고양이 GLB에 자동 뼈대와 눈꺼풀을 붙여 마우스 반응을 만든다.
// 3D 모델: "Chibi Kitten - dilute calico recolor (Hari)" by Cato Berg (https://sketchfab.com/catoberg13), CC BY 4.0
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

const qs = new URLSearchParams(location.search);
const MANUAL = qs.has('manual');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hintEl = document.getElementById('hint');
const creditEl = document.getElementById('credit');
if (location.hash === '#wallpaper' || MANUAL) { hintEl.hidden = true; creditEl.hidden = true; }

THREE.ColorManagement.legacyMode = false;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ───────── 렌더러 · 장면
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: MANUAL, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MANUAL ? 1 : 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.94;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', '흰 바탕 가운데 앉아 있는 3D 아기 고양이 하리. 마우스로 쓰다듬거나 클릭하면 반응합니다');
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(28, innerWidth / innerHeight, 0.1, 100);

{ // 부드러운 스튜디오 환경광
  const env = new THREE.Scene();
  const g = new THREE.SphereGeometry(10, 32, 16); const cols = []; const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = (p.getY(i) / 10 + 1) / 2; cols.push(lerp(0.5, 1, y), lerp(0.49, 1, y), lerp(0.47, 0.98, y)); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  env.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (x, y, z, w, h, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k * 0.96), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  panel(4, 6, 5, 5, 3, 5); panel(-6, 3, 2, 3, 4, 2); panel(0, 4, -7, 6, 2, 2.6);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(env, 0.035).texture;
}
scene.add(new THREE.HemisphereLight(0xffffff, 0xeae3d8, 0.5));
const key = new THREE.DirectionalLight(0xfff3e6, 1.7);
key.position.set(2.4, 6.5, 4.4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 4, bottom: -2, near: 1, far: 20 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; scene.add(key);
const fill = new THREE.DirectionalLight(0xe2eaff, 0.5); fill.position.set(-5, 2.5, 3); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 1.0); rim.position.set(-1.5, 3.5, -5); scene.add(rim);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.15 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
function radialTex(stops, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
const contact = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), new THREE.MeshBasicMaterial({
  map: radialTex([[0, 'rgba(60,45,30,0.4)'], [0.45, 'rgba(60,45,30,0.15)'], [1, 'rgba(60,45,30,0)']]), transparent: true, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.position.y = 0.002; scene.add(contact);

// ───────── 하트
const HEART = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.translate(64, 70); g.beginPath(); g.moveTo(0, 34);
  g.bezierCurveTo(-60, -6, -36, -54, 0, -24); g.bezierCurveTo(36, -54, 60, -6, 0, 34); g.closePath();
  const gr = g.createRadialGradient(-14, -18, 4, 0, 0, 60); gr.addColorStop(0, '#ffb3c4'); gr.addColorStop(1, '#ff5d84');
  g.fillStyle = gr; g.fill(); g.globalAlpha = 0.65; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-20, -22, 9, 6, -0.6, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
})();
const hearts = [];
function spawnHeart(p, big) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: HEART, transparent: true, depthWrite: false }));
  s.position.copy(p); s.scale.setScalar(0.001); s.renderOrder = 5; scene.add(s);
  hearts.push({ s, t: 0, vx: (rnd() - 0.5) * 0.5, life: 1.3 + rnd() * 0.4, size: (big ? 0.26 : 0.18) + rnd() * 0.06 });
}

// ───────── 털실 장난감 (잡아서 던지거나 톡 치면 굴러가고, 하리가 지켜보다 가까이 오면 덮친다)
const TOY = {
  r: 0.2,                        // 털실 반지름
  start: [1.35, 1.25],           // 처음 놓이는 자리 (x, z)
  hold: 0.32,                    // 잡았을 때 들어 올리는 높이
  friction: 1.1,                 // 클수록 빨리 멈춤
  zMin: -1.4, zMax: 2.2,         // 굴러다니는 앞뒤 범위 (좌우는 화면 폭에 맞춤)
  catR: 0.85,                    // 하리 몸 둘레 (털실이 통과하지 못함)
  reach: 1.9,                    // 이 거리 안에 털실이 느리게 있으면 하리가 덮침
  cooldown: 2.2,                 // 덮친 뒤 다음 덮치기까지 쉬는 시간
  pounces: 3,                    // 한 번 굴려 주면 덮치는 횟수
};
const toy = (() => {
  const g = new THREE.Group(), R = TOY.r;
  const mats = ['#f08a9c', '#f6a5b2', '#e57a8e', '#f9b8c2'].map(c => new THREE.MeshPhysicalMaterial({
    color: c, roughness: 0.85, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffe4ea'), envMapIntensity: 0.6 }));
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.93, 32, 24), mats[0]); core.castShadow = true; g.add(core);
  // 여러 방향으로 감긴 실 가닥
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R * (0.9 + rnd() * 0.06), R * 0.075, 6, 64), mats[i % mats.length]);
    m.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI); m.castShadow = true; g.add(m);
  }
  const hit = new THREE.Mesh(new THREE.SphereGeometry(R * 1.5, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.part = 'toy'; g.add(hit);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(R * 3.2, R * 3.2), new THREE.MeshBasicMaterial({
    map: radialTex([[0, 'rgba(60,45,30,0.35)'], [1, 'rgba(60,45,30,0)']], 64), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.003; scene.add(shadow);
  g.position.set(TOY.start[0], R, TOY.start[1]); scene.add(g);
  return { g, hit, shadow, v: new THREE.Vector3(), held: false, heldT: 0, drag: 0, quiet: 99, energy: 0 };
})();
const toyPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), toyAim = new THREE.Vector3(), toyPrev = new THREE.Vector3(), toySpin = new THREE.Quaternion(), toyAxis = new THREE.Vector3();
// 화면에 보이는 바닥 폭 안에 털실을 가둔다
const toyBound = z => Math.max(0.8, Math.tan(camera.fov * Math.PI / 360) * camera.aspect * (camera.position.z - z) - TOY.r - 0.25);
function updateToy(dt, grab, rayHit) {
  const T = toy, p = T.g.position, R = TOY.r;
  if (grab && !T.held) { T.held = true; T.heldT = 0; T.drag = 0; }
  if (T.held && !st.down) { // 놓음: 짧게 톡 쳤으면 친 반대쪽으로, 끌다 놓았으면 끈 방향으로 굴러감
    T.held = false; T.energy = TOY.pounces;
    if (T.heldT < 0.35 && T.drag < 0.15) {
      const dx = p.x - (rayHit ? rayHit.x : p.x), dz = p.z - (rayHit ? rayHit.z : p.z - 1), d = Math.hypot(dx, dz) || 1;
      T.v.set(dx / d * 2.6, 1.2, dz / d * 2.6);
    } else { const s = Math.hypot(T.v.x, T.v.z); if (s > 7) { T.v.x *= 7 / s; T.v.z *= 7 / s; } }
  }
  if (T.held) {
    T.heldT += dt; toyPrev.copy(p);
    toyPlane.constant = -(R + TOY.hold);
    if (ray.ray.intersectPlane(toyPlane, toyAim)) {
      toyAim.z = clamp(toyAim.z, TOY.zMin, TOY.zMax); const xb = toyBound(toyAim.z); toyAim.x = clamp(toyAim.x, -xb, xb);
      p.x = damp(p.x, toyAim.x, 18, dt); p.z = damp(p.z, toyAim.z, 18, dt);
    }
    p.y = damp(p.y, R + TOY.hold, 12, dt);
    T.drag += toyPrev.distanceTo(p);
    T.v.x = damp(T.v.x, (p.x - toyPrev.x) / dt, 14, dt); T.v.z = damp(T.v.z, (p.z - toyPrev.z) / dt, 14, dt); T.v.y = 0;
  } else {
    T.v.y -= 14 * dt; p.addScaledVector(T.v, dt);
    if (p.y <= R) { p.y = R; T.v.y = T.v.y < -1.2 ? -T.v.y * 0.35 : 0; }
    if (p.y <= R + 1e-3) { const f = Math.exp(-TOY.friction * dt); T.v.x *= f; T.v.z *= f; }
    const xb = toyBound(p.z);
    if (Math.abs(p.x) > xb) { p.x = Math.sign(p.x) * xb; T.v.x = -Math.sign(p.x) * Math.abs(T.v.x) * 0.6; }
    if (p.z > TOY.zMax) { p.z = TOY.zMax; T.v.z = -Math.abs(T.v.z) * 0.6; }
    if (p.z < TOY.zMin) { p.z = TOY.zMin; T.v.z = Math.abs(T.v.z) * 0.6; }
    // 바닥을 구르는 만큼 회전
    const s = Math.hypot(T.v.x, T.v.z);
    if (s > 1e-3 && p.y <= R + 0.02) { toyAxis.set(T.v.z / s, 0, -T.v.x / s); T.g.quaternion.premultiply(toySpin.setFromAxisAngle(toyAxis, s * dt / R)); }
  }
  // 하리 몸은 통과하지 못한다
  const rp = C.rig.position, min = TOY.catR + R;
  let nx = p.x - rp.x, nz = p.z - rp.z; const d = Math.hypot(nx, nz);
  if (d < min) {
    if (d < 1e-4) { nx = 0; nz = 1; } else { nx /= d; nz /= d; }
    p.x = rp.x + nx * min; p.z = rp.z + nz * min;
    const vn = T.v.x * nx + T.v.z * nz; if (vn < 0) { T.v.x -= 1.5 * vn * nx; T.v.z -= 1.5 * vn * nz; }
  }
  const lift = clamp((p.y - R) / 0.8, 0, 0.7);
  T.shadow.position.set(p.x, 0.003, p.z); T.shadow.scale.setScalar(1 - lift * 0.4); T.shadow.material.opacity = 1 - lift;
  T.quiet = T.held || Math.hypot(T.v.x, T.v.z) > 0.25 ? 0 : T.quiet + dt;
}

// ───────── 모델 → 뼈대 붙이기 (모델 좌표: 키 0.906, 바닥 y=0, 정면 +z)
const J = {
  root: [0, 0, 0], spine: [0, 0.14, 0], chest: [0, 0.27, 0.01], head: [-0.03, 0.43, -0.01],   // 엉덩이 · 허리 · 가슴 · 목
  earL: [-0.27, 0.69, 0.12], earR: [0.05, 0.79, 0.08],
  shoulderR: [-0.1, 0.33, 0.02], armR: [-0.12, 0.3, 0.06], pawR: [-0.135, 0.21, 0.17],          // 들어 올린 오른 앞발: 어깨뼈 · 어깨 · 손목
  shoulderL: [0.04, 0.33, 0.04], armL: [0.0, 0.3, 0.08], forearmL: [-0.0125, 0.16, 0.125], pawL: [-0.021, 0.062, 0.157], // 딛고 선 왼 앞다리: 어깨뼈 · 어깨 · 팔꿈치 · 손목
  legR: [-0.15, 0.14, -0.04], footR: [-0.17, 0.05, 0.0], legL: [0.13, 0.14, -0.04], footL: [0.13, 0.05, 0.0],              // 뒷다리: 엉덩이 관절 · 발목
  tail: [0.02, 0.05, -0.3], tail2: [0.27, 0.13, -0.41], tail3: [0.3, 0.32, -0.4],                                      // 꼬리: 뿌리 · 서는 곳 · 끝
};
const TAIL_LINE = [[0.0, 0.05, -0.3], [0.2, 0.06, -0.39], [0.29, 0.18, -0.42], [0.3, 0.44, -0.4], [0.4, 0.41, -0.38]];
const PARENT = { spine: 'root', chest: 'spine', head: 'chest', earL: 'head', earR: 'head',
  shoulderR: 'chest', armR: 'shoulderR', pawR: 'armR', shoulderL: 'chest', armL: 'shoulderL', forearmL: 'armL', pawL: 'forearmL',
  legR: 'root', footR: 'legR', legL: 'root', footL: 'legL', tail: 'root', tail2: 'tail', tail3: 'tail2' };
// 관절마다 꺾을 수 있는 범위 [[앞뒤 최소, 최대], [좌우 돌림], [옆으로]] (라디안). 앞뒤 x 는 음수가 앞으로 들기.
// 이 범위를 넘으면 아기 고양이 체형이라 메시가 뭉개지거나 몸끼리 겹쳐 조각이 생긴다 (자세 검사로 정함)
// 뒷발은 발바닥이 몸 아래 납작하게 깔려 있어 따로 움직이면 조각이 떨어져 나가므로 고정
const sym = (x, y, z) => [[-x, x], [-y, y], [-z, z]];
const LIMIT = {
  root: sym(0.03, 0.04, 0.04), spine: sym(0.06, 0.1, 0.06), chest: sym(0.14, 0.15, 0.08),
  shoulderR: sym(0.08, 0.04, 0.06), shoulderL: sym(0.1, 0.06, 0.08),
  armR: [[-0.3, 0.1], [-0.06, 0.06], [-0.06, 0.06]], pawR: [[-0.2, 0], [-0.05, 0.05], [-0.05, 0.05]], // 든 앞발: 내리면 뒷다리와 겹치고, 손목을 아래로 접으면 발바닥이 갈라짐
  armL: [[-0.3, 0.15], [-0.08, 0.08], [-0.08, 0.08]], forearmL: [[-0.1, 0.2], [-0.05, 0.05], [-0.05, 0.05]], pawL: sym(0.1, 0.05, 0.05),
  legR: sym(0.15, 0.05, 0.05), legL: sym(0.15, 0.05, 0.05), footR: sym(0, 0, 0), footL: sym(0, 0, 0),
};
const BODY = ['root', 'spine', 'chest', 'shoulderR', 'armR', 'pawR', 'shoulderL', 'armL', 'forearmL', 'pawL', 'legR', 'footR', 'legL', 'footL']; // 전신 자세로 움직이는 뼈대
const ORDER = ['root', 'spine', 'head', 'earL', 'earR', 'tail', 'tail2', 'armR', 'pawR', 'armL', 'legR', 'legL', 'tail3',
  'chest', 'shoulderR', 'shoulderL', 'forearmL', 'pawL', 'footR', 'footL'];
// 선분 a→b 까지의 거리와 선분 위 위치(0~1)
function seg(x, y, z, a, b) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const t = clamp(((x - a[0]) * abx + (y - a[1]) * aby + (z - a[2]) * abz) / (abx * abx + aby * aby + abz * abz), 0, 1);
  return [Math.hypot(x - a[0] - abx * t, y - a[1] - aby * t, z - a[2] - abz * t), t];
}
// 타원체 c(반지름 r) 안쪽일수록 1
const blob = (x, y, z, c, r) => 1 - smooth(0.7, 1.1, Math.hypot((x - c[0]) / r[0], (y - c[1]) / r[1], (z - c[2]) / r[2]));
// 머리를 정면 쪽으로 살짝 돌려 놓는 기본 각도 (원본은 왼쪽 위를 올려다보는 자세)
// 목걸이 고리를 맞춘 평면 (모델 텍스처의 초록 목걸이 정점으로 구함)
const COLLAR = { c: [-0.046, 0.392, 0.017], n: [-0.134, 0.953, 0.273] };
const HEAD_REST = { yaw: 0.14, pitch: 0.06, roll: -0.05 };
// 고개를 돌릴 수 있는 한계 (라디안). 너무 크게 돌리면 목 주변이 늘어나 얼굴이 일그러진다
const LOOK = { yaw: 0.32, up: 0.16, down: 0.14, tilt: 0.16 };

function weightsFor(x, y, z) {
  const w = {};
  // 꼬리: 꼬리 중심선 가까이만 붙인다 (엉덩이까지 끌려가지 않게)
  // 꼬리 중심선 (정점 단면으로 구함): 엉덩이 뒤에서 바닥을 따라 뻗다가 → 위로 서고 → 끝이 바깥으로 말림
  const td = Math.min(...TAIL_LINE.slice(1).map((q, i) => seg(x, y, z, TAIL_LINE[i], q)[0]));
  const tr = 0.075 + 0.02 * smooth(0.08, 0.16, y);   // 위로 선 부분은 더 굵다
  const tail = (1 - smooth(tr, tr + 0.03, td)) * smooth(-0.22, -0.28, z);
  const tail3 = tail * smooth(0.28, 0.36, y), tail2 = (tail - tail3) * smooth(0.09, 0.15, y);
  // 앞다리: 몸에서 튀어나온 부분일수록 다리에 붙인다 (어깨 쪽은 어깨뼈·가슴과 섞임)
  const [ad, at] = seg(x, y, z, J.armR, [-0.14, 0.19, 0.25]);
  const armR = (1 - smooth(0.055, 0.075, ad)) * smooth(0.1, 0.45, at) * (1 - smooth(0.36, 0.4, y));
  const pawR = armR * smooth(0.55, 0.75, at);
  const [ld, lt] = seg(x, y, z, J.armL, [-0.025, 0.02, 0.17]);
  const armL = (1 - smooth(0.05 + 0.025 * lt, 0.07 + 0.03 * lt, ld)) * smooth(0.25, 0.6, lt) * (1 - armR);
  const pawL = armL * smooth(0.8, 0.9, lt), forearmL = (armL - pawL) * smooth(0.45, 0.6, lt);
  // 뒷다리: 허벅지 타원, 바닥에 닿은 아랫부분은 발
  const hip = cx => blob(x, y, z, [cx, 0.08, -0.02], [0.1375, 0.15, 0.1875]);
  const legR = hip(-0.17) * (1 - armR) * (1 - armL), legL = hip(0.16) * (1 - armR) * (1 - armL);
  const footR = legR * (1 - smooth(0.035, 0.07, y)), footL = legL * (1 - smooth(0.035, 0.07, y));
  const limbs = armR + armL + legR + legL;
  // 머리와 몸통은 목걸이 면을 기준으로 나눈다. 목걸이보다 위는 볼·턱 털까지 모두 머리에 100% 붙여
  // 고개를 돌려도 얼굴 윤곽이 늘어나지 않게 한다 (목걸이 면: 중심 COLLAR.c, 법선 COLLAR.n)
  const d = (x - COLLAR.c[0]) * COLLAR.n[0] + (y - COLLAR.c[1]) * COLLAR.n[1] + (z - COLLAR.c[2]) * COLLAR.n[2];
  const paw = smooth(0.17, 0.22, z) * (1 - smooth(0.33, 0.37, y));   // 앞으로 든 앞발은 머리에서 뺌
  const head0 = smooth(-0.004, 0.032, d);
  const head = head0 * (1 - paw) * (1 - tail) * (1 - limbs);
  // 어깨뼈: 앞다리가 붙는 가슴 옆·위 (머리·다리·꼬리는 제외)
  const free = (1 - head0) * Math.max(0, 1 - limbs) * (1 - tail);
  const shoulderR = blob(x, y, z, [-0.13, 0.3, 0.02], [0.09, 0.08, 0.11]) * free;
  const shoulderL = blob(x, y, z, [0.06, 0.3, 0.05], [0.09, 0.08, 0.1]) * free * (1 - shoulderR);
  // 왼쪽 귀는 머리 옆면에 눕듯 붙어 있어 끝부분만 움직인다 (뿌리까지 움직이면 볼·관자놀이가 끌려감)
  const earL = head * smooth(-0.31, -0.37, x) * smooth(0.64, 0.7, y);
  const earR = head * smooth(0.76, 0.82, y) * smooth(-0.05, 0.01, x);
  w.earL = earL; w.earR = earR; w.head = head - earL - earR;
  w.tail3 = tail3; w.tail2 = tail2; w.tail = tail - tail3 - tail2;
  w.pawR = pawR; w.armR = armR - pawR; w.pawL = pawL; w.forearmL = forearmL; w.armL = armL - pawL - forearmL;
  w.footR = footR; w.legR = legR - footR; w.footL = footL; w.legL = legL - footL;
  w.shoulderR = shoulderR; w.shoulderL = shoulderL;
  // 몸통은 아래부터 엉덩이 · 허리 · 가슴
  const body = Math.max(0, 1 - head - tail - limbs - shoulderR - shoulderL);
  const root = body * (1 - smooth(0.04, 0.14, y)), chest = body * smooth(0.2, 0.3, y);
  w.root = root; w.chest = chest; w.spine = Math.max(0, body - root - chest);
  return w;
}

function rig(src) {
  src.updateMatrixWorld(true);
  let mesh; src.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
  const geo = mesh.geometry.clone(); geo.applyMatrix4(mesh.matrixWorld);
  geo.computeBoundingBox();
  const p = geo.attributes.position, n = p.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const w = weightsFor(p.getX(i), p.getY(i), p.getZ(i));
    const list = Object.entries(w).filter(e => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = list.reduce((s, e) => s + e[1], 0) || 1;
    list.forEach(([k, v], j) => { si[i * 4 + j] = ORDER.indexOf(k); sw[i * 4 + j] = v / sum; });
    if (!list.length) { si[i * 4] = 0; sw[i * 4] = 1; }
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));

  const om = mesh.material;
  const mat = new THREE.MeshPhysicalMaterial({
    map: om.map, normalMap: om.normalMap, normalScale: om.normalScale ? om.normalScale.clone() : new THREE.Vector2(1, 1),
    roughnessMap: om.roughnessMap, metalnessMap: om.metalnessMap, roughness: om.roughness, metalness: om.metalness,
    sheen: 0.3, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.6, side: THREE.DoubleSide,
  });
  const { sk, bones } = skinned(geo, mat);
  sk.castShadow = true; sk.receiveShadow = true;
  const plain = new THREE.Mesh(geo, mat); // 표정 위치 찾기용 (정지 자세)
  return { sk, bones, plain, mat, geo };
}

// 같은 뼈대 구조를 새로 만들어 메시에 묶는다 (하리와 마고·미코가 함께 씀)
function skinned(geo, mat) {
  const bones = {};
  for (const k of ORDER) {
    const b = new THREE.Bone(); b.name = k;
    const pos = new THREE.Vector3(...J[k]);
    if (PARENT[k]) pos.sub(new THREE.Vector3(...J[PARENT[k]]));
    b.position.copy(pos); bones[k] = b;
  }
  for (const k of ORDER) if (PARENT[k]) bones[PARENT[k]].add(bones[k]); // 모두 만든 뒤 연결 (ORDER 순서와 무관하게)
  const sk = new THREE.SkinnedMesh(geo, mat);
  sk.add(bones.root); sk.bind(new THREE.Skeleton(ORDER.map(k => bones[k])));
  sk.frustumCulled = false;
  return { sk, bones };
}

// ───────── 마고 · 미코 (하늘나라에 간 고양이들. 하리를 오래 쓰다듬으면 뒤에 희미하게 나타났다 사라진다)
// 세 모델은 같은 원본 메시를 색만 바꾼 것이라, 하리의 메시·뼈대에 털 텍스처만 바꿔 입힌다
const MEMORY = {
  petSeconds: 5,                 // 이만큼 쓰다듬으면 나타남 (쉬면 조금씩 줄어듦)
  fadeIn: 2.2, hold: 4.5, fadeOut: 3,
  opacity: 0.42,                 // 가장 진할 때 불투명도
  cats: [                        // x, z: 하리 뒤 위치 / turn: 몸 방향 / size: 하리 대비 크기
    { name: 'mago', x: -1.6, z: -1.6, turn: 0.45, size: 0.92, phase: 0 },
    { name: 'mico', x: 1.75, z: -1.7, turn: -0.35, size: 0.9, phase: 1.7 },
  ],
};
// 혼자 오래 있으면 둘 중 하나가 잠깐 찾아온다 (번갈아)
const VISIT = {
  idleSeconds: 120,              // 마우스가 이만큼 가만히 있으면 찾아옴
  repeatSeconds: 300,            // 다음 방문까지 간격
  look: 1.4, fadeIn: 1.4, hold: 2.6, fadeOut: 2.2, after: 1.6,   // 하리가 먼저 알아채고 → 나타남 → 머묾 → 사라짐 → 여운
  opacity: 0.3,
};
function makeGhosts(geo, base) {
  const loader = new THREE.TextureLoader();
  return MEMORY.cats.map(cfg => {
    const map = loader.load(window.GHOST_TEX[cfg.name]);
    map.flipY = false; map.encoding = THREE.sRGBEncoding; map.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({
      map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.22,
      normalMap: base.normalMap, normalScale: base.normalScale, roughnessMap: base.roughnessMap, roughness: base.roughness, metalness: 0,
      envMapIntensity: 0.6, transparent: true, opacity: 0, depthWrite: false,
    });
    // 가장자리로 갈수록 투명하게 해 윤곽이 빛에 녹아드는 느낌을 낸다
    mat.onBeforeCompile = s => {
      s.fragmentShader = s.fragmentShader.replace('#include <output_fragment>',
        'float rim = 1.0 - saturate(dot(normal, normalize(vViewPosition)));\n\tdiffuseColor.a *= 1.0 - 0.75 * pow(rim, 1.6);\n#include <output_fragment>');
    };
    const { sk, bones } = skinned(geo, mat);
    // 깊이만 먼저 그려 두어, 반투명해도 몸 안쪽·뒷면이 비쳐 보이지 않게 한다
    const depth = new THREE.SkinnedMesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false }));
    depth.bind(sk.skeleton); depth.frustumCulled = false;
    sk.renderOrder = 1;
    const g = new THREE.Group(); g.add(depth, sk);
    g.scale.setScalar(SCALE * cfg.size); g.position.set(cfg.x, 0, cfg.z); g.rotation.y = cfg.turn; g.visible = false;
    scene.add(g);
    return { cfg, g, bones, mat };
  });
}
const sparkles = [];
const SPARK = radialTex([[0, 'rgba(255,214,140,1)'], [0.25, 'rgba(255,200,120,0.55)'], [1, 'rgba(255,190,110,0)']], 64);
function spawnSparkle(p) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SPARK, transparent: true, depthWrite: false, opacity: 0 }));
  s.position.copy(p); s.renderOrder = 4; scene.add(s);
  sparkles.push({ s, t: 0, life: 1.6 + rnd() * 1.2, size: 0.08 + rnd() * 0.1, vx: (rnd() - 0.5) * 0.12, tw: rnd() * 6 });
}
function updateGhosts(dt, t) {
  let a = 0;
  if (st.mem >= 0) {
    const { fadeIn, hold, fadeOut } = MEMORY, m = st.mem += dt, end = fadeIn + hold + fadeOut;
    a = smooth(0, fadeIn, m) * (1 - smooth(fadeIn + hold, end, m));
    // 가장 또렷해질 때 하리 쪽으로 하트 하나씩
    if (m - dt < fadeIn * 0.9 && m >= fadeIn * 0.9) for (const G of C.ghosts) {
      const p = new THREE.Vector3(); G.bones.head.getWorldPosition(p); spawnHeart(p.add(new THREE.Vector3(-Math.sign(G.cfg.x) * 0.3, 0.45, 0.2)), false);
    }
    if (m >= end) st.mem = -1;
  }
  // 혼자 있을 때 찾아오기
  let va = 0, look = 0;
  if (st.visit >= 0) {
    const V = VISIT, v = st.visit += dt, s = V.look, e = s + V.fadeIn + V.hold + V.fadeOut, end = e + V.after;
    va = smooth(s, s + V.fadeIn, v) * (1 - smooth(s + V.fadeIn + V.hold, e, v));
    look = smooth(0, V.look, v) * (1 - smooth(end - 1.4, end, v));
    // 마주 본 채 천천히 눈을 감았다 뜬다 (고양이의 눈인사)
    st.slowBlink = v > s + V.fadeIn + 0.6 && v < s + V.fadeIn + 1.5;
    if (v >= end) { st.visit = -1; st.slowBlink = false; st.visitAt = st.idle + V.repeatSeconds; }
  }
  st.memA = a; st.visitLook = look;
  C.ghosts.forEach((G, i) => {
    const { cfg, g, bones: B } = G, ph = t * 0.9 + cfg.phase;
    const visiting = st.visit >= 0 && i === st.visitCat ? va : 0;
    const alpha = Math.max(MEMORY.opacity * a, VISIT.opacity * visiting);
    g.visible = alpha > 0.002;
    if (!g.visible) return;
    G.mat.opacity = alpha;
    // 나타날 때와 사라질 때 빛 알갱이가 피어오른다
    const spark = a > 0 ? (st.mem < MEMORY.fadeIn ? 1 : 0) + (st.mem > MEMORY.fadeIn + MEMORY.hold ? 1.4 : 0) + 0.25 : 0.5;
    if (rnd() < dt * 14 * spark * Math.min(1, alpha / 0.2)) {
      const k = cfg.size;
      spawnSparkle(new THREE.Vector3((rnd() - 0.5) * 1.6 * k, (0.2 + rnd() * 2.3) * k, (rnd() - 0.5) * 0.8 * k).add(g.position));
    }
    // 아래에서 살짝 떠오르고, 사라질 땐 위로 올라가며 흩어진다
    const rise = a > 0 ? smooth(0, MEMORY.fadeIn, st.mem) : smooth(VISIT.look, VISIT.look + VISIT.fadeIn, st.visit);
    const out = a > 0 ? Math.max(0, st.mem - MEMORY.fadeIn - MEMORY.hold) : Math.max(0, st.visit - VISIT.look - VISIT.fadeIn - VISIT.hold);
    g.position.y = (reduceMotion ? 0.12 : 0.12 + Math.sin(ph) * 0.04) - (1 - rise) * 0.2 + out * 0.12;
    // 하리 쪽으로 고개를 기울이고, 꼬리를 천천히 흔든다
    const toward = -Math.sign(cfg.x);
    B.head.rotation.set(0.05 + Math.sin(ph * 0.7) * 0.03, toward * 0.18, toward * -0.12 + Math.sin(ph * 0.5) * 0.04, 'YXZ');
    B.tail.rotation.set(-0.1, Math.sin(ph * 1.2) * 0.06, 0);
    B.tail2.rotation.set(-0.15, 0, Math.sin(ph * 1.6) * 0.16);
    const breath = reduceMotion ? 0 : Math.sin(t * 1.8 + cfg.phase) * 0.012;
    B.spine.scale.set(1 + breath * 0.6, 1 + breath, 1 + breath * 0.6);
  });
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const p = sparkles[i]; p.t += dt;
    p.s.position.y += dt * 0.32; p.s.position.x += p.vx * dt;
    p.s.scale.setScalar(p.size * (0.7 + 0.3 * Math.sin(p.t * 5 + p.tw)));
    p.s.material.opacity = 0.85 * smooth(0, 0.3, p.t) * (1 - smooth(p.life * 0.5, p.life, p.t));
    if (p.t > p.life) { scene.remove(p.s); p.s.material.dispose(); sparkles.splice(i, 1); }
  }
}

// ───────── 눈꺼풀 (눈 위에 털빛 눈꺼풀 데칼: 감은 눈 · 웃는 눈)
// 정면에서 본 눈 위치(모델 좌표)와 반지름. 눈은 텍스처로 그려져 있어 그 위를 덮는다.
const EYES = [{ x: -0.157, y: 0.527, rx: 0.068, ry: 0.061, side: -1 }, { x: 0.066, y: 0.598, rx: 0.058, ry: 0.062, side: 1 }];
function buildFaces(plain, mat, headBone) {
  const img = mat.map.image, W = img.width, H = img.height;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cg = cv.getContext('2d', { willReadFrequently: true }); cg.drawImage(img, 0, 0);
  const data = cg.getImageData(0, 0, W, H).data;
  const px = uv => { const x = clamp(Math.round(uv.x * W), 0, W - 1), y = clamp(Math.round(uv.y * H), 0, H - 1), i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const lum = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  const ray = new THREE.Raycaster();
  const hitAt = (x, y) => { ray.set(new THREE.Vector3(x, y, 2), new THREE.Vector3(0, 0, -1)); return ray.intersectObject(plain, false)[0] || null; };
  const hj = new THREE.Vector3(...J.head);
  // 눈 두 개를 잇는 선의 기울기 = 얼굴 기울기
  const ex = new THREE.Vector2(EYES[1].x - EYES[0].x, EYES[1].y - EYES[0].y).normalize();
  const up = new THREE.Vector2(-ex.y, ex.x), roll = Math.atan2(ex.y, ex.x);
  const sample = (cx, cy, dx, dy, rad) => {
    const cols = [];
    for (let k = -3; k <= 3; k++) { const a = k * 0.18; const vx = dx * Math.cos(a) - dy * Math.sin(a), vy = dx * Math.sin(a) + dy * Math.cos(a);
      for (const m of [1.35, 1.6]) { const h = hitAt(cx + vx * rad * m, cy + vy * rad * m); if (h && h.uv) { const c = px(h.uv); if (lum(c) > 70 && !(c[0] - c[2] > 70 && lum(c) < 150)) cols.push(c); } } }
    if (!cols.length) return [200, 196, 200];
    return [0, 1, 2].map(i => cols.map(c => c[i]).sort((a, b) => a - b)[Math.floor(cols.length / 2)]);
  };
  const css = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const isFur = c => lum(c) > 80 && !(c[0] - c[2] > 60 && lum(c) < 170);
  // 눈 둘레를 한 바퀴 돌며 바로 바깥 털색을 모은다 (각도 → 색)
  function ring(e, R) {
    const out = [];
    for (let k = 0; k < 36; k++) {
      const a = k / 36 * Math.PI * 2, dx = Math.cos(a) * ex.x + Math.sin(a) * up.x, dy = Math.cos(a) * ex.y + Math.sin(a) * up.y;
      let col = null;
      for (const m of [1.35, 1.48, 1.62, 1.8]) { const h = hitAt(e.x + dx * e.rx * m, e.y + dy * e.ry * m); if (h && h.uv) { const c = px(h.uv); if (isFur(c)) { col = c; break; } } }
      out.push(col);
    }
    for (let k = 0; k < 36; k++) if (!out[k]) { for (let d = 1; d < 18 && !out[k]; d++) out[k] = out[(k + d) % 36] || out[(k + 36 - d) % 36]; }
    return out.map(c => (c || [210, 206, 210]).map(v => Math.round(v * 0.9)));
  }
  const helper = new THREE.Object3D();
  function decal(x, y, w, h, tex, order) {
    const hit = hitAt(x, y); if (!hit) return null;
    const n = hit.face.normal.clone().normalize().lerp(new THREE.Vector3(0, 0, 1), 0.35).normalize();
    helper.position.copy(hit.point); helper.lookAt(hit.point.clone().add(n)); helper.rotateZ(roll);
    const geo = new DecalGeometry(plain, hit.point, helper.rotation.clone(), new THREE.Vector3(w, h, 0.2));
    geo.translate(-hj.x, -hj.y, -hj.z);
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.85, metalness: 0,
      sheen: 0.3, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'), polygonOffset: true, polygonOffsetFactor: -4, envMapIntensity: 0.6 }));
    m.visible = false; m.receiveShadow = true; m.renderOrder = order || 2; headBone.add(m); return m;
  }
  function lidTex(cols, kind, side) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    // 각도별 주변 털색으로 부채꼴을 채운 뒤 크게 흐려, 가장자리가 주변과 이어지게 한다
    const f = document.createElement('canvas'); f.width = f.height = 256; const fg = f.getContext('2d');
    for (let k = 0; k < 36; k++) {
      const a0 = (k - 0.6) / 36 * Math.PI * 2, a1 = (k + 0.6) / 36 * Math.PI * 2;
      fg.fillStyle = css(cols[k]); fg.beginPath(); fg.moveTo(128, 128); fg.arc(128, 128, 140, -a1, -a0); fg.closePath(); fg.fill();
    }
    g.save(); g.beginPath(); g.ellipse(128, 128, 122, 122, 0, 0, Math.PI * 2); g.clip();
    g.filter = 'blur(22px)'; g.drawImage(f, 0, 0); g.drawImage(f, 0, 0); g.filter = 'none'; g.restore();
    // 가장자리 부드럽게
    g.globalCompositeOperation = 'destination-in';
    const m = g.createRadialGradient(128, 128, 88, 128, 128, 124); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, 256, 256); g.globalCompositeOperation = 'source-over';
    // 털 결 느낌의 잔무늬
    g.globalAlpha = 0.12; g.strokeStyle = '#ffffff'; g.lineWidth = 1.2;
    for (let k = 0; k < 140; k++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 88; const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 6, y + 5 + Math.random() * 6); g.stroke(); }
    g.globalAlpha = 1;
    g.strokeStyle = '#2b1d18'; g.lineCap = 'round'; g.lineWidth = 11; g.beginPath();
    const o = side; // 바깥 눈꼬리 방향 (+1 오른쪽)
    if (kind === 'happy') { g.moveTo(52, 150); g.quadraticCurveTo(128, 70, 204, 150); }
    else { g.moveTo(50, 122); g.quadraticCurveTo(128, 176, 206, 122); }
    g.stroke();
    // 바깥쪽 속눈썹
    g.lineWidth = 6; g.beginPath();
    const ox = o > 0 ? 204 : 52, oy = kind === 'happy' ? 150 : 122;
    g.moveTo(ox, oy); g.quadraticCurveTo(ox + o * 14, oy + (kind === 'happy' ? 4 : -6), ox + o * 24, oy + (kind === 'happy' ? -6 : -16)); g.stroke();
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  const blushTex = radialTex([[0, 'rgba(255,130,140,0.7)'], [0.55, 'rgba(255,140,150,0.3)'], [1, 'rgba(255,140,150,0)']], 128);
  const parts = { happy: [], closed: [], blush: [] };
  for (const e of EYES) {
    const R = Math.max(e.rx, e.ry);
    const cols = ring(e, R);
    const w = e.rx * 2 * 1.62, h = e.ry * 2 * 1.62;
    parts.happy.push(decal(e.x, e.y, w, h, lidTex(cols, 'happy', e.side)));
    parts.closed.push(decal(e.x, e.y, w, h, lidTex(cols, 'closed', e.side)));
    const bx = e.x + e.side * ex.x * 0.05 - up.x * R * 1.5, by = e.y + e.side * ex.y * 0.05 - up.y * R * 1.5;
    const b = decal(bx, by, 0.11, 0.07, blushTex, 3); if (b) { b.material.opacity = 0; b.visible = true; parts.blush.push(b); }
  }
  for (const k of ['happy', 'closed']) parts[k] = parts[k].filter(Boolean);
  return parts;
}

// ───────── 카메라
function frameCamera() {
  const a = innerWidth / innerHeight, vfov = camera.fov * Math.PI / 180;
  const dist = Math.max(4.5 / 2 / Math.tan(vfov / 2), 3.6 / 2 / (Math.tan(vfov / 2) * a));
  camera.position.set(0, 1.5 + dist * 0.1, dist); camera.lookAt(0, 1.33, 0);
  camera.aspect = a; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
function resize() { renderer.setSize(innerWidth, innerHeight); frameCamera(); }
addEventListener('resize', resize); resize();

// ───────── 상태
const st = {
  t: 0, px: -1, py: -1, inside: false, down: false, lastPX: null, lastPY: null, speed: 0, vx: 0,
  idle: 99, pet: 0, happy: false, hover: null, hit: null,
  yaw: 0, pitch: 0, tilt: 0, earBack: 0, wag: 0, wagAmp: 0.15, wagSpeed: 3,
  sq: 0, sqv: 0, hsq: 0, hsqv: 0, y: 0, vy: 0, air: false, blink: 0, nextBlink: 2, curious: 0, heartT: 0, face: 'open',
  petTime: 0, mem: -1, memA: 0,   // 마고·미코: 쓰다듬은 시간, 나타난 뒤 지난 시간(-1이면 없음), 진하기
  visit: -1, visitCat: -1, visitAt: VISIT.idleSeconds, visitLook: 0, slowBlink: false,   // 찾아오기
  wasDown: false, toyLook: 0, pounce: '', pT: 0, pCool: 0, hopTo: new THREE.Vector2(),     // 털실 놀이
  hOff: [0, 0, 0], shut: false, swat: -1, swatDir: 1, swatCool: 0, swatToy: false, fidget: '', fT: 0, fidgetAt: 6, // 팔다리
};
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmp = new THREE.Vector3();
let C = null; // 캐릭터
const SCALE = 2.62 / 0.906;

function setPointer(x, y, down) { st.px = x; st.py = y; st.down = down; st.inside = true; st.idle = 0; if (st.visit < 0) st.visitAt = VISIT.idleSeconds; }
function leave() { st.inside = false; st.down = false; st.lastPX = null; }
function doClick() {
  if (toy.held || st.hover === 'toy') return; // 털실은 놓을 때 updateToy 가 처리
  if (st.hover) {
    if (!st.air) { st.vy = 4.4; st.air = true; st.sqv += 5; }
    const p = st.hit ? st.hit.clone() : new THREE.Vector3(0, 1.9, 0.6);
    for (let i = 0; i < 6; i++) spawnHeart(p.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.5, rnd() * 0.3, 0.3)), true);
    st.pet = Math.min(1, st.pet + 0.5);
  } else st.curious = 1.6;
}
if (!MANUAL) {
  let downAt = 0, x0 = 0, y0 = 0;
  addEventListener('pointermove', e => setPointer(e.clientX, e.clientY, st.down), { passive: true });
  addEventListener('pointerdown', e => { setPointer(e.clientX, e.clientY, true); downAt = performance.now(); x0 = e.clientX; y0 = e.clientY; });
  addEventListener('pointerup', e => { setPointer(e.clientX, e.clientY, false); if (performance.now() - downAt < 350 && Math.hypot(e.clientX - x0, e.clientY - y0) < 12) doClick(); });
  document.addEventListener('pointerleave', leave); addEventListener('blur', leave);
}
let hintGone = false;

// 당김 판정용 보이지 않는 몸통·머리
function proxies(b) {
  const inv = new THREE.MeshBasicMaterial({ visible: false });
  const mk = (bone, c, s, tag) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), inv); const j = new THREE.Vector3(...J[bone.name]);
    m.position.set(c[0] - j.x, c[1] - j.y, c[2] - j.z); m.scale.set(...s); m.userData.part = tag; bone.add(m); return m; };
  return [
    mk(b.head, [-0.04, 0.63, 0.08], [0.32, 0.25, 0.26], 'head'),
    mk(b.earL, [-0.32, 0.7, 0.14], [0.1, 0.09, 0.07], 'head'), mk(b.earR, [0.08, 0.84, 0.08], [0.08, 0.08, 0.07], 'head'),
    mk(b.spine, [0, 0.25, 0.03], [0.3, 0.22, 0.24], 'body'), mk(b.tail2, [0.3, 0.4, -0.4], [0.1, 0.12, 0.1], 'body'),
  ];
}

function step(dt) {
  st.t += dt; st.idle += dt; const t = st.t;
  if (st.inside && st.lastPX != null) {
    const dx = st.px - st.lastPX, dy = st.py - st.lastPY;
    st.speed = damp(st.speed, Math.hypot(dx, dy) / Math.max(dt, 1e-3), 10, dt);
    st.vx = damp(st.vx, dx / Math.max(dt, 1e-3), 8, dt);
  } else { st.speed = damp(st.speed, 0, 6, dt); st.vx = damp(st.vx, 0, 6, dt); }
  st.lastPX = st.inside ? st.px : null; st.lastPY = st.py;
  if (!C) { renderer.render(scene, camera); return; }
  const B = C.bones;

  st.hover = null; st.hit = null;
  if (st.inside) {
    C.group.updateMatrixWorld(true);
    ndc.set(st.px / innerWidth * 2 - 1, -(st.py / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects([...C.proxies, toy.hit], false)[0];
    if (h) { st.hover = h.object.userData.part; st.hit = h.point; }
  }
  if (toy.held) st.hover = 'toy';
  renderer.domElement.style.cursor = st.hover ? (st.down ? 'grabbing' : 'grab') : 'default';
  const pressed = st.down && !st.wasDown; st.wasDown = st.down;
  updateToy(dt, pressed && st.hover === 'toy', st.hover === 'toy' ? st.hit : null);
  const onCat = (st.hover === 'head' || st.hover === 'body') && !toy.held;

  // 털실 놀이: 굴러가는 털실을 지켜보다 가까이 오면 엉덩이를 씰룩이고 덮쳐 앞발로 툭 친 뒤 제자리로 돌아온다
  const tp = toy.g.position, rp = C.rig.position;
  const tdx = tp.x - rp.x, tdz = tp.z - rp.z, tdist = Math.hypot(tdx, tdz) || 1e-3;
  st.toyLook = damp(st.toyLook, toy.quiet < 2.5 ? 1 : 0, toy.quiet < 2.5 ? 6 : 1.5, dt);
  st.pCool = Math.max(0, st.pCool - dt);
  if (!st.pounce && st.pCool <= 0 && toy.energy > 0 && !toy.held && !st.air && !st.happy && st.mem < 0 && st.toyLook > 0.5
      && tp.y < TOY.r + 0.05 && tdist < TOY.reach && Math.hypot(toy.v.x, toy.v.z) < 2.5 && Math.hypot(rp.x, rp.z) < 0.08) { st.pounce = 'crouch'; st.pT = 0; }
  if (st.pounce) {
    st.pT += dt;
    if (st.pounce === 'crouch' && st.pT > 0.55) {
      const go = clamp(tdist - TOY.catR - TOY.r + 0.05, 0, 1.1);
      st.hopTo.set(rp.x + tdx / tdist * go, rp.z + tdz / tdist * go); st.vy = 3.4; st.air = true; st.sqv += 4; st.pounce = 'leap'; st.pT = 0;
    } else if (st.pounce === 'leap' && !st.air) {
      if (tdist < TOY.catR + TOY.r + 0.35) { // 앞발로 툭
        st.swat = 0; st.swatDir = Math.sign(tdx) || 1; st.swatToy = false;
        const a = Math.atan2(tdx, tdz) + (rnd() - 0.5) * 1.0, sp = 3.2 + rnd() * 1.2;
        toy.v.set(Math.sin(a) * sp, 1.8, Math.cos(a) * sp); toy.energy--;
        spawnHeart(tp.clone().add(new THREE.Vector3(0, 0.45, 0.1)), false);
      }
      st.pounce = 'land'; st.pT = 0;
    } else if (st.pounce === 'land' && st.pT > 0.7 && !st.air) { st.hopTo.set(0, 0); st.vy = 2.8; st.air = true; st.pounce = 'back'; }
    else if (st.pounce === 'back' && !st.air) { st.pounce = ''; st.pCool = TOY.cooldown; }
  }
  if (st.air && (st.pounce === 'leap' || st.pounce === 'back')) { rp.x = damp(rp.x, st.hopTo.x, 7, dt); rp.z = damp(rp.z, st.hopTo.y, 7, dt); }
  else if (!st.pounce) { rp.x = damp(rp.x, 0, 3, dt); rp.z = damp(rp.z, 0, 3, dt); }
  const crouch = st.pounce === 'crouch' ? smooth(0, 0.2, st.pT) : 0;

  const petting = onCat && (st.speed > 60 || st.down);
  st.pet = clamp(st.pet + (petting ? dt * (st.hover === 'head' ? 1.3 : 0.9) : -dt * 0.45), 0, 1);
  if (!st.happy && st.pet > 0.38) st.happy = true;
  if (st.happy && st.pet < 0.15) st.happy = false;
  if (st.hover && !hintGone && !MANUAL) { hintGone = true; hintEl.classList.add('gone'); }
  // 오래 쓰다듬으면 마고·미코가 나타난다 (나타나 있는 동안엔 다시 쌓지 않음)
  if (st.mem < 0) st.petTime = petting ? st.petTime + dt : Math.max(0, st.petTime - dt * 0.5);
  if (st.mem < 0 && C.ghosts && st.petTime >= MEMORY.petSeconds) { st.mem = 0; st.petTime = 0; st.visit = -1; st.slowBlink = false; }
  // 오래 혼자 두면 마고·미코가 번갈아 잠깐 찾아온다
  if (st.mem < 0 && st.visit < 0 && C.ghosts && st.idle > st.visitAt) { st.visit = 0; st.visitCat = (st.visitCat + 1) % C.ghosts.length; }

  if (st.happy && petting && st.hit) { st.heartT -= dt; if (st.heartT <= 0) { st.heartT = 0.32; spawnHeart(st.hit.clone().add(new THREE.Vector3(0, 0.12, 0.25)), false); } }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i]; h.t += dt; h.s.position.y += dt * 0.75; h.s.position.x += h.vx * dt;
    const k = Math.min(h.t / 0.22, 1); h.s.scale.setScalar(h.size * (1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2)));
    h.s.material.opacity = 1 - smooth(h.life * 0.55, h.life, h.t); h.s.material.rotation = Math.sin(h.t * 3 + i) * 0.25;
    if (h.t > h.life) { scene.remove(h.s); h.s.material.dispose(); hearts.splice(i, 1); }
  }

  // 시선
  tmp.set(-0.1 + rp.x, 1.7 + st.y, 0.6 + rp.z).project(camera);
  const hx = (tmp.x + 1) / 2 * innerWidth, hy = (1 - tmp.y) / 2 * innerHeight, ss = Math.min(innerWidth, innerHeight);
  const lookAtScreen = (x, y) => [LOOK.yaw * Math.tanh((x - hx) / ss * 2.2), (y > hy ? LOOK.down : LOOK.up) * Math.tanh((y - hy) / ss * 2.4)];
  let tyaw, tpitch, ttilt = 0;
  if (st.inside && st.idle < 6) [tyaw, tpitch] = lookAtScreen(st.px, st.py);
  else { tyaw = Math.sin(t * 0.27) * 0.18 + Math.sin(t * 0.11) * 0.08; tpitch = Math.sin(t * 0.19) * 0.04 - 0.02; }
  if (st.toyLook > 0.01) { // 털실을 눈으로 좇는다
    tmp.copy(tp).project(camera);
    const [ya, pa] = lookAtScreen((tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight);
    tyaw = lerp(tyaw, ya, st.toyLook); tpitch = lerp(tpitch, pa, st.toyLook);
  }
  if (st.happy) { tpitch = -0.1 + tpitch * 0.3; ttilt = clamp(-st.vx / 1800, -LOOK.tilt, LOOK.tilt) + Math.sin(t * 2.2) * 0.05; tyaw *= 0.4; }
  tpitch = lerp(tpitch, -0.13, st.memA * 0.7); // 마고·미코가 곁에 있는 동안 살짝 올려다봄
  const visitDir = st.visitLook > 0 ? Math.sign(MEMORY.cats[st.visitCat].x) : 0; // 찾아온 아이 쪽
  if (visitDir) { tyaw = lerp(tyaw, visitDir * LOOK.yaw, st.visitLook); tpitch = lerp(tpitch, -0.1, st.visitLook); ttilt = lerp(ttilt, visitDir * 0.08, st.visitLook); }
  st.curious = Math.max(0, st.curious - dt);
  if (st.curious > 0) ttilt += 0.18 * smooth(0, 0.3, st.curious) * smooth(1.6, 1.2, 1.6 - st.curious + 1e-4);
  st.yaw = damp(st.yaw, tyaw, st.happy ? 5 : 7, dt); st.pitch = damp(st.pitch, tpitch, 6, dt); st.tilt = damp(st.tilt, ttilt, 5, dt);
  // 고개 돌림의 일부는 가슴·허리가 나눠 맡는다 (아래 전신 자세에서). st.hOff 는 동작이 머리에 더하는 각도
  B.head.rotation.set(HEAD_REST.pitch + st.pitch * 0.75 + st.hOff[0], HEAD_REST.yaw + st.yaw * 0.6 + st.hOff[1], HEAD_REST.roll + st.tilt * 0.8 + st.hOff[2], 'YXZ');

  // 표정
  st.nextBlink -= dt; if (st.nextBlink <= 0) { st.blink = 0.15; st.nextBlink = 2.4 + rnd() * 3.5; }
  st.blink = Math.max(0, st.blink - dt);
  const face = st.happy ? 'happy' : st.blink > 0 || st.slowBlink || st.shut ? 'closed' : 'open'; st.face = face;
  if (C.faces) {
    C.faces.happy.forEach(m => { m.visible = face === 'happy'; });
    C.faces.closed.forEach(m => { m.visible = face === 'closed'; });
    C.faces.blush.forEach(m => { m.material.opacity = damp(m.material.opacity, st.happy ? 0.9 : st.pet * 0.4, 5, dt); });
  }

  // 귀
  const near = st.inside ? smooth(0.6, 0.15, Math.hypot(st.px - hx, st.py - hy) / Math.min(innerWidth, innerHeight)) : 0;
  const earT = st.happy ? 1 : lerp(st.hover === 'head' ? 0.55 : -0.3 * near, -0.4, st.toyLook * 0.8); // 털실을 볼 땐 귀를 앞으로 쫑긋
  st.earBack = damp(st.earBack, lerp(earT, -0.25, Math.max(st.memA, st.visitLook)), 6, dt);
  const flop = Math.sin(t * 6) * 0.05 * (st.happy ? 1 : 0.3);
  const twitch = Math.max(0, Math.sin(t * 0.9) * Math.sin(t * 2.3)) ** 8 * 0.4; // 가끔 귀 쫑긋
  B.earR.rotation.set(-0.4 * st.earBack + twitch * 0.5, 0, -0.25 * Math.max(st.earBack, 0) - flop - twitch * 0.4);
  const twitchL = Math.max(0, Math.sin(t * 0.7 + 2) * Math.sin(t * 1.9)) ** 8 * 0.3; // 왼쪽 귀 끝도 따로 쫑긋
  B.earL.rotation.set(0, 0, 0.12 * st.earBack + flop * 0.5 + twitchL);
  // 꼬리
  // 고양이 꼬리: 평소엔 끝만 천천히 살랑, 기쁘면 꼿꼿이 세우고 끝을 떨기
  // 사냥할 땐 꼬리 끝을 빠르게 탁탁
  st.wagSpeed = damp(st.wagSpeed, st.happy ? 9 : st.pounce ? 12 : st.toyLook > 0.5 ? 6 : near > 0.3 ? 4 : 2, 3, dt);
  st.wagAmp = damp(st.wagAmp, st.happy ? 0.18 : st.pounce ? 0.3 : st.toyLook > 0.5 ? 0.22 : near > 0.3 ? 0.25 : 0.15, 3, dt);
  st.wag += dt * st.wagSpeed;
  st.tailUp = damp(st.tailUp || 0, st.happy ? 1 : 0, 3, dt);
  // 뿌리는 바닥 쪽 꼬리를 좌우로 쓸고, 선 부분은 옆으로 흔들고, 끝은 한 박자 늦게 따라온다
  B.tail.rotation.set(-0.15 * st.tailUp, Math.sin(st.wag * 0.5) * st.wagAmp * 0.5, 0);
  B.tail2.rotation.set(-0.2 * st.tailUp + Math.sin(st.wag * 0.8) * 0.04, 0, Math.sin(st.wag) * st.wagAmp * 0.9);
  B.tail3.rotation.set(-0.3 * st.tailUp, Math.sin(st.wag - 0.9) * st.wagAmp * 0.6, Math.sin(st.wag - 0.9) * st.wagAmp * 1.1);

  // ───── 전신 자세: 상황별 목표 각도(라디안, 쉬는 자세 기준)를 더한 뒤 관절마다 부드럽게 따라간다
  // x: 앞으로 숙이기·들기(-)/뒤로(+), y: 좌우로 돌리기, z: 옆으로 기울이기
  const P = {}; for (const k of BODY) P[k] = [0, 0, 0];
  const add = (k, x, y = 0, z = 0) => { P[k][0] += x; P[k][1] += y; P[k][2] += z; };
  const H = [0, 0, 0];  // 머리에 더할 각도 (아래로 숙이기 +, 오른쪽(+x)으로 돌리기 +, 기울이기)
  let limbK = 8, shut = false;
  const calm = st.happy || st.pounce || st.air || st.swat >= 0 ? 0.3 : 1;
  // 시선을 따라 허리·가슴도 함께 돈다
  add('spine', st.pitch * 0.1, st.yaw * 0.12, st.tilt * 0.08); add('chest', st.pitch * 0.12, st.yaw * 0.22, st.tilt * 0.12);
  if (!reduceMotion) { // 숨쉬기와 무게중심 옮기기: 가만있어도 몸 곳곳이 조금씩 움직인다
    const br = Math.sin(t * 2.1), sw = Math.sin(t * 0.37) * calm, sw2 = Math.sin(t * 0.23 + 1) * calm;
    add('chest', -0.015 * br); add('shoulderR', 0, 0, -0.02 * br); add('shoulderL', 0, 0, 0.02 * br);
    add('root', 0, 0, 0.012 * sw); add('spine', 0, 0.02 * sw2, -0.018 * sw); add('chest', 0.01 * sw2, 0, -0.012 * sw);
    add('shoulderR', 0.02 * sw); add('shoulderL', -0.02 * sw);                       // 무게 실린 쪽 어깨가 내려감
  }
  if (st.toyLook > 0.01 && !st.pounce) { // 털실을 보며 몸을 숙이고 어깨를 웅크린 채 앞발 준비
    const k = st.toyLook;
    add('spine', 0.03 * k); add('chest', 0.05 * k); add('shoulderR', -0.05 * k); add('shoulderL', -0.05 * k);
    add('armR', -0.25 * k); add('pawR', -0.15 * k);
  }
  if (st.pounce === 'crouch') { // 몸을 낮추고 어깨뼈를 세운 채 뒷다리를 번갈아 구르며 엉덩이 씰룩
    const c = crouch, w = Math.sin(t * 24);
    add('spine', 0.08 * c); add('chest', 0.14 * c); H[0] -= 0.1 * c;
    add('shoulderR', -0.12 * c, 0, 0.05 * c); add('shoulderL', -0.12 * c, 0, -0.05 * c);
    add('armR', -0.15 * c); add('armL', -0.12 * c); add('forearmL', 0.15 * c);
    add('root', 0, 0, 0.03 * w * c); add('legR', (-0.06 + 0.08 * w) * c); add('legL', (-0.06 - 0.08 * w) * c);
  } else if (st.air && st.pounce === 'leap') { // 덮칠 땐 몸을 쭉: 앞발은 앞으로, 뒷다리·발끝은 뒤로
    add('spine', 0.05); add('chest', 0.1); H[0] += 0.08; add('shoulderR', -0.1); add('shoulderL', -0.1);
    add('armR', -0.5); add('pawR', -0.3); add('armL', -0.3); add('forearmL', 0.1); add('pawL', -0.15);
    add('legR', 0.15); add('legL', 0.15); limbK = 12;
  } else if (st.pounce === 'land') { // 앞발로 꾹 누르고 어깨로 받음
    const k = 1 - smooth(0.3, 0.7, st.pT);
    add('chest', 0.15 * k); add('spine', 0.05 * k); H[0] += 0.06 * k; add('shoulderR', 0.1 * k); add('shoulderL', 0.1 * k);
    add('armR', 0.3 * k); add('armL', 0.25 * k); add('forearmL', -0.2 * k); add('pawL', 0.2 * k); limbK = 16;
  } else if (st.air) { // 점프: 올라갈 땐 뻗고, 내려올 땐 앞발로 착지 준비
    const k = clamp(st.vy / 4, -1, 1);
    add('chest', -0.05 * k); add('armR', -0.3 - 0.1 * k); add('armL', -0.15 - 0.1 * k); add('forearmL', 0.1 + 0.1 * k); add('pawL', -0.1 * k);
    add('legR', 0.05 + 0.08 * k); add('legL', 0.05 + 0.08 * k); limbK = 10;
  }
  if (st.happy && petting) { // 꾹꾹이: 앞발을 번갈아 누르고, 어깨·가슴이 따라 흔들림
    const s = Math.sin(t * 4.2), a = Math.max(0, s), b = Math.max(0, -s);
    add('armR', 0.3 - 0.4 * a); add('pawR', 0.2 * a); add('shoulderR', -0.06 * a);
    add('armL', -0.25 * b); add('forearmL', 0.2 * b); add('pawL', -0.12 * b); add('shoulderL', -0.06 * b);
    add('chest', 0.04, 0, 0.03 * s); add('spine', 0.02); H[2] -= 0.03 * s; limbK = 10;
  }
  // 앞발로 툭: 커서가 앞발 가까이에서 빠르게 지나가거나, 털실이 바로 옆에 멈춰 있을 때
  st.swatCool = Math.max(0, st.swatCool - dt);
  B.pawR.getWorldPosition(tmp).project(camera);
  const pawX = (tmp.x + 1) / 2 * innerWidth, pawY = (1 - tmp.y) / 2 * innerHeight;
  const swatOk = st.swat < 0 && st.swatCool <= 0 && !st.happy && !st.pounce && !st.air && !toy.held && !st.fidget;
  if (swatOk && st.inside && st.hover !== 'head' && !st.down && st.speed > 500 && Math.hypot(st.px - pawX, st.py - pawY) < ss * 0.16) { st.swat = 0; st.swatDir = Math.sign(st.px - pawX) || 1; st.swatToy = false; }
  else if (swatOk && tdist < TOY.catR + TOY.r + 0.25 && toy.quiet > 0.8 && toy.quiet < 6) { st.swat = 0; st.swatDir = Math.sign(tdx) || 1; st.swatToy = true; }
  if (st.swat >= 0) { // 어깨를 끌어올려 치켜들었다가, 가슴을 비틀며 휘두른다
    const s0 = st.swat; st.swat += dt; const s = st.swat;
    const up = smooth(0, 0.1, s) * (1 - smooth(0.1, 0.2, s)), hit = smooth(0.1, 0.18, s) * (1 - smooth(0.25, 0.45, s));
    const side = st.swatDir > 0 ? 0.5 : 1; // 몸 안쪽(+x)으로는 덜 휘둘러 왼 앞다리를 뚫지 않게
    add('armR', -0.5 * up + 0.35 * hit, 0.15 * side * st.swatDir * hit, 0.12 * side * st.swatDir * hit); add('pawR', -0.3 * up + 0.25 * hit);
    add('shoulderR', -0.15 * up + 0.08 * hit, 0, 0.1 * st.swatDir * hit); add('chest', 0.05 * hit, 0.12 * side * st.swatDir * hit); H[1] += 0.06 * st.swatDir * hit; limbK = 30;
    if (st.swatToy && s0 < 0.16 && s >= 0.16) { const a = Math.atan2(tdx, tdz) + st.swatDir * 0.4; toy.v.set(Math.sin(a) * 2, 0.8, Math.cos(a) * 2); toy.quiet = 0; }
    if (s > 0.45) { st.swat = -1; st.swatCool = 0.9; }
  }
  // 가만히 두면 가끔: 앞발로 바닥 톡톡 · 왼발 들었다 놓기 · 앞발 세수 · 기지개
  st.fidgetAt -= dt;
  if (!st.fidget && st.fidgetAt <= 0 && st.idle > 3 && swatOk && st.toyLook < 0.1 && st.mem < 0 && st.visit < 0) {
    const r = rnd(); st.fidget = r < 0.25 ? 'tap' : r < 0.45 ? 'step' : r < 0.75 ? 'groom' : 'stretch'; st.fT = 0;
  }
  if (st.fidget) {
    st.fT += dt; const f = st.fT, F = st.fidget;
    if (F === 'tap') { const k = Math.max(0, Math.sin(f * Math.PI * 2.5)) * (1 - smooth(1.0, 1.2, f)); add('armR', 0.45 * k); add('pawR', 0.2 * k); add('shoulderR', 0.05 * k); }
    else if (F === 'step') { const k = Math.sin(clamp(f / 0.9, 0, 1) * Math.PI); add('armL', -0.28 * k); add('forearmL', 0.22 * k); add('pawL', -0.12 * k); add('shoulderL', -0.06 * k); add('chest', 0.03 * k, 0, -0.03 * k); }
    else if (F === 'groom') { // 앞발 핥기: 앞발을 앞으로 들어 오므리고, 가슴을 숙여 고개를 까딱이며 핥는다 (머리가 커서 앞발을 입까지 올리진 못함)
      const k = smooth(0, 0.5, f) * (1 - smooth(2.9, 3.4, f)), lick = Math.max(0, Math.sin(f * 8)) * smooth(0.5, 0.8, f);
      add('shoulderR', -0.1 * k); add('armR', -0.45 * k, 0.12 * k); add('pawR', (-0.35 + 0.08 * lick) * k);
      add('spine', 0.04 * k); add('chest', (0.12 + 0.03 * lick) * k, -0.1 * k, 0.03 * k);
      H[0] += (0.12 + 0.07 * lick) * k; H[1] -= 0.14 * k; H[2] -= (0.06 + 0.03 * lick) * k; shut = k > 0.6; limbK = 12;
    } else if (F === 'stretch') { // 기지개: 앞발을 앞으로 쭉 뻗고 가슴을 낮춘 채 엉덩이를 들었다가 돌아옴
      const k = smooth(0, 0.8, f) * (1 - smooth(2.3, 3.2, f)), tr = Math.sin(f * 30) * 0.012 * smooth(0.8, 1.2, f) * (1 - smooth(2.0, 2.3, f));
      add('root', -0.04 * k); add('spine', 0.08 * k); add('chest', (0.16 + tr) * k); H[0] -= 0.14 * k;
      add('shoulderR', 0.1 * k); add('shoulderL', 0.1 * k);
      add('armR', -0.5 * k); add('pawR', -0.2 * k); add('armL', -0.3 * k); add('forearmL', 0.22 * k); add('pawL', -0.12 * k);
      add('legR', -0.1 * k); add('legL', -0.1 * k); shut = k > 0.5; limbK = 6;
    }
    if (f > ({ tap: 1.2, step: 1.2, groom: 3.4, stretch: 3.2 })[F]) { st.fidget = ''; st.fidgetAt = 6 + rnd() * 8; }
  }
  st.shut = shut;
  // 딛고 선 왼 앞다리는 몸을 숙여도 바닥을 짚도록 어깨에서 반대로 돌린다
  P.armL[0] -= P.root[0] + P.spine[0] + P.chest[0] + P.shoulderL[0];
  for (const k of BODY) for (let i = 0; i < 3; i++) P[k][i] = clamp(P[k][i], LIMIT[k][i][0], LIMIT[k][i][1]);
  for (let i = 0; i < 3; i++) st.hOff[i] = damp(st.hOff[i], H[i], limbK, dt);
  for (const k of BODY) { // 몸통은 조금 더 묵직하게 따라간다
    const r = B[k].rotation, p = P[k], kk = k === 'root' || k === 'spine' ? Math.min(limbK, 10) : limbK;
    r.set(damp(r.x, p[0], kk, dt), damp(r.y, p[1], kk, dt), damp(r.z, p[2], kk, dt));
  }

  // 점프 · 찌그러짐
  if (st.air) { st.vy -= 14 * dt; st.y += st.vy * dt; if (st.y <= 0) { st.y = 0; st.air = false; st.sqv -= 6.5 - Math.min(3, Math.abs(st.vy) * 0.2); st.vy = 0; } }
  const press = (st.down && onCat ? 0.55 : 0) + (st.happy ? 0.12 + 0.06 * Math.sin(t * 9) : 0);
  st.sqv += (-120 * st.sq - 9 * st.sqv) * dt; st.sq += st.sqv * dt;
  st.hsqv += (-160 * (st.hsq - press) - 11 * st.hsqv) * dt; st.hsq += st.hsqv * dt;
  const stretch = st.air ? clamp(st.vy * 0.035, -0.12, 0.14) : 0;
  const sq = clamp(-st.sq * 0.09, -0.16, 0.16) + stretch - crouch * 0.07; // 덮치기 전 몸을 낮춤
  C.rig.position.y = st.y; C.rig.scale.set(1 - sq * 0.55, 1 + sq, 1 - sq * 0.55);
  B.head.scale.set(1 + st.hsq * 0.06, 1 - st.hsq * 0.09, 1 + st.hsq * 0.05);
  const breath = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.012;
  B.spine.scale.set(1 + breath * 0.6, 1 + breath, 1 + breath * 0.6);
  C.sway.rotation.z = st.happy ? Math.sin(t * 4.5) * 0.04 : crouch ? Math.sin(t * 24) * 0.035 * crouch : damp(C.sway.rotation.z, 0, 4, dt); // 엉덩이 씰룩
  const toyTurn = clamp(Math.atan2(tdx, tdz), -0.7, 0.7) * (st.pounce ? 0.45 : st.toyLook * 0.15); // 털실 쪽으로 몸을 돌림 (얼굴이 가려지지 않을 만큼만)
  C.sway.rotation.y = damp(C.sway.rotation.y, st.yaw * 0.15 + visitDir * 0.32 * st.visitLook + toyTurn, st.pounce ? 8 : 4, dt); // 찾아온 아이 쪽으로 몸을 돌림
  const lift = clamp(st.y / 1.2, 0, 1); contact.scale.setScalar(1 - lift * 0.35); contact.material.opacity = 1 - lift * 0.6;
  contact.position.x = rp.x; contact.position.z = rp.z;
  if (C.ghosts) updateGhosts(dt, t);
  renderer.render(scene, camera);
}

// ───────── 모델 불러오기
function b64ToBuf(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
new GLTFLoader().parse(b64ToBuf(window.CHAR_GLB_B64), '', gltf => {
  const { sk, bones, plain, mat, geo } = rig(gltf.scene);
  const r = new THREE.Group(); const sway = new THREE.Group(); const g = new THREE.Group();
  g.scale.setScalar(SCALE); g.position.y = 0; g.add(sk); sway.add(g); r.add(sway); scene.add(r);
  g.updateMatrixWorld(true);
  let faces = null; try { faces = buildFaces(plain, mat, bones.head); } catch (e) { console.warn('표정 만들기 실패', e); }
  let ghosts = null; try { if (window.GHOST_TEX) ghosts = makeGhosts(geo, mat); } catch (e) { console.warn('마고·미코 만들기 실패', e); }
  C = { rig: r, sway, group: g, bones, mat, faces, ghosts, proxies: proxies(bones) };
  window.__loaded = true;
}, e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<div class="err">모델을 불러오지 못했습니다.</div>'); });

if (MANUAL) {
  window.__frame = (dt, o = {}) => { if (o.mx != null) setPointer(o.mx, o.my, !!o.down); else leave(); if (o.click) doClick(); if (o.visit) st.visitAt = 0; if (o.fidget) { st.fidget = o.fidget; st.fT = 0; } step(dt); return { hover: st.hover, happy: st.happy, face: st.face, faces: !!(C && C.faces), petTime: st.petTime, mem: st.mem, memA: st.memA, visit: st.visit, visitLook: st.visitLook, toyHeld: toy.held, pounce: st.pounce, swat: st.swat >= 0, fidget: st.fidget }; };
  window.__anchors = () => { const pr = v => { v.project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
    return { headTop: pr(new THREE.Vector3(-0.15, 2.3, 0.4)), belly: pr(new THREE.Vector3(0, 0.75, 0.75)), head: pr(new THREE.Vector3(-0.1, 1.7, 0.8)),
      toy: pr(toy.g.position.clone()), paw: pr(C.bones.pawR.getWorldPosition(new THREE.Vector3())), floor: (x, z) => pr(new THREE.Vector3(x, TOY.r + TOY.hold, z)) }; };
  window.__ready = true;
} else {
  let last = performance.now();
  renderer.setAnimationLoop(now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!document.hidden) step(dt); });
}
