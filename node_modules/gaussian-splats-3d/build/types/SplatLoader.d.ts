export class SplatLoader {
    constructor(splatBuffer?: any);
    splatBuffer: any;
    downLoadLink: HTMLAnchorElement;
    loadFromURL(fileName: any, onProgress: any): Promise<any>;
    setFromBuffer(splatBuffer: any): void;
    downloadFile(fileName: any): void;
}
