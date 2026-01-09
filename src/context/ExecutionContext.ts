import { Constructor, Container } from "../container";
import { HttpMethod } from "../request/createMethodDecorator";
import { ParamMetadata } from "../request/paramRegistry";
/**
 * This is the place where all the meta data gets collected and assembled
 */

type ExecutionContextRequestType = {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    body: any;
}

type ExecutionContextRouteType = {
    controllerClass: Constructor;
    handlerName: string;
    fullPath: string;
    paramMetadata: ParamMetadata[];
}

class ExecutionContext {
    request: ExecutionContextRequestType
    route: ExecutionContextRouteType;
    container?: Container
    constructor(request: ExecutionContextRequestType, route: ExecutionContextRouteType, container?: Container) {
        this.request = request;
        this.route = route;
        this.container = container;
    }

    getHandler() {
        return this.route.controllerClass.prototype[this.route.handlerName];
    }

    getControllerInstance() {
        if (!this.container) {
            throw new Error("Container is not available in ExecutionContext");
        }
        return this.container.resolve(this.route.controllerClass, this);
    }
}