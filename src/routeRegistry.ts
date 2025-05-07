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

    get(method: string, url: string): RouteRecord | undefined {
        return this.routeTable.get(url)?.find(r => r.method === method);
    }

    getAllRoutes() {
        const allRoutes: RouteRecord[] = [];
        this.routeTable.forEach(routes => {
            allRoutes.push(...routes);
        });
        return allRoutes;
    }

    clear() {
        this.routeTable.clear();
    }
}

export const routeRegistry = new RouteRegistry();
// this is to store the corresponding controller class for the route, will use this for lookup when controller decorated class is loaded
export const routeMetadata = new Map<Object, RouteRecord[]>();

type RouteTrieNode = {
    segment: string;
    children: Map<string, RouteTrieNode>;
    paramChild?: RouteTrieNode;
    paramName?: string;
    handler?: RouteRecord;
}

class TrieRoute {
    private root: RouteTrieNode = { segment: '', children: new Map() };

    addRoute(route: RouteRecord) {
        const segments = route.url.split('/').filter(Boolean);
        let currentNode = this.root;

        for (const segment of segments) {
            if (segment.startsWith(':')) {
                if (!currentNode.paramChild) {
                    currentNode.paramChild = { segment, children: new Map() };
                }
                currentNode = currentNode.paramChild;
                currentNode.paramName = segment.slice(1); // remove ':'
            } else {
                if (!currentNode.children.has(segment)) {
                    currentNode.children.set(segment, { segment, children: new Map() });
                }
                currentNode = currentNode.children.get(segment)!;
            }
        }

        currentNode.handler = route;
    }

   
}