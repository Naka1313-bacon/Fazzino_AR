export class PlyParser {
    constructor(plyBuffer: any);
    plyBuffer: any;
    decodeHeader(plyBuffer: any): {
        splatCount: number;
        propertyTypes: {};
        vertexData: DataView;
        headerOffset: number;
    };
    readRawVertexFast(vertexData: any, offset: any, fieldOffsets: any, propertiesToRead: any, propertyTypes: any, outVertex: any): void;
    parseToSplatBuffer(compressionLevel?: number, minimumAlpha?: number): SplatBuffer;
    computeBuckets(positions: any): any[];
}
import { SplatBuffer } from "./SplatBuffer.js";
