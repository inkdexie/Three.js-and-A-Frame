const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 10, 25);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 3.5, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(4, 8, 5);
scene.add(dir);

const dirt = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.8, 6),
  new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
);
dirt.position.y = -0.4;
scene.add(dirt);

const grass = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.25, 6),
  new THREE.MeshStandardMaterial({ color: 0x5d9c3c })
);
grass.position.y = 0.125;
scene.add(grass);

const items = new THREE.Group();
scene.add(items);

function addTnt() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xc0392b })
  );
}

function addSword() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 1.0, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x4aedd9, emissive: 0x1a6b62, emissiveIntensity: 0.4 })
  );
  blade.position.y = 0.55;
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.08, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x3f3f3f })
  );
  guard.position.y = 0.02;
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.32, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2a })
  );
  handle.position.y = -0.18;
  g.add(blade, guard, handle);
  return g;
}

function addTorch() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12),
    new THREE.MeshStandardMaterial({ color: 0x7a5230 })
  );
  stick.position.y = 0.35;
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffb52e })
  );
  flame.name = 'flame';
  flame.position.y = 0.8;
  const fire = new THREE.PointLight(0xff9933, 1.0, 4);
  fire.position.y = 0.85;
  g.add(stick, flame, fire);
  return g;
}

function addApple() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xf2c14e, metalness: 0.7, roughness: 0.3 })
  );
}

const propNames = ['TNT', '钻石剑', '火把', '金苹果'];
const makers = [addTnt, addSword, addTorch, addApple];
makers.forEach((make, i) => {
  const angle = (i / makers.length) * Math.PI * 2;
  const obj = make();
  obj.position.set(Math.cos(angle) * 2.1, 0.7, Math.sin(angle) * 2.1);
  obj.lookAt(0, obj.position.y, 0);
  obj.userData.name = propNames[i];
  items.add(obj);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let highlighted = null;

function getAllMeshes(obj) {
  const meshes = [];
  obj.traverse(o => { if (o.isMesh) meshes.push(o); });
  return meshes;
}

function setHighlight(obj, on) {
  getAllMeshes(obj).forEach(m => {
    if (!m.material.emissive) return;
    if (on) {
      if (m.userData._origEmissive === undefined) {
        m.userData._origEmissive = m.material.emissiveIntensity || 0;
        m.userData._origEmissiveColor = m.material.emissive.getHex();
      }
      m.material.emissive.copy(m.material.color);
      m.material.emissiveIntensity = m.userData._origEmissive + 1.0;
    } else {
      m.material.emissive.setHex(m.userData._origEmissiveColor);
      m.material.emissiveIntensity = m.userData._origEmissive;
    }
  });
}

renderer.domElement.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(items.children, true);
  if (hits.length > 0) {
    let target = hits[0].object;
    while (target.parent && target.parent !== items) target = target.parent;
    if (highlighted === target) return;
    if (highlighted) setHighlight(highlighted, false);
    highlighted = target;
    setHighlight(target, true);
  } else {
    if (highlighted) { setHighlight(highlighted, false); highlighted = null; }
  }
});

const clock = new THREE.Clock();

const animate = () => {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  items.rotation.y += 0.005;
  const torch = items.children[2];
  const flame = torch.getObjectByName('flame');
  const s = 1 + Math.sin(t * 8) * 0.15;
  flame.scale.set(s, s, s);
  renderer.render(scene, camera);
};
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
