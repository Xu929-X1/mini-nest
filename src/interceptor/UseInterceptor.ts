import { Constructor } from "../core/container/container";
import { metadata } from "../routing/metadata";
import { Interceptor } from "./applyInterceptor";
export type ClassOrPrototype = Constructor | Record<string, any>;
export function UseInterceptor(interceptor: Constructor<Interceptor>) {
    return function (
        target: ClassOrPrototype,
        propertyKey?: string,
    ) {
        if (propertyKey) {
            metadata.registerMethodInterceptor(target, propertyKey, interceptor);
        } else {
            metadata.registerClassInterceptor(target, interceptor);
        }
    };
}