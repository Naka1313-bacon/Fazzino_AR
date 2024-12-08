import * as THREE from 'three';
import { Viewer } from 'gaussian-splats-3d';

async function init() {
    const xrElement = document.getElementById('xr');

    // 独自Viewerインスタンス生成
    const viewer = new Viewer({
        rootElement: xrElement,
        xr: 'ar',
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
        })
        .catch(err => {
            console.error('Error loading model:', err);
        });
}

init();