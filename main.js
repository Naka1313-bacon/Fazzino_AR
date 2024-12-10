import * as THREE from 'three';
import { Viewer } from 'gaussian-splats-3d';

async function init() {
  const xrElement = document.getElementById('xr');

  const viewer = new Viewer({
      rootElement: xrElement,
      xr: 'ar', // ARモードを有効化
      rootElement: xrElement,
      cameraUp: [0, 0, 1],
      initialCameraPosition: [-10, 0, 2],
      initialCameraLookAt: [0, 0, 0],
      sharedMemoryForWorkers: false,
      gpuAcceleratedSort: false,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotate: { x: 0, y: 0, z: 0 }
      },
      transformAr: {
        scale: {
          x: 3.0,
          y: 3.0,
          z: 3.0
        },
        position: {
          x: 0.0,
          y: 0,
          z: 0
        },
        rotate: {
          x: 0,
          y: 0,
          z: 0.0
        }
      },
  });

  const modelPath = './assets/converted_file.ksplat';

  // モデル読み込み
  await viewer.loadFile(modelPath)
      .then(() => {
          // モデルロード完了後にviewerを開始
          viewer.start();
          console.log(viewer.splatMesh);
          // ARButtonが画面上に表示されるので、AR対応デバイス・ブラウザ上で
          // ユーザーがARButtonを押し、セッションが開始されるとモデルが表示されます。
      })
      .catch(err => {
          console.error('Error loading model:', err);
      });
}

init();
