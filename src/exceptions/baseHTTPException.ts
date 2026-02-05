export interface HttpExceptionResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp?: string;
    path?: string;
}

export class BaseHTTPException extends Error {
    constructor(public readonly message: string, public readonly statusCode: number, public readonly error?: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    get getResponse(): HttpExceptionResponse {
        return {
            statusCode: this.statusCode,
            message: this.message,
            error: this.error || this.name,
        }
    }

    get getStatus() {
        return this.statusCode;
    }
}