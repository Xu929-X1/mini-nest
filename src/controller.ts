import { Constructor } from "./container";
import { routeMetadata, RouteRecord, routeRegistry } from "./routeRegistry";
import { normalizePath } from "./utils/normalizePath";
export type ControllerClass = {
    constructor: Constructor;
}

export function Controller(baseUrl: string) {
    return function (target: Constructor) {
        const existingRoutes = routeMetadata.get(target);
        if (existingRoutes) {
            existingRoutes.forEach(route => {
                const fullUrl = normalizePath(baseUrl, route.url);
                routeRegistry.registerRoute(route.method, fullUrl, route.handlerName, target);
            });
        }
    }
}

