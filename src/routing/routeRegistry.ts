import { Constructor } from "../core/container/container";
import { HttpMethod, HttpRequest } from "../http/HttpRequest";
import { Middleware } from "../middleware/type";

export type RouteMetadataType = {
    method: string;
    url: string;
    fullUrl?: string;
    handlerName: string;
    controllerClass: Constructor;
    middlewares?: Middleware[];
};
export type RouteTrieNode = {
    segment: string;
    children: Map<string, RouteTrieNode>;
    paramChild?: RouteTrieNode;
    routeMetadata?: RouteMetadataType;
    wildcardChild?: RouteTrieNode;
    greedyWildcard?: RouteTrieNode;
}

class TrieRoute {
    private root = new Map<string, RouteTrieNode>();

    addRoute(method: HttpMethod, route: RouteMetadataType) {
        const segments = (route.fullUrl as string).split('/').filter(Boolean);
        let currentNode = this.root.get(method);
        if (!currentNode) {
            currentNode = { segment: method, children: new Map() };
            this.root.set(method, currentNode);
        }
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (i < segments.length - 1 && segment === "**") {
                throw new Error("Greedy wildcard pattern can only be used at end of the URL");
            }
            if (segment.startsWith(':')) {
                if (!currentNode.paramChild) {
                    currentNode.paramChild = { segment, children: new Map() };
                }
                currentNode = currentNode.paramChild;
            } else if (i === segments.length - 1 && segment === "**") {
                currentNode.greedyWildcard = {
                    segment,
                    children: new Map()
                }
                currentNode = currentNode?.greedyWildcard
            } else if (segment.startsWith('*')) {
                currentNode.wildcardChild = {
                    segment,
                    children: new Map()
                }
                currentNode = currentNode?.wildcardChild
            } else {
                if (!currentNode.children.has(segment)) {
                    currentNode.children.set(segment, { segment, children: new Map() });
                }
                currentNode = currentNode.children.get(segment)!;
            }
        }

        currentNode.routeMetadata = route;
    }

    findRoute(method: HttpMethod, url: string): { route: RouteMetadataType, params: Record<string, string> } | undefined {
        const cleanPath = HttpRequest.normalizePath(url.split('?')[0]);
        const segments = cleanPath.split('/').filter(Boolean);
        let currentNode: RouteTrieNode | undefined = this.root.get(method);
        if (!currentNode) {
            return undefined;
        };
        const params: Record<string, string> = {};
        const paramValues: string[] = [];

        for (const segment of segments) {
            if (currentNode?.children.has(segment)) {
                currentNode = currentNode.children.get(segment)!;
            } else if (currentNode?.paramChild) {
                paramValues.push(segment);
                currentNode = currentNode.paramChild;
            } else if (currentNode?.wildcardChild) {
                currentNode = currentNode?.wildcardChild
            } else if (currentNode?.greedyWildcard) {
                return currentNode.greedyWildcard.routeMetadata ? {
                    route: currentNode.greedyWildcard.routeMetadata,
                    params
                } : undefined
            } else {
                return undefined;
            }
        }

        if (!currentNode?.routeMetadata) return undefined;
        const routeSegments = (currentNode.routeMetadata.fullUrl as string)
            .split('/').filter(Boolean);
        const currentParams: Record<string, string> = {};
        let vi = 0;
        for (const seg of routeSegments) {
            if (seg.startsWith(':')) currentParams[seg.slice(1)] = paramValues[vi++];
        }

        return { route: currentNode.routeMetadata, params: currentParams };
    }

    clear() {
        this.root = new Map<string, RouteTrieNode>();
    }

    deleteRoute(method: HttpMethod, route: RouteMetadataType) {
        const segments = (route.fullUrl ?? route.url).split('/').filter(Boolean);
        let currentNode = this.root.get(method);
        if (!currentNode) {
            throw new Error(`No routes found for method ${method}`);
        }
        const stack: RouteTrieNode[] = [];

        for (const segment of segments) {
            if (currentNode.children.has(segment)) {
                stack.push(currentNode);
                currentNode = currentNode.children.get(segment)!;
            } else if (currentNode.paramChild) {
                stack.push(currentNode);
                currentNode = currentNode.paramChild;
            } else if (currentNode.wildcardChild) {
                stack.push(currentNode);
                currentNode = currentNode?.wildcardChild
            } else if (currentNode.greedyWildcard) {
                stack.push(currentNode);
                currentNode = currentNode?.greedyWildcard
            }
        }

        if (currentNode.routeMetadata) {
            currentNode.routeMetadata = undefined;
        }
        // Clean up the trie if necessary
        for (let i = stack.length - 1; i >= 0; i--) {
            const parentNode = stack[i];
            if (currentNode.children.size === 0 && !currentNode.paramChild) {
                parentNode.children.delete(currentNode.segment);
                currentNode = parentNode;
            } else {
                break; // stop if we find a node with children
            }
        }
    }

}

export const routeRegistryTrie = new TrieRoute();