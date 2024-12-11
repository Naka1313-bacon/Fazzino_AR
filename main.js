import * as THREE from 'three';
import { Viewer } from 'gaussian-splats-3d';
import {ARButton} from 'ARButton'

async function init() {
  // 1. WebGL Rendererの作成
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);



  // 3. シーンとカメラの設定
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

  // 4. Gaussian-Splats Viewerの設定
  const viewer = new Viewer({
      camera: camera,
      rootElement: document.getElementById('xr'),
      xr: 'ar', 
      transform: {
        rotate: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        position: { x: 0, y: 0, z: 0 },
    },
  });
  const modelpath ='./assets/fazzino3D.compressed.ply'
	viewer.loadFile(modelpath)
	.then(() => {
		viewer.start();	
	});


}
init();