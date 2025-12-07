import { Constructor } from "../container";
import { metadata } from "./metadata";

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
function createMethodDecorator(method: HttpMethod) {
    return function (url: string) {
        return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
            const controller = target.constructor;

            metadata.registerRouteOnMethodDecoratorLoad(controller as Constructor, url, method, propertyKey);
        };
    };
}


const Get = createMethodDecorator('GET');
const Post = createMethodDecorator('POST');
const Put = createMethodDecorator('PUT');
const Delete = createMethodDecorator('DELETE');
const Patch = createMethodDecorator('PATCH');

export { Get, Post, Put, Delete, Patch };