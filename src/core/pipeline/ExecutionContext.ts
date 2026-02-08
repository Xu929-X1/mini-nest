import { HttpRequest } from "../../http/httpRequest";
import { HttpResponse } from "../../http/httpResponse";
import { Constructor, Container } from "../container/container";


export interface RouteMetadata {
    controllerClass: Constructor;
    handlerName: string;
    fullPath: string;
}

export class ExecutionContext {
    constructor(
        private readonly request: HttpRequest,
        private readonly response: HttpResponse,
        private readonly route: RouteMetadata,
        private readonly container: Container
    ) { }

    getRequest(): HttpRequest {
        return this.request;
    }

    getResponse(): HttpResponse {
        return this.response;
    }

    getRoute(): RouteMetadata {
        return this.route;
    }

    getHandler() {
        return this.route.controllerClass.prototype[this.route.handlerName];
    }

    getHandlerName() {
        return this.route.handlerName;
    }

    getContainer(){
        return this.container;
    }

}