import { Constructor } from "../core/container/container";
import { HttpMethod } from "../http/httpRequest";
import { metadata } from "../routing/metadata";

function createMethodDecorator(method: HttpMethod) {
    return function (url: string) {
        return function (target: Object, propertyKey: string, descriptor?: PropertyDescriptor) {
            const controller = target.constructor;

            metadata.registerRouteOnMethodDecoratorLoad(controller as Constructor, url, method, propertyKey);
        };
    };
}


export const Get = createMethodDecorator('GET');
export const Post = createMethodDecorator('POST');  
export const Put = createMethodDecorator('PUT');
export const Delete = createMethodDecorator('DELETE');
export const Patch = createMethodDecorator('PATCH');
export const Options = createMethodDecorator('OPTIONS');
export const Head = createMethodDecorator('HEAD');

