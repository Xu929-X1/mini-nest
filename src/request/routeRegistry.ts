import { Constructor } from "../container";
import { Log } from "../log/log";
import { HttpMethod, HttpRequest } from "./http/httpRequest";
import { classInterceptors, Interceptor, methodInterceptors } from "./interceptor";
import { Middleware } from "./middleware/type";

export type RouteMetadataType = {
    method: string;
    url: string;
    fullUrl?: string;
    handlerName: string;
    controllerClass: Constructor;
    interceptors?: Constructor<Interceptor>[];
    middlwares?: Middleware[];
};
export type RouteTrieNode = {
    segment: string;
    children: Map<string, RouteTrieNode>;
    paramChild?: RouteTrieNode;
    paramName?: string;
    routeMetadata?: RouteMetadataType;
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
        const cInterceptors = classInterceptors.get(route.controllerClass);
        const mInterceptors = methodInterceptors.get(route.controllerClass)?.get(route.handlerName) ?? [];
        const allInterceptors = [...(cInterceptors ?? []), ...mInterceptors];
        if (allInterceptors.length > 0) {
            route.interceptors = allInterceptors;
        }
        currentNode.routeMetadata = route;
    }

    findRoute(method: HttpMethod, url: string): { route: RouteMetadataType, params: Record<string, string> } | undefined {
        const cleanPath = HttpRequest.normalizePath(url.split('?')[0]);
        const segments = cleanPath.split('/').filter(Boolean);
        let currentNode: RouteTrieNode | undefined = this.root.get(method);
        if (!currentNode) {
            throw new Error(`No routes found for method ${method}`);
        };
        const params: Record<string, string> = {};


        for (const segment of segments) {
            if (currentNode?.children.has(segment)) {
                currentNode = currentNode.children.get(segment)!;
            } else if (currentNode?.paramChild) {
                params[currentNode.paramChild.paramName!] = segment;
                currentNode = currentNode.paramChild;
            } else {
                return undefined;
            }
        }
        return currentNode?.routeMetadata ? {
            route: currentNode.routeMetadata,
            params: params,
        } : undefined;
    }

    clear() {
        this.root = new Map<string, RouteTrieNode>();
    }

    deleteRoute(method: HttpMethod, route: RouteMetadataType) {
        const segments = route.url.split('/').filter(Boolean);
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
            } else {
                return; // no match, nothing to delete
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

    log() {
        Log.info("Current Route Trie:");
    }

}

export const routeRegistryTrie = new TrieRoute();