export class ArrowHelper {
    constructor(dir?: any, origin?: any, length?: number, radius?: number, color?: number, headLength?: number, headRadius?: number);
    type: string;
    line: any;
    cone: any;
    setDirection(dir: any): void;
    setColor(color: any): void;
    copy(source: any): ArrowHelper;
    dispose(): void;
}
