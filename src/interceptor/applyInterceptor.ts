import { Constructor, Container } from "../core/container/container";
export interface Interceptor {
    intercept(next: () => Promise<unknown> | unknown): Promise<unknown> | unknown;
}

export const INTERCEPTOR_KEY = "mini-nest:interceptor";

export function resolveController(target: any): Constructor {
    return typeof target === 'function' ? target : target.constructor;
}


export function applyInterceptors(interceptors: Constructor<Interceptor>[], next: () => Promise<unknown> | unknown): Promise<unknown> {
    if (interceptors.length === 0) return Promise.resolve(next());
    try {
        const interceptor = interceptors[0];
        const rest = interceptors.slice(1);
        const instance = Container.instance.resolve<Interceptor>(interceptor);
        return Promise.resolve(
            instance.intercept(() => applyInterceptors(rest, next))
        );
    } catch (err) {
        return Promise.reject(err);
    }
}