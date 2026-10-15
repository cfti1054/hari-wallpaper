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

// ───────── 모델 → 뼈대 붙이기 (모델 좌표: 키 0.906, 바닥 y=0, 정면 +z)
const J = {
  root: [0, 0, 0], spine: [0, 0.2, 0], head: [-0.03, 0.43, -0.01],
  earL: [-0.27, 0.69, 0.12], earR: [0.05, 0.79, 0.08], tail: [-0.02, 0.1, -0.24], tail2: [0.24, 0.27, -0.4],
};
const PARENT = { spine: 'root', head: 'spine', earL: 'head', earR: 'head', tail: 'root', tail2: 'tail' };
const ORDER = ['root', 'spine', 'head', 'earL', 'earR', 'tail', 'tail2'];
// 머리를 정면 쪽으로 살짝 돌려 놓는 기본 각도 (원본은 왼쪽 위를 올려다보는 자세)
// 목걸이 고리를 맞춘 평면 (모델 텍스처의 초록 목걸이 정점으로 구함)
const COLLAR = { c: [-0.046, 0.392, 0.017], n: [-0.134, 0.953, 0.273] };
const HEAD_REST = { yaw: 0.14, pitch: 0.06, roll: -0.05 };
// 고개를 돌릴 수 있는 한계 (라디안). 너무 크게 돌리면 목 주변이 늘어나 얼굴이 일그러진다
const LOOK = { yaw: 0.32, up: 0.16, down: 0.14, tilt: 0.16 };

function weightsFor(x, y, z) {
  const w = {};
  const tail = smooth(-0.212, -0.245, z) * (1 - smooth(0.52, 0.58, y));
  const tail2 = tail * smooth(0.12, 0.24, x) * smooth(0.18, 0.3, y);
  // 머리와 몸통은 목걸이 면을 기준으로 나눈다. 목걸이보다 위는 볼·턱 털까지 모두 머리에 100% 붙여
  // 고개를 돌려도 얼굴 윤곽이 늘어나지 않게 한다 (목걸이 면: 중심 COLLAR.c, 법선 COLLAR.n)
  const d = (x - COLLAR.c[0]) * COLLAR.n[0] + (y - COLLAR.c[1]) * COLLAR.n[1] + (z - COLLAR.c[2]) * COLLAR.n[2];
  const paw = smooth(0.17, 0.22, z) * (1 - smooth(0.33, 0.37, y));   // 앞으로 든 앞발은 몸통 쪽
  const head = smooth(-0.004, 0.032, d) * (1 - paw) * (1 - tail);
  // 왼쪽 귀는 머리 옆면에 눕듯 붙어 있어 따로 움직이면 볼·관자놀이까지 끌려간다 → 머리와 함께 움직이게 고정
  const earL = 0;
  const earR = head * smooth(0.76, 0.82, y) * smooth(-0.05, 0.01, x);
  w.earL = earL; w.earR = earR; w.head = head - earL - earR;
  w.tail2 = tail2; w.tail = tail - tail2;
  const body = 1 - head - tail;
  const spine = body * smooth(0.08, 0.3, y);
  w.spine = spine; w.root = Math.max(0, body - spine);
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

  const bones = {};
  for (const k of ORDER) {
    const b = new THREE.Bone(); b.name = k;
    const pos = new THREE.Vector3(...J[k]);
    if (PARENT[k]) pos.sub(new THREE.Vector3(...J[PARENT[k]]));
    b.position.copy(pos); bones[k] = b;
    if (PARENT[k]) bones[PARENT[k]].add(b);
  }
  const om = mesh.material;
  const mat = new THREE.MeshPhysicalMaterial({
    map: om.map, normalMap: om.normalMap, normalScale: om.normalScale ? om.normalScale.clone() : new THREE.Vector2(1, 1),
    roughnessMap: om.roughnessMap, metalnessMap: om.metalnessMap, roughness: om.roughness, metalness: om.metalness,
    sheen: 0.3, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.6, side: THREE.DoubleSide,
  });
  const sk = new THREE.SkinnedMesh(geo, mat);
  sk.add(bones.root); sk.bind(new THREE.Skeleton(ORDER.map(k => bones[k])));
  sk.castShadow = true; sk.receiveShadow = true; sk.frustumCulled = false;
  const plain = new THREE.Mesh(geo, mat); // 표정 위치 찾기용 (정지 자세)
  return { sk, bones, plain, mat };
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
};
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmp = new THREE.Vector3();
let C = null; // 캐릭터
const SCALE = 2.62 / 0.906;

function setPointer(x, y, down) { st.px = x; st.py = y; st.down = down; st.inside = true; st.idle = 0; }
function leave() { st.inside = false; st.down = false; st.lastPX = null; }
function doClick() {
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
    const h = ray.intersectObjects(C.proxies, false)[0];
    if (h) { st.hover = h.object.userData.part; st.hit = h.point; }
  }
  renderer.domElement.style.cursor = st.hover ? (st.down ? 'grabbing' : 'grab') : 'default';

  const petting = st.hover && (st.speed > 60 || st.down);
  st.pet = clamp(st.pet + (petting ? dt * (st.hover === 'head' ? 1.3 : 0.9) : -dt * 0.45), 0, 1);
  if (!st.happy && st.pet > 0.38) st.happy = true;
  if (st.happy && st.pet < 0.15) st.happy = false;
  if (st.hover && !hintGone && !MANUAL) { hintGone = true; hintEl.classList.add('gone'); }

  if (st.happy && petting && st.hit) { st.heartT -= dt; if (st.heartT <= 0) { st.heartT = 0.32; spawnHeart(st.hit.clone().add(new THREE.Vector3(0, 0.12, 0.25)), false); } }
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i]; h.t += dt; h.s.position.y += dt * 0.75; h.s.position.x += h.vx * dt;
    const k = Math.min(h.t / 0.22, 1); h.s.scale.setScalar(h.size * (1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2)));
    h.s.material.opacity = 1 - smooth(h.life * 0.55, h.life, h.t); h.s.material.rotation = Math.sin(h.t * 3 + i) * 0.25;
    if (h.t > h.life) { scene.remove(h.s); h.s.material.dispose(); hearts.splice(i, 1); }
  }

  // 시선
  tmp.set(-0.1, 1.7, 0.6).project(camera);
  const hx = (tmp.x + 1) / 2 * innerWidth, hy = (1 - tmp.y) / 2 * innerHeight;
  let tyaw, tpitch, ttilt = 0;
  if (st.inside && st.idle < 6) { const s = Math.min(innerWidth, innerHeight); tyaw = LOOK.yaw * Math.tanh((st.px - hx) / s * 2.2); tpitch = (st.py > hy ? LOOK.down : LOOK.up) * Math.tanh((st.py - hy) / s * 2.4); }
  else { tyaw = Math.sin(t * 0.27) * 0.18 + Math.sin(t * 0.11) * 0.08; tpitch = Math.sin(t * 0.19) * 0.04 - 0.02; }
  if (st.happy) { tpitch = -0.1 + tpitch * 0.3; ttilt = clamp(-st.vx / 1800, -LOOK.tilt, LOOK.tilt) + Math.sin(t * 2.2) * 0.05; tyaw *= 0.4; }
  st.curious = Math.max(0, st.curious - dt);
  if (st.curious > 0) ttilt += 0.18 * smooth(0, 0.3, st.curious) * smooth(1.6, 1.2, 1.6 - st.curious + 1e-4);
  st.yaw = damp(st.yaw, tyaw, st.happy ? 5 : 7, dt); st.pitch = damp(st.pitch, tpitch, 6, dt); st.tilt = damp(st.tilt, ttilt, 5, dt);
  // 고개 돌림의 일부는 몸통이 나눠 맡아 목이 덜 꺾이게 한다
  B.head.rotation.set(HEAD_REST.pitch + st.pitch * 0.85, HEAD_REST.yaw + st.yaw * 0.7, HEAD_REST.roll + st.tilt * 0.85, 'YXZ');
  B.spine.rotation.set(st.pitch * 0.15, st.yaw * 0.3, st.tilt * 0.15, 'YXZ');

  // 표정
  st.nextBlink -= dt; if (st.nextBlink <= 0) { st.blink = 0.15; st.nextBlink = 2.4 + rnd() * 3.5; }
  st.blink = Math.max(0, st.blink - dt);
  const face = st.happy ? 'happy' : st.blink > 0 ? 'closed' : 'open'; st.face = face;
  if (C.faces) {
    C.faces.happy.forEach(m => { m.visible = face === 'happy'; });
    C.faces.closed.forEach(m => { m.visible = face === 'closed'; });
    C.faces.blush.forEach(m => { m.material.opacity = damp(m.material.opacity, st.happy ? 0.9 : st.pet * 0.4, 5, dt); });
  }

  // 귀
  const near = st.inside ? smooth(0.6, 0.15, Math.hypot(st.px - hx, st.py - hy) / Math.min(innerWidth, innerHeight)) : 0;
  st.earBack = damp(st.earBack, st.happy ? 1 : (st.hover === 'head' ? 0.55 : -0.3 * near), 6, dt);
  const flop = Math.sin(t * 6) * 0.05 * (st.happy ? 1 : 0.3);
  const twitch = Math.max(0, Math.sin(t * 0.9) * Math.sin(t * 2.3)) ** 8 * 0.4; // 가끔 귀 쫑긋
  B.earR.rotation.set(-0.4 * st.earBack + twitch * 0.5, 0, -0.25 * Math.max(st.earBack, 0) - flop - twitch * 0.4);
  // 꼬리
  // 고양이 꼬리: 평소엔 끝만 천천히 살랑, 기쁘면 꼿꼿이 세우고 끝을 떨기
  st.wagSpeed = damp(st.wagSpeed, st.happy ? 9 : near > 0.3 ? 4 : 2, 3, dt);
  st.wagAmp = damp(st.wagAmp, st.happy ? 0.18 : near > 0.3 ? 0.25 : 0.15, 3, dt);
  st.wag += dt * st.wagSpeed;
  st.tailUp = damp(st.tailUp || 0, st.happy ? 1 : 0, 3, dt);
  B.tail.rotation.set(-0.15 * st.tailUp, Math.sin(st.wag * 0.5) * st.wagAmp * 0.4, 0);
  B.tail2.rotation.set(-0.25 * st.tailUp, Math.sin(st.wag) * st.wagAmp, Math.sin(st.wag + 1) * st.wagAmp * 0.6);

  // 점프 · 찌그러짐
  if (st.air) { st.vy -= 14 * dt; st.y += st.vy * dt; if (st.y <= 0) { st.y = 0; st.air = false; st.sqv -= 6.5 - Math.min(3, Math.abs(st.vy) * 0.2); st.vy = 0; } }
  const press = (st.down && st.hover ? 0.55 : 0) + (st.happy ? 0.12 + 0.06 * Math.sin(t * 9) : 0);
  st.sqv += (-120 * st.sq - 9 * st.sqv) * dt; st.sq += st.sqv * dt;
  st.hsqv += (-160 * (st.hsq - press) - 11 * st.hsqv) * dt; st.hsq += st.hsqv * dt;
  const stretch = st.air ? clamp(st.vy * 0.035, -0.12, 0.14) : 0;
  const sq = clamp(-st.sq * 0.09, -0.16, 0.16) + stretch;
  C.rig.position.y = st.y; C.rig.scale.set(1 - sq * 0.55, 1 + sq, 1 - sq * 0.55);
  B.head.scale.set(1 + st.hsq * 0.06, 1 - st.hsq * 0.09, 1 + st.hsq * 0.05);
  const breath = reduceMotion ? 0 : Math.sin(t * 2.1) * 0.012;
  B.spine.scale.set(1 + breath * 0.6, 1 + breath, 1 + breath * 0.6);
  C.sway.rotation.z = st.happy ? Math.sin(t * 4.5) * 0.04 : damp(C.sway.rotation.z, 0, 4, dt);
  C.sway.rotation.y = damp(C.sway.rotation.y, st.yaw * 0.15, 4, dt);
  const lift = clamp(st.y / 1.2, 0, 1); contact.scale.setScalar(1 - lift * 0.35); contact.material.opacity = 1 - lift * 0.6;
  renderer.render(scene, camera);
}

// ───────── 모델 불러오기
function b64ToBuf(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
new GLTFLoader().parse(b64ToBuf(window.CHAR_GLB_B64), '', gltf => {
  const { sk, bones, plain, mat } = rig(gltf.scene);
  const r = new THREE.Group(); const sway = new THREE.Group(); const g = new THREE.Group();
  g.scale.setScalar(SCALE); g.position.y = 0; g.add(sk); sway.add(g); r.add(sway); scene.add(r);
  g.updateMatrixWorld(true);
  let faces = null; try { faces = buildFaces(plain, mat, bones.head); } catch (e) { console.warn('표정 만들기 실패', e); }
  C = { rig: r, sway, group: g, bones, mat, faces, proxies: proxies(bones) };
  window.__loaded = true;
}, e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<div class="err">모델을 불러오지 못했습니다.</div>'); });

if (MANUAL) {
  window.__frame = (dt, o = {}) => { if (o.mx != null) setPointer(o.mx, o.my, !!o.down); else leave(); if (o.click) doClick(); step(dt); return { hover: st.hover, happy: st.happy, face: st.face, faces: !!(C && C.faces) }; };
  window.__anchors = () => { const pr = v => { v.project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
    return { headTop: pr(new THREE.Vector3(-0.15, 2.3, 0.4)), belly: pr(new THREE.Vector3(0, 0.75, 0.75)), head: pr(new THREE.Vector3(-0.1, 1.7, 0.8)) }; };
  window.__ready = true;
} else {
  let last = performance.now();
  renderer.setAnimationLoop(now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!document.hidden) step(dt); });
}
