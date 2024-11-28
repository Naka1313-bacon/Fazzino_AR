import * as THREE from 'three';
import { ARButton } from 'ARButton';
import { PlyLoader } from 'gaussian-splats-3d'; // 利用するライブラリを読み込む



// let camera, scene, renderer;
// let reticle;
// let mesh;

// init();

// async function init() {
//     // シーンの作成
//     scene = new THREE.Scene();

//     // カメラの作成
//     camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

//     // レンダラーの作成
//     renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.xr.enabled = true;
//     document.body.appendChild(renderer.domElement);

//     // ARボタンの追加
//     const sessionInit = { requiredFeatures: ['hit-test'], optionalFeatures: ['local-floor', 'bounded-floor'] };
//     document.body.appendChild(ARButton.createButton(renderer, sessionInit));

//     // セッションの設定
//     renderer.xr.addEventListener('sessionstart', async () => {
//         const session = renderer.xr.getSession();
//         const gl = renderer.getContext();
//         let baseLayer;

//         // `layers`のサポートを確認し、適切に設定
//         if (session.updateRenderState && session.renderState.layers === undefined) {
//             baseLayer = new XRWebGLLayer(session, gl);
//             session.updateRenderState({ baseLayer });
//         } else if (session.renderState.layers) {
//             const xrGlBinding = new XRWebGLBinding(session, gl);
//             const projectionLayer = xrGlBinding.createProjectionLayer();
//             session.updateRenderState({
//                 layers: [projectionLayer]
//             });
//         }
//     });

//     // ライトの追加
//     const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
//     light.position.set(0.5, 1, 0.25);
//     scene.add(light);

//     // Gaussian Splatting用のPLYファイルをロード
//     const loader = PlyLoader.loadFromURL(
//         './assets/fazziono.compressed.ply', // PLYファイルのパス
//         (progress) => {
//             console.log(`Progress: ${progress}%`);
//         },
//         false, // データを直接バッファに読み込むかどうか
//         null, // プログレッシブロードのセクションごとの進捗コールバック
//         0,    // 最小アルファ値
//         0     // 圧縮レベル
//     );

//     loader.then((splatData) => {
//         console.log('PLY Data loaded:', splatData);

//         // SplattingデータをThree.jsのメッシュとして変換
//         const geometry = splatData.geometry;
//         const material = new THREE.MeshStandardMaterial({ vertexColors: true });
//         mesh = new THREE.Mesh(geometry, material);
//         mesh.visible = false;
//         scene.add(mesh);
//     }).catch((error) => {
//         console.error('Failed to load PLY file:', error);
//     });

//     // レティクルの作成
//     const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
//     const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
//     reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
//     reticle.matrixAutoUpdate = false;
//     reticle.visible = false;
//     scene.add(reticle);

//     // ヒットテストソースの設定
//     let hitTestSource = null;
//     let hitTestSourceRequested = false;

//     renderer.setAnimationLoop((timestamp, frame) => {
//         if (frame) {
//             const referenceSpace = renderer.xr.getReferenceSpace();
//             const session = renderer.xr.getSession();

//             if (!hitTestSourceRequested) {
//                 session.requestReferenceSpace('viewer').then((space) => {
//                     session.requestHitTestSource({ space }).then((source) => {
//                         hitTestSource = source;
//                     });
//                 }).catch((error) => {
//                     console.error('Failed to request hit test source:', error);
//                 });

//                 session.addEventListener('end', () => {
//                     hitTestSourceRequested = false;
//                     hitTestSource = null;
//                 });
//                 hitTestSourceRequested = true;
//             }

//             if (hitTestSource) {
//                 const hitTestResults = frame.getHitTestResults(hitTestSource);
//                 if (hitTestResults.length > 0) {
//                     const hit = hitTestResults[0];
//                     const pose = hit.getPose(referenceSpace);

//                     reticle.visible = true;
//                     reticle.matrix.fromArray(pose.transform.matrix);
//                 } else {
//                     reticle.visible = false;
//                 }
//             }
//         }

//         renderer.render(scene, camera);
//     });

//     // レティクルをタップしたときにモデルを配置
//     window.addEventListener('click', () => {
//         if (reticle.visible && mesh) {
//             mesh.position.setFromMatrixPosition(reticle.matrix);
//             mesh.visible = true;
//             console.log('Model placed at:', mesh.position);
//         }
//     });
// }

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

    const loader = PlyLoader.loadFromURL(
        './assets/fazziono.compressed.ply', // PLYファイルのパス
        (progress) => {
            console.log(`Progress: ${progress}%`);
        },
        false, // データを直接バッファに読み込むかどうか
        null, // プログレッシブロードのセクションごとの進捗コールバック
        0,    // 最小アルファ値
        0     // 圧縮レベル
    );
    loader.then((splatData) => {
        console.log('PLY Data loaded:', splatData);

        // SplattingデータをThree.jsのメッシュとして変換
        const geometry = splatData.geometry;
        const material = new THREE.MeshStandardMaterial({ vertexColors: true });
        mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        scene.add(mesh);
    }).catch((error) => {
        console.error('Failed to load PLY file:', error);
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
    