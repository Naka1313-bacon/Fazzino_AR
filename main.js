import * as THREE from 'three';
import * as GaussianSplats3D from 'gaussian-splats-3d';

let viewer;

async function init() {
    const xrElement = document.getElementById('xr');

    viewer = new GaussianSplats3D.Viewer({

        webXRMode: GaussianSplats3D.WebXRMode.AR,
    });

    const modelPath = './assets/fazzino3D.compressed.ply';

    // モデルを読み込む
    await viewer.addSplatScene(modelPath, {
        position: [0, 0, -2], // AR空間で少し前方に表示
        scale: [8, 8, 8],
        rotation: [0, 0, 0, 1]
    }).then(() => {
        viewer.start();
    });
}

init();
