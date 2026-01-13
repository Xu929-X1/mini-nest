import { Constructor, Container } from "../container";
import { HttpMethod } from "../request/createMethodDecorator";
/**
 * This is the place where all the getters lives 
 */

type ExecutionContextRequestType = {
    method: HttpMethod;
    url: string; // raw url
    path: string; // normalized path
    headers: Record<string, string>;
    params: Record<string, string> ;
    body: any;
}

type ExecutionContextRouteType = {
    controllerClass: Constructor;
    handlerName: string;
    fullPath: string;
}

class ExecutionContext {
    request: ExecutionContextRequestType
    route: ExecutionContextRouteType;
    container: Container
    constructor(request: ExecutionContextRequestType, route: ExecutionContextRouteType, container: Container) {
        this.request = request;
        this.route = route;
        this.container = container;
    }

    getRequest() {
        return this.request;
    }

    getRoute() {
        return this.route;
    }

    getHandler() {
        return this.route.controllerClass.prototype[this.route.handlerName];
    }

    getHandlerName() {
        return this.route.handlerName;
    }

    getControllerInstance() {
        if (!this.container) {
            throw new Error("Container is not available in ExecutionContext");
        }
        return this.container.resolve(this.route.controllerClass, this);
    }

    getContainer() {
        return this.container;
    }
}

export { ExecutionContext };