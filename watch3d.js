// Real-time 3D model of a GMT-Master II "Pepsi" (Jubilee), built procedurally with three.js.
// Loaded on demand by index.html when the Pepsi lot is opened; mount(host) moves one shared canvas into the gallery slide.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let V = null;

function tex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const zAxis = g => g.rotateX(Math.PI / 2); // three.js lathes/cylinders run along Y; the watch axis is Z

function build() {
  const W = new THREE.Group();
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xeef0f3, metalness: 1, roughness: 0.2, clearcoat: 0.4, envMapIntensity: 1.9 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: 0xe4e7eb, metalness: 1, roughness: 0.36, envMapIntensity: 1.8 });
  const lume = new THREE.MeshStandardMaterial({ color: 0xf3efe2, roughness: 0.55, emissive: 0x2a2a24 });

  // case middle
  const caseP = [[0, -6.2], [17.4, -6.2], [18.9, -5.5], [19.7, -3.9], [20.1, -1.4], [20.1, 2.4], [19.4, 3.5], [18.6, 3.9]].map(([r, z]) => new THREE.Vector2(r, z));
  W.add(new THREE.Mesh(zAxis(new THREE.LatheGeometry(caseP, 160)), steel));
  // caseback
  const back = new THREE.Mesh(zAxis(new THREE.CylinderGeometry(17.2, 17.2, 0.6, 96)), brushed); back.position.z = -6.4; W.add(back);

  // lugs + end links (sloping back towards the wrist)
  for (const sy of [1, -1]) {
    for (const sx of [1, -1]) {
      const lug = new THREE.Mesh(new RoundedBoxGeometry(4.4, 9.6, 6.2, 4, 1.5), steel);
      lug.position.set(sx * 8.8, sy * 18.6, -1.1); lug.rotation.x = -sy * 0.2; W.add(lug);
    }
    const end = new THREE.Mesh(new RoundedBoxGeometry(13, 4.8, 4.8, 4, 1.3), brushed);
    end.position.set(0, sy * 22.2, -2.4); end.rotation.x = -sy * 0.3; W.add(end);
  }
  // crown guards + crown at 3 o'clock
  const guard = new THREE.Mesh(new RoundedBoxGeometry(2.6, 10.5, 5.4, 4, 1.2), steel); guard.position.set(20.5, 0, -0.6); W.add(guard);
  const crownMat = new THREE.MeshPhysicalMaterial({ color: 0xeef0f3, metalness: 1, roughness: 0.22, flatShading: true, envMapIntensity: 1.9 });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 3.6, 32), crownMat); crown.rotation.z = Math.PI / 2; crown.position.set(22.6, 0, -0.6); W.add(crown);

  // rotating bezel (with fine coin edge) + red/blue 24-hour insert
  const bezP = [[15.4, 3.7], [15.4, 4.7], [15.8, 5.25], [19.5, 5.45], [20.35, 5.0], [20.45, 4.0], [20.0, 3.6]].map(([r, z]) => new THREE.Vector2(r, z));
  W.add(new THREE.Mesh(zAxis(new THREE.LatheGeometry(bezP, 180)), steel));
  const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.5, 1.15), steel, 120), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2; q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a); m4.compose(new THREE.Vector3(Math.cos(a) * 20.45, Math.sin(a) * 20.45, 4.45), q, new THREE.Vector3(1, 1, 1)); teeth.setMatrixAt(i, m4) }
  W.add(teeth);
  const IN = 15.9, OUT = 19.35;
  const bezelTex = tex(1024, (g, S) => {
    const c = S / 2, R = c, r = c * IN / OUT;
    g.fillStyle = '#1d3f93'; g.beginPath(); g.arc(c, c, R, Math.PI, 2 * Math.PI); g.arc(c, c, r, 2 * Math.PI, Math.PI, true); g.fill();
    g.fillStyle = '#a3142a'; g.beginPath(); g.arc(c, c, R, 0, Math.PI); g.arc(c, c, r, Math.PI, 0, true); g.fill();
    const mid = (R + r) / 2; g.fillStyle = '#e6e6ea'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let h = 0; h < 24; h++) {
      const a = h / 24 * Math.PI * 2; g.save(); g.translate(c + Math.sin(a) * mid, c - Math.cos(a) * mid); g.rotate(a);
      if (h === 0) { g.beginPath(); g.moveTo(-26, -24); g.lineTo(26, -24); g.lineTo(0, 22); g.closePath(); g.fill() }
      else if (h % 2 === 0) { g.font = '600 62px "Helvetica Neue", Arial, sans-serif'; g.fillText(String(h), 0, 2) }
      else { g.beginPath(); g.moveTo(-9, -10); g.lineTo(9, -10); g.lineTo(0, 9); g.closePath(); g.fill() }
      g.restore();
    }
  });
  const insert = new THREE.Mesh(new THREE.RingGeometry(IN, OUT, 160), new THREE.MeshPhysicalMaterial({ map: bezelTex, roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }));
  insert.position.z = 5.5; W.add(insert);

  // rehaut + dial
  const rehaut = new THREE.Mesh(zAxis(new THREE.LatheGeometry([new THREE.Vector2(14.7, 2.25), new THREE.Vector2(15.5, 3.9)], 120)), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.45, side: THREE.DoubleSide }));
  W.add(rehaut);
  const dialTex = tex(1024, (g, S) => {
    const c = S / 2, grd = g.createRadialGradient(c * 0.8, c * 0.7, 20, c, c, c); grd.addColorStop(0, '#26282d'); grd.addColorStop(1, '#0b0c0e');
    g.fillStyle = grd; g.fillRect(0, 0, S, S); g.strokeStyle = '#e9e9ec'; g.lineCap = 'round';
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r1 = c * (i % 5 ? 0.955 : 0.93), r2 = c * 0.985; g.lineWidth = i % 5 ? 3 : 5; g.beginPath(); g.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); g.lineTo(c + Math.sin(a) * r2, c - Math.cos(a) * r2); g.stroke() }
    g.fillStyle = '#d9d9dc'; g.font = '500 22px "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.fillText('SWISS MADE', c, S * 0.955);
  });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(14.8, 128), new THREE.MeshPhysicalMaterial({ map: dialTex, roughness: 0.28, metalness: 0.25, clearcoat: 0.6 }));
  dial.position.z = 2.2; W.add(dial);

  // applied hour markers (white-gold surrounds + lume)
  const surr = zAxis(new THREE.CylinderGeometry(1.36, 1.36, 0.42, 40)), dot = zAxis(new THREE.CylinderGeometry(1.08, 1.08, 0.5, 40));
  for (let h = 0; h < 12; h++) {
    const a = h / 12 * Math.PI * 2, x = Math.sin(a), y = Math.cos(a), R = 11.6;
    if (h === 3) continue;
    if (h === 0) {
      const s = new THREE.Shape(); s.moveTo(-1.9, 1.6); s.lineTo(1.9, 1.6); s.lineTo(0, -1.9); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.45, bevelEnabled: true, bevelSize: 0.18, bevelThickness: 0.12, bevelSegments: 2 });
      const m = new THREE.Mesh(g, lume); m.position.set(0, R, 2.25); W.add(m); continue;
    }
    if (h === 6 || h === 9) {
      const b = new THREE.Mesh(new RoundedBoxGeometry(1.7, 3.8, 0.5, 2, 0.2), lume); b.position.set(x * R, y * R, 2.5); b.rotation.z = -a; W.add(b);
      const bs = new THREE.Mesh(new RoundedBoxGeometry(2.1, 4.2, 0.4, 2, 0.2), steel); bs.position.set(x * R, y * R, 2.38); bs.rotation.z = -a; W.add(bs); continue;
    }
    const s1 = new THREE.Mesh(surr, steel); s1.position.set(x * R, y * R, 2.42); W.add(s1);
    const s2 = new THREE.Mesh(dot, lume); s2.position.set(x * R, y * R, 2.5); W.add(s2);
  }
  // date window at 3
  const dateTex = tex(256, (g, S) => { g.fillStyle = '#f7f6f2'; g.fillRect(0, 0, S, S); g.fillStyle = '#111'; g.font = '700 150px "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(new Date().getDate()), S / 2, S / 2 + 8) });
  const date = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshStandardMaterial({ map: dateTex, roughness: 0.6 })); date.position.set(11.6, 0, 2.26); W.add(date);
  const dateFrame = new THREE.Mesh(new RoundedBoxGeometry(3.9, 3.9, 0.3, 2, 0.15), steel); dateFrame.position.set(11.6, 0, 2.1); W.add(dateFrame);

  // hands
  const hand = (parts, z) => { const g = new THREE.Group(); parts.forEach(p => g.add(p)); g.position.z = z; W.add(g); return g };
  const bx = (w, l, y0, mat, d = 0.25) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, l, d, 1, Math.min(w, l, d) * 0.4), mat); m.position.y = y0 + l / 2; return m };
  const tri = (w, l, y0, mat) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, l); s.closePath(); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false }), mat); m.position.y = y0; return m };
  const red = new THREE.MeshPhysicalMaterial({ color: 0xb3172c, metalness: 0.3, roughness: 0.3, clearcoat: 1 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.32, 12, 40), steel); ring.position.y = 5.6;
  const ringLume = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), lume); ringLume.position.set(0, 5.6, 0.05);
  const hH = hand([bx(1.15, 6.6, -1.6, steel), ring, ringLume, tri(1.8, 2.2, 7.0, steel)], 2.75);
  const hM = hand([bx(1.15, 12.6, -2.2, steel), bx(0.55, 9.5, 1.5, lume, 0.3), tri(1.15, 1.6, 10.4, steel)], 3.05);
  const hG = hand([bx(0.42, 12.4, -2.4, red), tri(2.3, 2.6, 10.0, red), tri(1.2, 1.5, 10.4, lume)], 2.9);
  const sdot = new THREE.Mesh(zAxis(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 32)), lume); sdot.position.y = 9.6;
  const sring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.16, 10, 32), steel); sring.position.y = 9.6;
  const hS = hand([bx(0.3, 16.2, -3.4, steel), sdot, sring], 3.35);
  const cap = new THREE.Mesh(zAxis(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 32)), steel); cap.position.z = 3.0; W.add(cap);

  // sapphire crystal + cyclops over the date
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 0.6, ior: 1.6, transparent: true, opacity: 0.18, clearcoat: 1 });
  const crystal = new THREE.Mesh(zAxis(new THREE.CylinderGeometry(15.5, 15.5, 1.1, 96)), glass); crystal.position.z = 4.9; W.add(crystal);
  const cyclops = new THREE.Mesh(new RoundedBoxGeometry(4.8, 4.2, 1.2, 3, 0.55), glass); cyclops.position.set(11.6, 0, 5.9); W.add(cyclops);

  // Jubilee bracelet: rows of 5 links (2 brushed outer, 3/2 alternating polished centre) following the wrist curve
  const top = new THREE.CatmullRomCurve3([[24.4, -3.2], [30, -7], [33.6, -14.5], [33.2, -24.5], [28.6, -33.5], [19.5, -40.4], [8.5, -44.2], [0, -45.2]].map(([y, z]) => new THREE.Vector3(0, y, z)));
  const unit = new RoundedBoxGeometry(1, 1, 1, 2, 0.28);
  const outer = new THREE.InstancedMesh(unit, brushed, 260), centre = new THREE.InstancedMesh(unit, steel, 420);
  let no = 0, nc = 0; const L = top.getLength(), step = 2.05, X = new THREE.Vector3(1, 0, 0);
  for (const sy of [1, -1]) {
    for (let d = 0, row = 0; d < L - 8; d += step, row++) {
      const t = top.getUtoTmapping(d / L), p = top.getPoint(t), tg = top.getTangent(t);
      p.y *= sy; tg.y *= sy; if (sy < 0) tg.negate().setX(0);
      const T = new THREE.Vector3(0, sy > 0 ? tg.y : -tg.y, sy > 0 ? tg.z : -tg.z).normalize(), N = new THREE.Vector3().crossVectors(X, T);
      if (sy < 0) N.negate();
      const w = 20 - 4.5 * (d / L), basis = new THREE.Matrix4().makeBasis(X, T, N);
      const put = (mesh, i, x, sx, sY, sz) => { const m = basis.clone(); m.scale(new THREE.Vector3(sx, sY, sz)); m.setPosition(p.clone().add(X.clone().multiplyScalar(x))); mesh.setMatrixAt(i, m) };
      for (const s of [1, -1]) put(outer, no++, s * (w / 2 - w * 0.125), w * 0.25, 1.95, 2.3);
      const xs = row % 2 ? [-0.095, 0.095] : [-0.19, 0, 0.19];
      for (const f of xs) put(centre, nc++, f * w, w * 0.14, 1.75, 2.0);
    }
  }
  outer.count = no; centre.count = nc; W.add(outer, centre);
  const clasp = new THREE.Mesh(new RoundedBoxGeometry(15.4, 17, 3.2, 4, 1.2), steel); clasp.position.set(0, 0, -45.6); W.add(clasp);

  W.userData.hands = { hH, hM, hG, hS };
  return W;
}

function init() {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.02).texture;
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(40, 60, 80); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(-60, 20, -40); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e0d2, 0.9));
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 1000); camera.position.set(52, 26, 150);
  const watch = build(); watch.position.z = 14; scene.add(watch);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
  controls.minDistance = 70; controls.maxDistance = 230; controls.autoRotate = true; controls.autoRotateSpeed = 1.4;
  let idle; controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(idle) });
  controls.addEventListener('end', () => { idle = setTimeout(() => controls.autoRotate = true, 3500) });
  const { hH, hM, hG, hS } = watch.userData.hands;
  let cw = 0, ch = 0;
  const fit = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h || (w === cw && h === ch)) return; cw = w; ch = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() };
  renderer.setAnimationLoop(() => {
    if (!canvas.isConnected) return; // gallery not on screen: idle
    fit(); // follows the slide size (also after the canvas moves into a re-rendered gallery)
    const n = new Date(), s = n.getSeconds() + n.getMilliseconds() / 1000, m = n.getMinutes() + s / 60, h = n.getHours() + m / 60;
    hS.rotation.z = -s / 60 * Math.PI * 2; hM.rotation.z = -m / 60 * Math.PI * 2; hH.rotation.z = -(h % 12) / 12 * Math.PI * 2; hG.rotation.z = -h / 24 * Math.PI * 2;
    controls.update(); renderer.render(scene, camera);
  });
  return { canvas, fit };
}

export function mount(host) {
  if (!V) V = init();
  host.innerHTML = '';
  host.appendChild(V.canvas);
  V.canvas.style.width = '100%'; V.canvas.style.height = '100%'; V.canvas.style.display = 'block';
  requestAnimationFrame(V.fit);
}
