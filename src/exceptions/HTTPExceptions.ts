import { BaseHTTPException, HttpExceptionResponse } from "./baseHTTPException";
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export interface ValidationExceptionResponse extends HttpExceptionResponse {
    errors: ValidationError[];
}

export class BadRequestException extends BaseHTTPException {
    constructor(message: string = 'Bad Request') {
        super(message, 400, 'Bad Request');
    }
}

export class UnauthorizedException extends BaseHTTPException {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'Unauthorized');
    }
}

export class ForbiddenException extends BaseHTTPException {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'Forbidden');
    }
}

export class NotFoundException extends BaseHTTPException {
    constructor(message: string = 'Not Found') {
        super(message, 404, 'Not Found');
    }
}

export class InternalServerErrorException extends BaseHTTPException {
    constructor(message: string = 'Internal Server Error') {
        super(message, 500, 'Internal Server Error');
    }
}

export class NotImplementedException extends BaseHTTPException {
    constructor(message: string = 'Not Implemented') {
        super(message, 501, 'Not Implemented');
    }
}

export class BadGatewayException extends BaseHTTPException {
    constructor(message: string = 'Bad Gateway') {
        super(message, 502, 'Bad Gateway');
    }
}

export class ValidationException extends BaseHTTPException {
    constructor(
        public readonly errors: ValidationError[],
        message: string = 'Validation failed'
    ) {
        super(message, 422, 'Validation Error');
    }

    override getResponse(): ValidationExceptionResponse {
        return {
            statusCode: this.statusCode,
            message: this.message,
            error: this.error!,
            errors: this.errors,
        };
    }
}