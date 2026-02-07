import { HttpRequest } from "../http/httpRequest";
import { HttpResponse } from "../http/httpResponse";

export type Middleware = (req: HttpRequest, res: HttpResponse, next: () => Promise<void>) => void | Promise<void>;