export class Ray {
    constructor(origin?: any, direction?: any);
    origin: any;
    direction: any;
    setParameters(origin: any, direction: any): void;
    boxContainsPoint(box: any, point: any, epsilon: any): boolean;
    intersectBox: (box: any, outHit: any) => boolean;
    intersectSphere: (center: any, radius: any, outHit: any) => boolean;
}
