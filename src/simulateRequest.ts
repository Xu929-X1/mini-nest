import { normalize } from "path";
import { container } from "./container";
import { HttpMethod } from "./createMethodDecorator";
import { routeRegistry } from "./routeRegistry";
import { normalizeUrl } from "./utils/normalizePath";

export function simulateRequest(url: string, method: HttpMethod, body?: object) {
    // Normalize the URL to ensure it matches the registered routes
    url = normalizeUrl(url);
    console.log(`Simulating request: ${method} ${url}`);
    const existingRoutes = routeRegistry.find(method, url);
    if (!existingRoutes) {
        throw new Error(`No route found for ${method} ${url}`);
    }
    const { controllerClass, handlerName } = existingRoutes;
    const controllerInstance = container.resolve(controllerClass);
    const handler = controllerInstance[handlerName];

    try {
        const result = handler.call(controllerInstance, body);
        if (result instanceof Promise) {
            result.then(res => console.log('Response:', res)).catch(console.error);
        } else {
            console.log('Response:', result);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}