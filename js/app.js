import * as THREE from './three125/three.js';
import { LoadingBar } from './LoadingBar.js';
import { MTLLoader } from './three125/MTLLoader.js';
import { OBJLoader } from './three125/OBJLoader.js';
import { ControllerGestures } from './three125/ControllerGestures.js';
import { ARButton } from './ARButton.js';
import { CntrButtons } from './CntrButtons.js';

let urlParams = new URL(location).searchParams;
let offsetPos = new THREE.Vector3(0, 0, 0);
const paramKeys = { objurl: "objurl", txurl: "txurl", objname: "objname", offsetX: "offsetX", offsetY: "offsetY", offsetZ: "offsetZ" };

if (urlParams.has(paramKeys.offsetX)) {
    let posX = parseFloat(urlParams.get(paramKeys.offsetX));    
    if (!isNaN(posX)) {
        offsetPos.setX(posX);
    }
}

if (urlParams.has(paramKeys.offsetY)) {
    let posY = parseFloat(urlParams.get(paramKeys.offsetY));
    if (!isNaN(posY)) {
        offsetPos.setY(posY);
    }
}
if (urlParams.has(paramKeys.offsetZ)) {
    let posZ = parseFloat(urlParams.get(paramKeys.offsetZ));
    if (!isNaN(posZ)) {
        offsetPos.setZ(posZ);
    }
}

class App {
    constructor() {
        const container = document.createElement('div');
        document.body.appendChild(container);

        this.clock = new THREE.Clock();

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        this.camera.position.set(0, 1.6, 3);

        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        container.appendChild(this.renderer.domElement);

        this.initScene();
        this.setupXR();

        window.addEventListener('resize', this.resize.bind(this));

        this.cntrButtons = new CntrButtons();        
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    loadObj3D(texturesURL, objURL, objName) {

        if (urlParams.has(paramKeys.objurl) && urlParams.has(paramKeys.txurl) && urlParams.has(paramKeys.objname)) {
            
            objURL = urlParams.get(paramKeys.objurl);
            texturesURL = urlParams.get(paramKeys.txurl);
            objName = urlParams.get(paramKeys.objname);
        }

        let scope = this;
        scope.loadingBar.visible = true;

        let onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(`${Math.round(percentComplete, 2)}'% downloaded`);
            }
        };

        let onError = function (xhr) {
            console.log(`An error happened! error : ${xhr}`);
        };

        if (texturesURL != "" && objURL != "" && objName != "") {

            let mtlLoader = new MTLLoader();
            mtlLoader.setResourcePath(texturesURL).setPath(objURL);
            mtlLoader.load(objName + '.mtl', function (materials) {

                materials.preload();

                let objLoader = new OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath(objURL);
                objLoader.load(objName + '.obj', function (object) {

                    let scaleVal = 0.001;
                    object.traverse(function (child) {
                        if (child.material) {
                            child.material.side = THREE.DoubleSide;
                        }
                        if (child.isMesh) {
                            child.scale.x = child.scale.y = child.scale.z = scaleVal;
                        }
                    });

                    object.rotation.x = -Math.PI / 2;                    

                    scope.obj3D = new THREE.Object3D();

                    let box3 = new THREE.Box3().setFromObject(object);

                    scope.obj3D.objectSize = new THREE.Vector3();
                    box3.getSize(scope.obj3D.objectSize);

                    scope.obj3D.objectCenter = new THREE.Vector3();
                    box3.getCenter(scope.obj3D.objectCenter);                    

                    scope.obj3D.objectStartPos = new THREE.Vector3().copy(scope.obj3D.objectCenter);
                    scope.obj3D.objectStartPos.multiplyScalar(- 1);
                    scope.obj3D.objectStartPos.setY(0);
                    scope.obj3D.objectStartPos.add(offsetPos);

                    object.position.copy(scope.obj3D.objectStartPos);

                    scope.obj3D.add(object);

                    scope.scene.add(scope.obj3D);
                    scope.obj3D.visible = false;

                    scope.loadingBar.visible = false;
                    //scope.initAR();

                    scope.cntrButtons.obj3D = scope.obj3D;

                }, onProgress, onError);
            });

        }
    }


    initScene() {

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
        ambient.position.set(0.5, 1, 0.25);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight();
        light.position.set(0.2, 1, 1);
        this.scene.add(light);

        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry(0.15, 0.20, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xFF0000 })
        );
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    setupXR() {
        this.renderer.xr.enabled = true;
        let options = {
            sessionInit: {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay'],
                domOverlay: { root: document.body },                
            }
        };
        options.onSessionStart = function () {
            if (this.scene !== null) {
                this.initScene();
            }
        }.bind(this);
        options.onSessionEnd = function () {
            //if (this.obj3D !== null) {
            if (this.scene !== null) {
                this.scene.clear();
                this.obj3D = null;
                this.cntrButtons.hide();
            }
        }.bind(this);
        options.onClickFnCallback = this.loadObj3D.bind(this);

        const btn = new ARButton(this.renderer, options);

        const scope = this;
        scope.hitTestSourceRequested = false;
        scope.hitTestSource = null;

        scope.gestures = new ControllerGestures(scope.renderer);
        scope.gestures.addEventListener('tap', function (ev) {
            //console.log( '!!! tap' ); 
            if (this.obj3D !== undefined) {
                if (this.reticle.visible) {
                    this.obj3D.position.setFromMatrixPosition(this.reticle.matrix);
                    this.obj3D.visible = true;
                    this.cntrButtons.show();
                }
            }
        }.bind(scope));
        scope.gestures.addEventListener('doubletap', (ev) => {
            //console.log( 'doubletap');
        });
        scope.gestures.addEventListener('press', (ev) => {
            //console.log( 'press' );            
        });
        scope.gestures.addEventListener('pan', function (ev) {
            //console.log( ev );
            if (ev.initialise !== undefined) {
                this.startPosition = this.obj3D.position.clone();
            } else {
                //const pos = scope.startPosition.clone().add( ev.delta.multiplyScalar(3) );
                const pos = this.startPosition.clone().add(ev.delta.multiplyScalar(30));
                pos.y = this.startPosition.y;
                this.obj3D.position.copy(pos);
                //this.ui.updateElement('info', `pan x:${ev.delta.x.toFixed(3)}, y:${ev.delta.y.toFixed(3)}, x:${ev.delta.z.toFixed(3)}`);
                //console.log("!! info " + `pan x:${ev.delta.x.toFixed(3)}, y:${ev.delta.y.toFixed(3)}, x:${ev.delta.z.toFixed(3)}`);
            }
        }.bind(scope));
        scope.gestures.addEventListener('swipe', function (ev){
            //console.log( ev );               
            //console.log("!!! swipe");
            if (this.obj3D.visible) {
                this.obj3D.visible = false;
                this.cntrButtons.hide();
                //scope.scene.remove( scope.obj3D ); 
            }
        }.bind(scope));
        scope.gestures.addEventListener('pinch', (ev) => {
            console.log("!!! pinch");
            /*
            //console.log( ev );  
            if (ev.initialise !== undefined) {
                scope.startScale = scope.obj3D.scale.clone();
            } else {
                const scale = scope.startScale.clone().multiplyScalar(ev.scale);
                scope.obj3D.scale.copy(scale);
                }
            */
        });
        scope.gestures.addEventListener('rotate', function (ev) {
            //console.log( ev ); 
            if (ev.initialise !== undefined) {
                this.startQuaternion = this.obj3D.quaternion.clone();
            } else {
                this.obj3D.quaternion.copy(this.startQuaternion);
                this.obj3D.rotateY(ev.theta * 10);
                //console.log("!!! rotate");
            }
        }.bind(scope));

        
    }

    //initAR() {
       
    //    let currentSession = null;
    //    const scope = this;

    //    const sessionInit = { requiredFeatures: ['hit-test'] };

    //    function onSessionStarted(session) {
    //        session.addEventListener('end', onSessionEnded);
    //        scope.renderer.xr.setReferenceSpaceType('local');
    //        scope.renderer.xr.setSession(session);
    //        currentSession = session;
    //    }

    //    function onSessionEnded() {
    //        currentSession.removeEventListener('end', onSessionEnded);
    //        currentSession = null;
    //        if (scope.obj3D !== null) {
    //            scope.scene.remove(scope.obj3D);
    //            scope.obj3D = null;
    //        }
    //        scope.renderer.setAnimationLoop(null);
    //    }

    //    if (currentSession === null) {
    //        navigator.xr.requestSession('immersive-ar', sessionInit).then(onSessionStarted);
    //    } else {
    //        currentSession.end();
    //    }
    //}

    requestHitTestSource() {
        const scope = this;

        const session = this.renderer.xr.getSession();
        session.requestReferenceSpace('viewer').then(
            function (referenceSpace) {
                session.requestHitTestSource({ space: referenceSpace }).then(
                    function (source) {
                        scope.hitTestSource = source;
                    }
                )
            }
        );

        session.addEventListener('end', function () {
            scope.hitTestSourceRequested = false;
            scope.hitTestSource = null;
            scope.referenceSpace = null;
        });

        this.hitTestSourceRequested = true;
    }

    getHitTestResults(frame) {
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        if (hitTestResults.length) {
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            this.reticle.visible = true;
            this.reticle.matrix.fromArray(pose.transform.matrix);
        } else {
            this.reticle.visible = false;
        }
    }

    render(timestamp, frame) {
        const dt = this.clock.getDelta();

        const scope = this;

        if (frame) {
            if (this.hitTestSourceRequested === false) this.requestHitTestSource();
            if (this.hitTestSource) this.getHitTestResults(frame);
        }

        if (this.renderer.xr.isPresenting) {
            this.gestures.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

export { App };
