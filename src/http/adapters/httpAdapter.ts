import { HttpResponse } from "../httpResponse";
import { RawRequest } from "../httpRequest";

export interface HTTPAdapterOptions {
    https?: {
        key: string;
        cert: string;
    }
}

export interface HttpAdapter {
    listen(port: number, cb: () => void): void;
    shutdown(): Promise<void>;
}

export type RequestHandler = (RawRequest: RawRequest) => Promise<HttpResponse>;