import * as THREE from 'three';
import { ARButton } from 'ARButton';
import * as GaussianSplats3D from 'gaussian-splats-3d'; // 利用するライブラリを読み込む


let camera, scene, renderer;
let reticle;
let viewer;

init();

async function init() {
    // シーンの作成
    scene = new THREE.Scene();

    // カメラの作成
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 環境光を追加

    scene.add(light,ambientLight);
    // ARボタンの追加
    const sessionInit = { requiredFeatures: ['hit-test'], optionalFeatures: ['local-floor', 'bounded-floor'] };
    document.body.appendChild(ARButton.createButton(renderer, sessionInit));

    // Gaussian Splats 3D Viewer の初期化
    viewer = new GaussianSplats3D.Viewer({
        
        'webXRMode': GaussianSplats3D.WebXRMode.AR
    });

    // Gaussian Splats モデルのロード
    const modelPath = './assets/fazzino3D.compressed.ply';

    // レティクルの作成
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ヒットテストソースの設定
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    renderer.setAnimationLoop((timestamp, frame) => {
        if (frame) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const session = renderer.xr.getSession();

            if (!hitTestSourceRequested) {
                session.requestReferenceSpace('viewer').then((space) => {
                    session.requestHitTestSource({ space }).then((source) => {
                        hitTestSource = source;
                    });
                }).catch((error) => {
                    console.error('Failed to request hit test source:', error);
                });

                session.addEventListener('end', () => {
                    hitTestSourceRequested = false;
                    hitTestSource = null;
                });
                hitTestSourceRequested = true;
            }

            if (hitTestSource) {
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
        }

        renderer.render(scene, camera);
    });
    let isSceneLoading = false;

    window.addEventListener('click', async () => {
        if (reticle.visible && !isSceneLoading) {
            isSceneLoading = true;
            try {
                await viewer.addSplatScene(modelPath, {
                    'position': new THREE.Vector3().setFromMatrixPosition(reticle.matrix).toArray(),
                    'scale': [1, 1, 1],
                    'rotation': new THREE.Quaternion().setFromRotationMatrix(reticle.matrix).toArray()
                });
                console.log('Starting viewer...');
                viewer.start();
                console.log('Viewer started.');
                console.log('Reticle position:', reticle.position);
                console.log('Model position:', new THREE.Vector3().setFromMatrixPosition(reticle.matrix).toArray());

            } catch (error) {
                console.error('Failed to place Gaussian Splats model:', error);
            } finally {
                isSceneLoading = false; // ロード完了後にフラグをリセット
            }
        }
    });
}