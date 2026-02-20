import { HttpRequest } from "../http/HttpRequest";
import { HttpResponse } from "../http/HttpResponse";

export type Middleware = (req: HttpRequest, res: HttpResponse, next: () => Promise<void>) => void | Promise<void>;