class ValidatorErrorException extends Error {
    constructor(readonly message: string, readonly key: string) {
        super(`Validation error: ${message} for key: ${key}`);
    }
}