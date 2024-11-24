export class PlyLoader {
    splatBuffer: import("./SplatBuffer.js").SplatBuffer;
    fetchFile(fileName: any, onProgress: any): Promise<any>;
    loadFromURL(fileName: any, compressionLevel?: number, minimumAlpha?: number): Promise<any>;
}
