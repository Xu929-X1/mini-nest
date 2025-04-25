import { container } from "./container";
import { HttpMethod } from "./createMethodDecorator";
import { resolveHandlerArgument } from "./resolveHandlerArgument";
import { routeMatch } from "./routeMatch";
import { RouteRecord, routeRegistry } from "./routeRegistry";
import { normalizeUrl } from "./utils/normalizePath";

function parseQuery(url: string): Record<string, string> {
    if (!url.includes("?")) {
        return {};
    }
    const queryString = url.split("?")[1];
    const params: Record<string, string> = {};
    const pairs = queryString.split("&");
    for (const pair of pairs) {
        const [key, value] = pair.split("=");
        params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
    return params;
}

export function simulateRequest(url: string, method: HttpMethod, body?: object) {
    const allRoutes = routeRegistry.getAllRoutes();

    let matchingRoute: RouteRecord | undefined;
    let routeParams: Record<string, string> = {};
    const queryParams = parseQuery(url);
    const cleanURL = normalizeUrl(url.split("?")[0]);
    for (const route of allRoutes) {
        if (route.method !== method) continue;
        const match = routeMatch(route.url, cleanURL);
        if (match.matched) {
            matchingRoute = route;
            routeParams = match.params || {};
            break;
        }
    }

    if (!matchingRoute) {
        throw new Error(`No route found for ${method} ${url}`);
    }
    const { controllerClass, handlerName, url: routeUrl } = matchingRoute;
    const controllerInstance = container.resolve(controllerClass);
    const handler = controllerInstance[handlerName];

    const args = resolveHandlerArgument(controllerClass, handlerName, {
        body: body || {},
        query: queryParams,         // 可扩展
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