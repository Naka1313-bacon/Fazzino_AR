import * as THREE from 'three';
import { Viewer } from 'gaussian-splats-3d';

async function init() {
  const xrElement = document.getElementById('xr');

  const viewer = new Viewer({
      rootElement: xrElement,
      xr: 'ar', // ARモードを有効化
      // 全体的なtransform（初期値）
      transform: {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotate: { x: 0, y: 0, z: 0 }
      },

  });

  const modelPath = './assets/fazzino3D.compressed.ply';

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
