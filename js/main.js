import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BOTS = [
  { id: 'eldon', name: 'Eldon', role: '老板 / COO', color: 0xffaa44, room: 'boss', status: 'working', message: '统筹全局' },
  { id: 'grok', name: 'Grok', role: '总监', color: 0x00a8ff, room: 'coo', status: 'working', message: '调度任务' },
  { id: 'art', name: '美术总监', role: '美术统筹', color: 0xe74c3c, room: 'art', status: 'idle', message: '' },
  { id: 'designer', name: '设计师', role: '设计', color: 0xff6b9d, room: 'open', status: 'working', message: '设计中' },
  { id: 'video-gen', name: '影片生成师', role: '视频生成', color: 0x9b59b6, room: 'open', status: 'thinking', message: '' },
  { id: 'video-edit', name: '影片剪辑师', role: '剪辑', color: 0x3498db, room: 'open', status: 'working', message: '' },
  { id: 'copy', name: '文案', role: '文案', color: 0x1abc9c, room: 'open', status: 'done', message: '已完成' },
  ...Array.from({length: 6}, (_, i) => ({ id: `inv${i+1}`, name: `调查员${i+1}`, role: '调查', color: 0x2ecc71 + i*0x001100, room: 'open', status: 'idle', message: '' })),
  ...Array.from({length: 2}, (_, i) => ({ id: `script${i+1}`, name: `脚本师${i+1}`, role: '脚本', color: 0xf39c12, room: 'open', status: 'thinking', message: '' })),
  { id: 'judge', name: '法官', role: '主审', color: 0x2c3e50, room: 'court', status: 'idle', message: '' },
  { id: 'prosecutor', name: '检察官', role: '控方', color: 0xc0392b, room: 'court', status: 'working', message: '' },
  { id: 'defense', name: '辩护律师', role: '辩方', color: 0x27ae60, room: 'court', status: 'thinking', message: '' },
  ...Array.from({length: 12}, (_, i) => ({ id: `j${i+1}`, name: `陪审员${i+1}`, role: '陪审', color: 0xaaaaaa, room: 'court', status: 'idle', message: '' }))
];

const STATUS_COLORS = { working: 0x00ff00, thinking: 0xffff00, browsing: 0x00ffff, 'needs-help': 0xff0000, idle: 0x888888, done: 0x00ff88 };

let scene, camera, renderer, controls, botsMeshes = [], isNight = false, demoMode = false, ambientLight, directionalLight;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 35, 40);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.maxPolarAngle = Math.PI / 2.2;

  ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(15, 40, 20);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  buildOffice();
  createBots();
  setupUI();
  fetchBTC();
  animate();
  window.addEventListener('resize', onResize);
}

function addGlassWall(x, z, w, d, h = 4) {
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transparent: true, opacity: 0.15,
    roughness: 0.05, transmission: 0.95, thickness: 0.2
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameMat);
  frame.position.set(x, h/2, z);
  scene.add(frame);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w-0.1, h-0.2, 0.05), glassMat);
  glass.position.set(x, h/2, z);
  scene.add(glass);
}

function buildOffice() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), new THREE.MeshLambertMaterial({ color: 0xfafafa }));
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  addGlassWall(-22, -8, 12, 0);
  addGlassWall(-16, -8, 0, 10);
  addGlassWall(-28, -8, 0, 10);
  addGlassWall(-8, -8, 12, 0);
  addGlassWall(-2, -8, 0, 10);
  addGlassWall(-14, -8, 0, 10);
  addGlassWall(6, -8, 12, 0);
  addGlassWall(12, -8, 0, 10);
  addGlassWall(0, -8, 0, 10);
  addGlassWall(18, -8, 14, 0);
  addGlassWall(25, -8, 0, 10);
  addGlassWall(11, -8, 0, 10);

  const courtFloor = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), new THREE.MeshLambertMaterial({ color: 0xe8d5c4 }));
  courtFloor.rotation.x = -Math.PI/2;
  courtFloor.position.set(28, 0.01, 2);
  scene.add(courtFloor);
  const redCarpet = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshLambertMaterial({ color: 0xcc3333 }));
  redCarpet.rotation.x = -Math.PI/2;
  redCarpet.position.set(28, 0.02, 4);
  scene.add(redCarpet);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.9), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
      desk.position.set(-12 + col * 3.2, 0.3, 4 + row * 3.5);
      scene.add(desk);
      const mon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), new THREE.MeshLambertMaterial({ color: 0x333333 }));
      mon.position.set(desk.position.x, 0.9, desk.position.z - 0.3);
      scene.add(mon);
    }
  }

  const sofa1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 1.5), new THREE.MeshLambertMaterial({ color: 0x88cc88 }));
  sofa1.position.set(-8, 0.3, 18);
  scene.add(sofa1);
  const sofa2 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 1.5), new THREE.MeshLambertMaterial({ color: 0x666666 }));
  sofa2.position.set(2, 0.3, 18);
  scene.add(sofa2);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 0.2), new THREE.MeshLambertMaterial({ color: 0x111111 }));
  sign.position.set(8, 2, 12);
  scene.add(sign);
  const textCanvas = document.createElement('canvas');
  textCanvas.width = 512; textCanvas.height = 256;
  const ctx = textCanvas.getContext('2d');
  ctx.fillStyle = '#111'; ctx.fillRect(0,0,512,256);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 60px Arial'; ctx.fillText('CONNEXT MEDIA', 40, 140);
  const tex = new THREE.CanvasTexture(textCanvas);
  const signText = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.2), new THREE.MeshBasicMaterial({ map: tex }));
  signText.position.set(8, 2, 12.11);
  scene.add(signText);

  for (let i = 0; i < 8; i++) {
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshLambertMaterial({ color: 0x66bb66 }));
    plant.position.set(-20 + i*6, 0.8, -15 + (i%2)*30);
    scene.add(plant);
  }
}

function createChibi(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 16), new THREE.MeshLambertMaterial({ color }));
  body.position.y = 0.3;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 20), new THREE.MeshLambertMaterial({ color: 0xffe0c0 }));
  head.position.y = 1.0;
  g.add(head);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0x222 }));
  const le = eye.clone(); le.position.set(-0.15, 1.1, 0.48); g.add(le);
  const re = eye.clone(); re.position.set(0.15, 1.1, 0.48); g.add(re);
  const lp = pupil.clone(); lp.position.set(-0.15, 1.1, 0.53); g.add(lp);
  const rp = pupil.clone(); rp.position.set(0.15, 1.1, 0.53); g.add(rp);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  light.position.y = 1.6;
  g.add(light);
  return { group: g, light };
}

function createBots() {
  BOTS.forEach((bot, i) => {
    const { group, light } = createChibi(bot.color);
    bot.lightMesh = light;
    let pos = new THREE.Vector3(0, 0, 0);
    if (bot.room === 'boss') pos.set(-22, 0, -5);
    else if (bot.room === 'coo') pos.set(-8, 0, -5);
    else if (bot.room === 'art') pos.set(6, 0, -5);
    else if (bot.room === 'court') {
      if (bot.id === 'judge') pos.set(28, 0, 0);
      else if (bot.id === 'prosecutor') pos.set(24, 0, 6);
      else if (bot.id === 'defense') pos.set(32, 0, 6);
      else {
        const idx = parseInt(bot.id.replace('j','')) || 0;
        pos.set(22 + (idx % 6)*1.8, 0, 8 + Math.floor(idx/6)*1.5);
      }
    } else {
      const deskIdx = i % 24;
      pos.set(-12 + (deskIdx % 6)*3.2, 0, 4 + Math.floor(deskIdx/6)*3.5);
    }
    group.position.copy(pos);
    scene.add(group);
    botsMeshes.push({ bot, group, basePos: pos.clone() });
  });
}

function setupUI() {
  document.getElementById('dayNight').onclick = () => {
    isNight = !isNight;
    scene.background.set(isNight ? 0x1a1a2e : 0xf5f5f5);
    ambientLight.intensity = isNight ? 0.3 : 0.7;
  };
  document.getElementById('demoMode').onclick = () => {
    demoMode = !demoMode;
    document.getElementById('demoMode').textContent = demoMode ? '关闭演示' : '演示模式';
  };
  document.getElementById('resetView').onclick = () => {
    camera.position.set(0, 35, 40);
    controls.target.set(0, 0, 0);
  };
}

async function fetchBTC() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const d = await r.json();
    document.getElementById('btc').textContent = 'BTC: $' + d.bitcoin.usd.toLocaleString();
  } catch { document.getElementById('btc').textContent = 'BTC: --'; }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (demoMode && Math.random() < 0.008) {
    const b = BOTS[Math.floor(Math.random()*BOTS.length)];
    const sts = Object.keys(STATUS_COLORS);
    b.status = sts[Math.floor(Math.random()*sts.length)];
    if (b.lightMesh) b.lightMesh.material.color.setHex(STATUS_COLORS[b.status]);
  }
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
