import { match } from "assert";
import { container } from "./container";
import { HttpMethod } from "./createMethodDecorator";
import { applyInterceptors, classInterceptors } from "./interceptor";
import { resolveHandlerArguments } from "./resolveHandlerArgument";
import { RouteRecord, routeRegistryTrie, RouteTrieNode } from "./routeRegistry";
import { normalizeUrl } from "./utils/normalizePath";

function parseQuery(url: string): Record<string, string> {
    const dummyUrl = new URL('http://dummy' + url);
    const params: Record<string, string> = {};

    dummyUrl.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return params;
}

export async function simulateRequest(url: string, method: HttpMethod, options?: {
    body?: any; headers?: Record<string, string>
}) {
    url = normalizeUrl(url);
    const matchingRoute = routeRegistryTrie.findRoute(method, url);
    const rawQuery = parseQuery(url);
    if (!matchingRoute) {
        throw new Error(`No route found for ${method} ${url}`);
    }
    const { controllerClass, handlerName, url: routeUrl } = matchingRoute.route as RouteRecord;
    const controllerInstance = container.resolve(controllerClass);
    const handler = controllerInstance[handlerName];
    const args = resolveHandlerArguments(controllerClass, handlerName, {
        body: options?.body ?? {},
        query: rawQuery,
        params: matchingRoute.params,
        headers: options?.headers ?? {},
    });
    if (!handler) {
        throw new Error(`Handler ${handlerName} not found on controller ${controllerClass.name}`);
    }

    try {
        const interceptors = matchingRoute.route?.interceptors ?? [];
        const result = await applyInterceptors(interceptors, () =>
            handler.apply(controllerInstance, args)
        );
        return result instanceof Promise
            ? result.then(res => {
                console.log('Response:', res);
                return res;
            }).catch(err => {
                console.error(err);
                throw err;
            })
            : (console.log('Response:', result), result);
    } catch (e) {
        console.error('Handler error:', e);
    }
}