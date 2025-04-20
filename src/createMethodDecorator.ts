import { Constructor } from "./container";
import { routeMetadata, RouteRecord } from "./routeRegistry";

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
function createMethodDecorator<T extends Function>(method: HttpMethod) {
    return function (url: string) {
        return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
            // Register the route in the route registry
            const newRoute: RouteRecord = {
                method: method,
                url, // at this point, target is the class prototype, concatneate later
                handlerName: propertyKey,
                controllerClass: target.constructor as Constructor<any>,
            };
            // Register the controller class with routeMetadata
            const existingRoutes = routeMetadata.get(target.constructor);
            if (existingRoutes) {
                existingRoutes.push(newRoute);
            } else {
                routeMetadata.set(target.constructor, [newRoute]);
            }
        }
    }
}

const Get = createMethodDecorator('GET');
const Post = createMethodDecorator('POST');
const Put = createMethodDecorator('PUT');
const Delete = createMethodDecorator('DELETE');
const Patch = createMethodDecorator('PATCH');

export { Get, Post, Put, Delete, Patch };