import * as THREE from 'three';
import { ARButton } from 'ARButton';
import { PlyLoader } from 'gaussian-splats-3d'; // 利用するライブラリを読み込む



const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // WebXRを有効化
document.body.appendChild(renderer.domElement);

document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body }
  }));

const loader = new GaussianSplatLoader();
loader.load('./assets/fazzino3D.compressed', (splat) => {
  scene.add(splat);
}, undefined, (error) => {
  console.error('モデルの読み込みに失敗しました:', error);
});

let hitTestSource = null;
let localSpace = null;

renderer.xr.addEventListener('sessionstart', async () => {
  const session = renderer.xr.getSession();
  localSpace = await session.requestReferenceSpace('viewer');
  hitTestSource = await session.requestHitTestSource({ space: localSpace });

  session.addEventListener('select', (event) => {
    if (hitTestSource) {
      const frame = event.frame;
      const referenceSpace = renderer.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        // モデルの位置を更新
        splat.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
      }
    }
  });
});

function animate() {
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  
  animate();
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
    