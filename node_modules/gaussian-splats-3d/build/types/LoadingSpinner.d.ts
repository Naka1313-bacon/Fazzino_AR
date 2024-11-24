export class LoadingSpinner {
    constructor(message: any, container: any);
    message: any;
    container: any;
    spinnerDivContainer: HTMLDivElement;
    spinnerDiv: HTMLDivElement;
    messageDiv: HTMLDivElement;
    show(): void;
    hide(): void;
    setMessage(msg: any): void;
}
