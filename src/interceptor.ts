import { Constructor } from "./container";
export interface Interceptor {
    intercept(next: () => Promise<any> | any): Promise<any> | any;
}
type MethodInterceptorMap = Map<string, Constructor<Interceptor>[]>;

const classInterceptors = new Map<Constructor, Constructor<Interceptor>[]>();
const methodInterceptors = new Map<Constructor, MethodInterceptorMap>();

type ClassOrPrototype = Constructor | Record<string, any>;
export function resolveController(target: any): Constructor {
    return typeof target === 'function' ? target : target.constructor;
}

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
export function applyInterceptors(interceptors: Constructor<Interceptor>[], next: () => Promise<any> | any) {
    if (interceptors.length === 0) return next();
    const interceptor = interceptors[0];
    const rest = interceptors.slice(1);
    const instance = new interceptor();
    return Promise.resolve(
        instance.intercept(() => applyInterceptors(rest, next))
    );
}

export function getClassInterceptors(controller: Constructor): Constructor<Interceptor>[] {
    return classInterceptors.get(controller) || [];
}

export function getMethodInterceptors(controller: Constructor, method: string): Constructor<Interceptor>[] {
    return methodInterceptors.get(controller)?.get(method) || [];
}