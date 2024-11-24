export class OrbitControls {
    constructor(object: any, domElement: any);
    object: any;
    domElement: any;
    enabled: boolean;
    target: any;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    zoomToCursor: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;
    keys: {
        LEFT: string;
        UP: string;
        RIGHT: string;
        BOTTOM: string;
    };
    mouseButtons: {
        LEFT: any;
        MIDDLE: any;
        RIGHT: any;
    };
    touches: {
        ONE: any;
        TWO: any;
    };
    target0: any;
    position0: any;
    zoom0: any;
    _domElementKeyEvents: any;
    getPolarAngle: () => any;
    getAzimuthalAngle: () => any;
    getDistance: () => any;
    listenToKeyEvents(domElement: any): void;
    stopListenToKeyEvents(): void;
    saveState: () => void;
    reset: () => void;
    update: () => boolean;
    dispose: () => void;
}
