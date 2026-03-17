import { InternalServerErrorException } from "../exceptions/HTTPExceptions";

export class HttpResponse {
    private _statusCode: number = 200;
    private _headers: Record<string, string> = {};
    private _body: any;
    private _sent: boolean = false;

    status(code: number): this {
        if (this._sent) {
            throw new InternalServerErrorException("Cannot set status after response is sent.");
        }
        this._statusCode = code;
        return this;
    }

    header(key: string, value: string): this {
        if (this._sent) {
            throw new InternalServerErrorException("Cannot set header after response is sent.");
        }
        this._headers[key.toLowerCase()] = value;
        return this;
    }

    json(data: any): this {
        if (this._sent) {
            throw new InternalServerErrorException("Cannot send response after it is already sent.");
        }

        this._body = data;
        this._headers['content-type'] = 'application/json';
        this._sent = true;
        return this;
    }

    send(data: any): this {
        if (this._sent) {
            throw new InternalServerErrorException("Cannot send response after it is already sent.");
        }
        this._body = data;
        this._sent = true;
        return this;
    }

    toJSON() {
        return {
            statusCode: this._statusCode,
            headers: this._headers,
            body: this._body,
        };
    }

    get statusCode(): number {
        return this._statusCode;
    }

    get headers(): Record<string, string> {
        return this._headers;
    }

    get body(): any {
        return this._body;
    }

    get isSent(): boolean {
        return this._sent;
    }
}