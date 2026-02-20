import { Constructor } from "../core/container/container";
import { Interceptor } from "../interceptors/Interceptor";
import { INTERCEPTORS } from "../routing/metadataKeys";
export type ClassOrPrototype = Constructor | Record<string, any>;
export function UseInterceptor(interceptor: Constructor<Interceptor>) {
    return function (
        target: ClassOrPrototype,
        propertyKey?: string,
    ) {
        if (propertyKey) {
            INTERCEPTORS.append(target, interceptor, propertyKey);
        } else {
            INTERCEPTORS.append(target, interceptor);
        }
    };
}