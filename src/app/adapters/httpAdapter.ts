import { RawRequest } from "../../request/http/httpRequest";
import { HttpResponse } from "../../request/http/httpResponse";

export interface HttpAdapter {
    listen(port: number, cb: () => void): void;
    shutdown(): Promise<void>;
}

export type RequestHandler = (RawRequest: RawRequest) => Promise<HttpResponse>;