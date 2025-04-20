import { Constructor } from "./container";

export type RouteRecord = {
    method: string;
    url: string;
    fullUrl?: string;
    handlerName: string;
    controllerClass: Constructor;
};

class RouteRegistry {
    private routeTable = new Map<string, RouteRecord[]>();

    registerRoute(
        method: string,
        url: string,
        handlerName: string,
        controllerClass: Constructor //this is to store the corresponding controller class for the route
    ) {
        const route: RouteRecord = { method, url, handlerName, controllerClass };
        const existing = this.routeTable.get(url) || [];
        existing.push(route);
        this.routeTable.set(url, existing);
    }

    find(method: string, url: string): RouteRecord | undefined {
        return this.routeTable.get(url)?.find(r => r.method === method);
    }
}

export const routeRegistry = new RouteRegistry();
// this is to store the corresponding controller class for the route, will use this for lookup when controller decorated class is loaded
export const routeMetadata = new Map<Object, RouteRecord[]>(); 