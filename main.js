import * as THREE from 'three';
import { ARButton } from 'ARButton';
import { PlyLoader } from 'gaussian-splats-3d'; // 利用するライブラリを読み込む


let camera, scene, renderer;
let reticle;
let mesh;

init();

function init() {
    // シーンの作成
    scene = new THREE.Scene();

    // カメラの作成
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // ARボタンの追加
    document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    // ライトの追加
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Gaussian Splatting用のPLYファイルをロード
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
        mesh.position.set(0, 0, -2); // カメラの前方に配置
        scene.add(mesh);
    }).catch((error) => {
        console.error('Failed to load PLY file:', error);
    });

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
            const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor'] }; // 'layers'を削除
            navigator.xr.requestSession('immersive-ar', sessionInit).then((session) => {
                renderer.xr.setSession(session);
            }).catch((error) => {
                console.error('Failed to create XR session:', error);
            });
            if (!hitTestSourceRequested) {
                session.requestReferenceSpace('viewer').then((space) => {
                    session.requestHitTestSource({ space }).then((source) => {
                        hitTestSource = source;
                    });
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
            
            const onSessionEnded = () => {
                console.log('XR session ended.');
                session.removeEventListener('end', onSessionEnded);
            };
            
            session.addEventListener('end', onSessionEnded);
        }

        renderer.render(scene, camera);
    });

    // レティクルをタップしたときにモデルを配置
    window.addEventListener('click', () => {
        if (reticle.visible && mesh) {
            mesh.position.setFromMatrixPosition(reticle.matrix);
            mesh.visible = true;
            console.log('clicked')
        }
    });
}


    