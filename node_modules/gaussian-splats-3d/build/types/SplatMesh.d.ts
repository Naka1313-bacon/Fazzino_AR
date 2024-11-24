export class SplatMesh {
    static buildMesh(splatBuffer: any, splatAlphaRemovalThreshold?: number, halfPrecisionCovariancesOnGPU?: boolean, devicePixelRatio?: number): SplatMesh;
    static buildMaterial(): any;
    static buildGeomtery(splatBuffer: any): any;
    constructor(splatBuffer: any, geometry: any, material: any, splatAlphaRemovalThreshold?: number, halfPrecisionCovariancesOnGPU?: boolean, devicePixelRatio?: number);
    splatBuffer: any;
    geometry: any;
    material: any;
    splatTree: SplatTree;
    splatDataTextures: {
        covariances: {
            data: Uint16Array | Float32Array;
            texture: any;
            size: any;
        };
        centerColors: {
            data: Uint32Array;
            texture: any;
            size: any;
        };
    };
    splatAlphaRemovalThreshold: number;
    halfPrecisionCovariancesOnGPU: boolean;
    devicePixelRatio: number;
    buildSplatTree(): void;
    getSplatTree(): SplatTree;
    resetLocalSplatDataAndTexturesFromSplatBuffer(): void;
    updateLocalSplatDataFromSplatBuffer(): void;
    covariances: Float32Array;
    colors: Uint8Array;
    centers: Float32Array;
    allocateAndStoreLocalSplatDataInTextures(): void;
    updateSplatDataToDataTextures(): void;
    updateLocalCovarianceDataToDataTexture(): void;
    updateLocalCenterColorDataToDataTexture(): void;
    updateIndexes(indexes: any, renderSplatCount: any): void;
    updateUniforms: (renderDimensions: any, cameraFocalLengthX: any, cameraFocalLengthY: any) => void;
    getSplatDataTextures(): {
        covariances: {
            data: Uint16Array | Float32Array;
            texture: any;
            size: any;
        };
        centerColors: {
            data: Uint32Array;
            texture: any;
            size: any;
        };
    };
    getSplatCount(): any;
    getCenters(): Float32Array;
    getColors(): Uint8Array;
    getCovariances(): Float32Array;
}
import { SplatTree } from "./splattree/SplatTree.js";
