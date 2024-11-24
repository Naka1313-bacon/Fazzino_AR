export class Hit {
    origin: any;
    normal: any;
    distance: number;
    set(origin: any, normal: any, distance: any): void;
    clone(): Hit;
}
