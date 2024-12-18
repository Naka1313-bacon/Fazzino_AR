import * as THREE from 'three';
import * as GaussianSpalt3D from 'gaussian-splats-3d';
import {ARButton} from 'ARButton'

async function init() {
  

  // 4. Gaussian-Splats Viewerの設定
  const viewer = new GaussianSpalt3D.Viewer({
    'initialCameraLookAt': [0.20786, -0.68154, -0.27311],
    'webXRMode': GaussianSpalt3D.WebXRMode.AR
  });
  let path = './assets/fazzino3D.compressed.ply';
  viewer.addSplatScene(path, {
      'rotation': new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0.01933, -0.75830, -0.65161).normalize(), new THREE.Vector3(0, 1, 0)).toArray(),
      'scale': [0.25, 0.25, 0.25],
      'position': [0, 0.5, 0]
  })
  .then(() => {
      viewer.start();
  });


}
init();