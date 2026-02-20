export class CircuitOpenError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "CircuitOpenError";
    }
}