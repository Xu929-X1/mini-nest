import { container } from "./container";
import { HttpMethod } from "./createMethodDecorator";
import { resolveHandlerArgument } from "./resolveHandlerArgument";
import { routeMatch } from "./routeMatch";
import { routeRegistry } from "./routeRegistry";
import { normalizeUrl } from "./utils/normalizePath";

export function simulateRequest(url: string, method: HttpMethod, body?: object) {
    url = normalizeUrl(url);

    const allRoutes = routeRegistry.getAllRoutes();
    const matchingRoute = allRoutes.find(route => {
        if (route.method !== method) return false;
        const result = routeMatch(route.url, url);
        return result.matched;
    });

    if (!matchingRoute) {
        throw new Error(`No route found for ${method} ${url}`);
    }

    const { controllerClass, handlerName, url: routeUrl } = matchingRoute;
    const routeParams = routeMatch(routeUrl, url).params;

    const controllerInstance = container.resolve(controllerClass);
    const handler = controllerInstance[handlerName];

    const args = resolveHandlerArgument(controllerClass, handlerName, {
        body: body || {},
        query: {},         // 可扩展
        params: routeParams,
        headers: {},        // 可扩展
    });

    try {
        const result = handler.apply(controllerInstance, args);
        if (result instanceof Promise) {
            result.then(res => console.log('Response:', res)).catch(console.error);
        } else {
            console.log('Response:', result);
        }
    } catch (e) {
        console.error('Handler error:', e);
    }
}