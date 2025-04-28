import { container } from "./container";
import { HttpMethod } from "./createMethodDecorator";
import { resolveHandlerArguments } from "./resolveHandlerArgument";
import { routeMatch } from "./routeMatch";
import { RouteRecord, routeRegistry } from "./routeRegistry";
import { normalizeUrl } from "./utils/normalizePath";

function parseQuery(url: string): Record<string, string> {
    const dummyUrl = new URL('http://dummy' + url);
    const params: Record<string, string> = {};

    dummyUrl.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return params;
}

export function simulateRequest(url: string, method: HttpMethod, options?: {
    body?: any; headers?: Record<string, string>
}) {
    const allRoutes = routeRegistry.getAllRoutes();
    let matchingRoute: RouteRecord | undefined;
    let routeParams: Record<string, string> = {};
    const rawQuery = parseQuery(url);
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

    const args = resolveHandlerArguments(controllerClass, handlerName, {
        body: options?.body,
        query: rawQuery,
        params: routeParams,
        headers: options?.headers,
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