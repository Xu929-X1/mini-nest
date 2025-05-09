import { Constructor } from "./container";
import { RouteRecord, routeRegistryTrie } from "./routeRegistry";
import { normalizePath } from "./utils/normalizePath";

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
function createMethodDecorator(method: HttpMethod) {
    return function (url: string) {
        return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
            const controller = (target as any).constructor;
            const prefix = Reflect.getMetadata('prefix', controller) ?? '';
            const fullUrl = normalizePath(prefix, url);

            const route: RouteRecord = {
                method,
                url: fullUrl,
                handlerName: propertyKey,
                controllerClass: controller,
            };

            routeRegistryTrie.addRoute(method, route);
        };
    };
}


const Get = createMethodDecorator('GET');
const Post = createMethodDecorator('POST');
const Put = createMethodDecorator('PUT');
const Delete = createMethodDecorator('DELETE');
const Patch = createMethodDecorator('PATCH');

export { Get, Post, Put, Delete, Patch };