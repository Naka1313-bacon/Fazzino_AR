import * as THREE from 'three';
import { Viewer } from 'gaussian-splats-3d';
import {ARButton} from 'ARButton'

async function init() {
  // 1. WebGL Rendererの作成
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // 2. ARボタンを追加
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // 3. シーンとカメラの設定
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

  // 4. Gaussian-Splats Viewerの設定
  const viewer = new Viewer({
      scene: scene,
      renderer: renderer,
      useBuildInControls: false,
      camera: camera,
      rootElement: document.getElementById('xr'),
      xr: 'ar', // ARモードを有効化
  });

  // 5. ヒットテストのセットアップ
  let hitTestSource = null;
  let reticle = null;

  renderer.xr.addEventListener('sessionstart', async () => {
      const session = renderer.xr.getSession();
      const referenceSpace = await session.requestReferenceSpace('viewer');
      hitTestSource = await session.requestHitTestSource({ space: referenceSpace });

      // Reticleの作成
      reticle = new THREE.Mesh(
          new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      reticle.visible = false;
      scene.add(reticle);
  });

  renderer.xr.addEventListener('sessionend', () => {
      hitTestSource = null;
      reticle = null;
  });

  // 6. モデル読み込み関数
  async function loadModel(url) {
      try {
          await viewer.loadFile(url, {
              position: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
              rotation: { x: 0, y: 0, z: 0 },
              showLoadingSpinner: true,
          });
          console.log('Model loaded successfully.');
      } catch (error) {
          console.error('Failed to load the model:', error);
      }
  }

  // 7. モデルをタッチした位置に配置
  const controller = renderer.xr.getController(0);
  controller.addEventListener('select', () => {
      if (reticle && reticle.visible) {
          viewer.splatMesh.visible = true;
          viewer.splatMesh.position.setFromMatrixPosition(reticle.matrix);
          console.log('Model positioned at:', viewer.splatMesh.position);
      }
  });
  scene.add(controller);

  // 8. アニメーションループ
  renderer.setAnimationLoop(() => {
      if (hitTestSource && reticle) {
          const frame = renderer.xr.getFrame();
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);

              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
          } else {
              reticle.visible = false;
          }
      }

      viewer.update(); // Viewerの更新
      renderer.render(scene, camera);
  });

  // モデルのロードを開始
  await loadModel('.assets/fazzino3D.compressed.ply');
}

// 初期化を実行
init();