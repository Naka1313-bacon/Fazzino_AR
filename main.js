import * as THREE from 'three';
import { Viewer } from 'gaussian-splats-3d';

async function init() {
    const xrElement = document.getElementById('xr');

    // 独自Viewerインスタンス生成
    const viewer = new Viewer({
        rootElement: xrElement,
        xr: 'ar', // ARモードを有効化
        transformAr: {
            scale: { x: 8, y: 8, z: 8 },
            position: { x: 0, y: 0, z: -2 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        // その他必要であればここに初期パラメータを追加
        // (cameraUp, initialCameraPosition, etc. デフォルトで問題なければ省略可)
    });

    const modelPath = './assets/fazzino3D.compressed.ply';

    // モデル読み込み
    await viewer.loadFile(modelPath)
        .then(() => {
            // モデルロード完了後にviewerを開始
            viewer.start();
        })
        .catch(err => {
            console.error('Error loading model:', err);
        });
}

init();