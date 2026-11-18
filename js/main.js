import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Bot definitions
const BOTS = [
  { id: 'grok', name: 'Grok', role: '总监 / 调度', color: 0x00a8ff, room: 'director', status: 'working', message: '调度团队任务' },
  { id: 'designer', name: '设计师', role: '视觉设计', color: 0xff6b9d, room: 'open', status: 'idle', message: '' },
  { id: 'video-gen', name: '影片生成师', role: 'AI 视频生成', color: 0x9b59b6, room: 'open', status: 'thinking', message: '构思镜头' },
  { id: 'video-edit', name: '影片剪辑师', role: '后期剪辑', color: 0x3498db, room: 'open', status: 'working', message: '剪辑广告' },
  { id: 'art-director', name: '美术总监', role: '美术统筹', color: 0xe74c3c, room: 'art', status: 'idle', message: '' },
  { id: 'invest1', name: '调查员1', role: '商品调查', color: 0x2ecc71, room: 'open', status: 'browsing', message: '调研竞品' },
  { id: 'invest2', name: '调查员2', role: '商品调查', color: 0x27ae60, room: 'open', status: 'working', message: '收集数据' },
  { id: 'invest3', name: '调查员3', role: '商品调查', color: 0x16a085, room: 'open', status: 'idle', message: '' },
  { id: 'invest4', name: '调查员4', role: '商品调查', color: 0xf1c40f, room: 'open', status: 'thinking', message: '分析趋势' },
  { id: 'invest5', name: '调查员5', role: '商品调查', color: 0xe67e22, room: 'open', status: 'working', message: '撰写报告' },
  { id: 'invest6', name: '调查员6', role: '商品调查', color: 0xd35400, room: 'open', status: 'idle', message: '' },
  { id: 'script1', name: '脚本师1', role: '剧本创作', color: 0xf39c12, room: 'open', status: 'thinking', message: '写广告脚本' },
  { id: 'script2', name: '脚本师2', role: '剧本创作', color: 0xe67e22, room: 'open', status: 'working', message: '润色台词' },
  { id: 'copywriter', name: '文案专员', role: '文案撰写', color: 0x1abc9c, room: 'open', status: 'done', message: '文案已完成' },
  // Court
  { id: 'judge', name: '法官', role: '主审', color: 0x2c3e50, room: 'court', status: 'idle', message: '' },
  { id: 'prosecutor', name: '检察官', role: '控方', color: 0xc0392b, room: 'court', status: 'working', message: '准备起诉' },
  { id: 'defense', name: '辩护律师', role: '辩方', color: 0x27ae60, room: 'court', status: 'thinking', message: '准备辩护' },
  ...Array.from({length: 12}, (_, i) => ({
    id: `juror${i+1}`,
    name: `陪审员${i+1}`,
    role: '陪审',
    color: 0x95a5a6 + i * 0x010101,
    room: 'court',
    status: 'idle',
    message: ''
  }))
];

// Status colors
const STATUS_COLORS = {
  working: 0x00ff00,
  thinking: 0xffff00,
  browsing: 0x00ffff,
  'needs-help': 0xff0000,
  idle: 0x888888,
  done: 0x00ff88
};

let scene, camera, renderer, controls;
let botsMeshes = [];
let isNight = false;
let demoMode = false;
let ambientLight, directionalLight;
let btcPrice = '—';

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(20, 25, 40);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 2, 0);

  // Lights
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(20, 40, 20);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  createEnvironment();
  createBots();
  setupUI();
  fetchBTC();
  animate();

  window.addEventListener('resize', onWindowResize);
}

function createEnvironment() {
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 60),
    new THREE.MeshLambertMaterial({ color: 0xcccccc })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Office walls (simple)
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
  // Director room
  addWall(-15, 0, -10, 10, 5, 0.3, wallMat);
  // Art director room
  addWall(15, 0, -10, 10, 5, 0.3, wallMat);
  // Meeting room
  addWall(0, 0, -18, 20, 5, 0.3, wallMat);

  // Courtroom section (offset)
  const courtFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 25),
    new THREE.MeshLambertMaterial({ color: 0x8b7355 })
  );
  courtFloor.rotation.x = -Math.PI / 2;
  courtFloor.position.set(45, 0.01, 0);
  scene.add(courtFloor);

  // Simple desks for open area
  for (let i = 0; i < 12; i++) {
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.8, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x8b5a2b })
    );
    desk.position.set(-20 + (i % 6) * 6, 0.4, 5 + Math.floor(i / 6) * 6);
    desk.castShadow = true;
    scene.add(desk);
  }

  // Meeting table
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.6, 3),
    new THREE.MeshLambertMaterial({ color: 0x4a3728 })
  );
  table.position.set(0, 0.3, -12);
  scene.add(table);

  // Rest area sofa
  const sofa = new THREE.Mesh(
    new THREE.BoxGeometry(6, 1, 2),
    new THREE.MeshLambertMaterial({ color: 0x3498db })
  );
  sofa.position.set(-10, 0.5, 15);
  scene.add(sofa);

  // Tea area
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16),
    new THREE.MeshLambertMaterial({ color: 0x2c3e50 })
  );
  coffee.position.set(10, 0.6, 15);
  scene.add(coffee);

  // Judge bench in court
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(8, 2, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x5d4037 })
  );
  bench.position.set(45, 1, -8);
  scene.add(bench);
}

function addWall(x, y, z, w, h, d, mat) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  wall.position.set(x, y + h/2, z);
  wall.castShadow = true;
  scene.add(wall);
}

function createBots() {
  BOTS.forEach((bot, index) => {
    const group = new THREE.Group();
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.2, 0.4),
      new THREE.MeshLambertMaterial({ color: bot.color })
    );
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshLambertMaterial({ color: 0xffdbac })
    );
    head.position.y = 1.5;
    group.add(head);

    // Status light
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: STATUS_COLORS[bot.status] || 0xffffff })
    );
    light.position.y = 2.1;
    group.add(light);
    bot.lightMesh = light;

    // Position based on role
    let pos;
    if (bot.room === 'director') pos = new THREE.Vector3(-15, 0, -5);
    else if (bot.room === 'art') pos = new THREE.Vector3(15, 0, -5);
    else if (bot.room === 'court') {
      if (bot.id === 'judge') pos = new THREE.Vector3(45, 0, -6);
      else if (bot.id === 'prosecutor') pos = new THREE.Vector3(40, 0, 2);
      else if (bot.id === 'defense') pos = new THREE.Vector3(50, 0, 2);
      else {
        const jIndex = parseInt(bot.id.replace('juror','')) - 1;
        pos = new THREE.Vector3(38 + (jIndex % 6) * 2.5, 0, 8 + Math.floor(jIndex / 6) * 2.5);
      }
    } else {
      // open desks
      const deskIndex = index % 12;
      pos = new THREE.Vector3(-20 + (deskIndex % 6) * 6, 0, 5 + Math.floor(deskIndex / 6) * 6);
    }
    group.position.copy(pos);
    scene.add(group);
    botsMeshes.push({ bot, group, basePos: pos.clone() });
  });
}

function updateStatusDisplay() {
  const list = document.getElementById('statusList');
  list.innerHTML = BOTS.slice(0, 14).map(b => 
    `<div class="bot-status" style="color:#${b.color.toString(16).padStart(6,'0')}">${b.name}: ${b.status} ${b.message ? '- ' + b.message : ''}</div>`
  ).join('') + '<div style="margin-top:6px;color:#aaa">法庭区状态见3D场景</div>';
}

function setupUI() {
  document.getElementById('dayNight').onclick = () => {
    isNight = !isNight;
    scene.background = new THREE.Color(isNight ? 0x0a0a2a : 0x87ceeb);
    ambientLight.intensity = isNight ? 0.2 : 0.6;
    directionalLight.intensity = isNight ? 0.3 : 0.8;
    scene.fog.color.set(isNight ? 0x0a0a2a : 0x87ceeb);
  };

  document.getElementById('demoMode').onclick = () => {
    demoMode = !demoMode;
    document.getElementById('demoMode').textContent = demoMode ? '关闭演示' : '演示模式';
  };

  document.getElementById('resetView').onclick = () => {
    camera.position.set(20, 25, 40);
    controls.target.set(0, 2, 0);
  };

  updateStatusDisplay();
}

async function fetchBTC() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const data = await res.json();
    btcPrice = '$' + data.bitcoin.usd.toLocaleString();
    document.getElementById('btc').textContent = 'BTC: ' + btcPrice;
  } catch (e) {
    document.getElementById('btc').textContent = 'BTC: 暂时无法获取';
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (demoMode) {
    // Simple demo status cycling
    if (Math.random() < 0.01) {
      const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
      const statuses = Object.keys(STATUS_COLORS);
      bot.status = statuses[Math.floor(Math.random() * statuses.length)];
      bot.message = bot.status === 'done' ? '任务完成！' : '正在处理...';
      if (bot.lightMesh) bot.lightMesh.material.color.setHex(STATUS_COLORS[bot.status]);
      updateStatusDisplay();
      // Confetti on done (simple particles)
      if (bot.status === 'done') spawnConfetti(bot);
    }
  }

  // Idle bots slight bob
  botsMeshes.forEach(item => {
    if (item.bot.status === 'idle') {
      item.group.position.y = item.basePos.y + Math.sin(Date.now() * 0.002 + item.bot.id.length) * 0.05;
    }
  });

  renderer.render(scene, camera);
}

function spawnConfetti(bot) {
  // Simple particle burst
  for (let i = 0; i < 20; i++) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff })
    );
    p.position.copy(botsMeshes.find(m => m.bot.id === bot.id)?.group.position || new THREE.Vector3());
    p.position.y += 2;
    scene.add(p);
    p.userData.vel = new THREE.Vector3((Math.random()-0.5)*0.2, Math.random()*0.3, (Math.random()-0.5)*0.2);
    setTimeout(() => scene.remove(p), 2000);
    // Animate in loop (simplified)
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
