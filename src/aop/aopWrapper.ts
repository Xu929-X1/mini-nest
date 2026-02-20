import { cacheManager } from "../cache/cacheManager";
import { circuitBreakerManager } from "../circuitBreaker/circuitBreakerManager";
import { CircuitOpenError } from "../circuitBreaker/circuitOpenError";
import { Constructor } from "../core/container/container";
import { CacheOptions } from "../decorators/aop/Cache";
import { CircuitBreakerOptions } from "../decorators/aop/CircuitBreaker";
import { CACHE, CIRCUITBREAKER, RETRY, TIMEOUT } from "../routing/metadataKeys";

export interface AOPContext {
    target: Object;
    method: Function;
    args: any[];
    methodName: string;
    className: string;
    timeout?: number;
    retry?: number;
    cache?: CacheOptions;
    circuitBreaker?: CircuitBreakerOptions;
}

export function wrapWithAOP<T extends object>(instance: T, token: Constructor<T>): T {
    const proto = token.prototype;
    return new Proxy(instance, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);

            if (typeof original !== 'function') {
                return original;
            }

            const propKey = String(prop);
            const timeout = TIMEOUT.get(proto, propKey);
            const cache = CACHE.get(proto, propKey);
            const retry = RETRY.get(proto, propKey);
            const circuitBreaker = CIRCUITBREAKER.get(proto, propKey);
            if (timeout === undefined && cache === undefined && retry === undefined && circuitBreaker === undefined) {
                return original.bind(target);
            }

            return async function (...args: any[]) {
                return executeWithAOP({
                    target,
                    method: original,
                    args,
                    methodName: propKey,
                    className: token.name,
                    timeout,
                    cache,
                    retry,
                    circuitBreaker
                })
            }
        }
    })
}



export async function executeWithAOP(ctx: AOPContext) {
    const {
        target,
        method,
        args,
        timeout,
        className,
        methodName,
        retry,
        cache,
        circuitBreaker
    } = ctx;

    const circuitKey = `${className}-${methodName}`
    if (circuitBreaker) {
        const { failureThreshold = 5, resetTimeout = 30000 } = circuitBreaker;
        const { allowed, reason } = circuitBreakerManager.canExecute(circuitKey, resetTimeout);
        if (!allowed) {
            throw new CircuitOpenError(reason!);
        }
    }

    const cacheKey = cache
        ? (cache.key ?? `${className}:${methodName}:${JSON.stringify(args)}`)
        : null;
    if (cacheKey && cacheManager.has(cacheKey)) {
        return cacheManager.get(cacheKey);
    }

    //build execution function
    const execute = async (): Promise<any> => {
        const promise = method.apply(target, args);

        if (timeout === undefined) {
            return promise;
        }

        return withTimeout(promise, timeout)
    }

    try {


        const result = retry !== undefined ? await withRetry(execute, retry) : await execute();

        if (circuitBreaker) {
            circuitBreakerManager.recordSuccess(circuitKey);
        }
        if (cacheKey && cache) {
            cacheManager.set(cacheKey, result, cache.ttl);
        }

        return result;
    } catch (error) {
        if (circuitBreaker) {
            const { failureThreshold = 5 } = circuitBreaker;
            circuitBreakerManager.recordFailure(circuitKey, failureThreshold)
        }

        throw error;
    }

}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
            return setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
        })
    ])
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry<T>(fn: () => Promise<T>, maxRetryTime: number): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetryTime; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (!(error instanceof Error)) {
                error = new Error(String(error));
            }
            lastError = error as Error;
            if (attempt < maxRetryTime) {
                await delay(100 * Math.pow(2, attempt));
            }
        }
    }
    throw lastError;
}