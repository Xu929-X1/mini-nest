import { Constructor } from "../core/container/container";
import { classInterceptors, Interceptor, methodInterceptors, resolveController } from "./interceptor";
export type ClassOrPrototype = Constructor | Record<string, any>;

export function UseInterceptor(interceptor: Constructor<Interceptor>) {
    return function (
        target: ClassOrPrototype,
        propertyKey?: string,
        descriptor?: PropertyDescriptor
    ) {
        const controller = resolveController(target);
        if (propertyKey) {
            const methodMap = methodInterceptors.get(controller) ?? new Map();
            const list = methodMap.get(propertyKey) ?? [];
            list.push(interceptor);
            methodMap.set(propertyKey, list);
            methodInterceptors.set(controller, methodMap);
        } else {
            const list = classInterceptors.get(controller) ?? [];
            list.push(interceptor);
            classInterceptors.set(controller, list);
        }
    };
}