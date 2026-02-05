import { Container } from "../container";
import { HttpMethod } from "../request/createMethodDecorator";
import { middlewareRegistry, runMiddleware } from "../request/middleware/middleware";
import { routeRegistryTrie } from "../request/routeRegistry";
import { normalizeUrl } from "../request/http/normalizePath";
import { ExecutionContext } from "./ExecutionContext";

/**
 * Request dispatcher takes all the data from the incoming request and dispatches it to the correct handler
 * It uses the ExecutionContext to get all the necessary data
 */

type ReqLikeType = {
    url: string;
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: any;
}

class RequestDispatcher {
    container: Container;
    constructor() {
        this.container = Container.instance;
    }

    private parseQuery(url: string): Record<string, string> {
        const dummyUrl = new URL('http://dummy' + url);
        const params: Record<string, string> = {};

        dummyUrl.searchParams.forEach((value, key) => {
            params[key] = value;
        });

        return params;
    }

    private routeCheck(method: HttpMethod, url: string) {
        const matchingRoute = routeRegistryTrie.findRoute(method, url);
        if (!matchingRoute) {
            throw new Error(`No route found for ${method} ${url}`);
        }

        if (!matchingRoute.route) {
            throw new Error(`No route found for ${method} ${url}`);
        }

        if (!matchingRoute.params) {
            matchingRoute.params = {};
        }

        return matchingRoute;
    }
    //assemble execution context from reqLike object, reusable later for middlewares, interceptors, guards, etc.
    private buildContext(reqLike: ReqLikeType) {
        const normalizedUrl = normalizeUrl(reqLike.url);
        const matchingRoute = this.routeCheck(reqLike.method, normalizedUrl);
        const query = this.parseQuery(reqLike.url);
        const request = {
            path: normalizedUrl,
            url: reqLike.url,
            method: reqLike.method,
            query,
            body: reqLike.body || null,
            headers: reqLike.headers || {},
            params: matchingRoute?.params
        };

        const route = {
            controllerClass: matchingRoute.route.controllerClass,
            handlerName: matchingRoute.route.handlerName,
            fullPath: matchingRoute.route.fullUrl || '',
        }

        const executionContext = new ExecutionContext(request, route, this.container);

        return executionContext;
    }

    //dispatch the request to the correct handler
    public async dispatch(reqLike: ReqLikeType) {
        const executionContext = this.buildContext(reqLike);
        const mws = middlewareRegistry.getMiddlewares(`${reqLike.method}:${executionContext.getRoute().fullPath}`);;
        await runMiddleware(mws, reqLike as unknown as Request);
        const controllerInstance = this.container.resolve(executionContext.getRoute().controllerClass, executionContext);
        const handler = controllerInstance[executionContext.getRoute().handlerName];
        if (!handler) {
            throw new Error(`Handler ${executionContext.getRoute().handlerName} not found on controller ${executionContext.getRoute().controllerClass.name}`);
        }
        const args: any[] = []; // Here we would resolve handler arguments based on metadata and executionContext
        return handler.apply(controllerInstance, args);
    }

}