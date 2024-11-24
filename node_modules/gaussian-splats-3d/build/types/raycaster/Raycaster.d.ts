export class Raycaster {
    constructor(origin: any, direction: any);
    ray: Ray;
    setFromCameraAndScreenPosition(camera: any, screenPosition: any, screenDimensions: any): void;
    intersectSplatMesh(splatMesh: any, outHits?: any[]): void;
    castRayAtSplatTreeNode(ray: any, splatTree: any, node: any, outHits?: any[]): void;
}
import { Ray } from "./Ray.js";
