import { CIRCUITBREAKER } from "../../routing/metadataKeys";

export interface CircuitBreakerOptions {
    failureThreshold?: number //retry times
    resetTimeout?: number; //in unit ms
}

export function CircuitBreaker(options: CircuitBreakerOptions = {}): MethodDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        CIRCUITBREAKER.set(target, options, propertyKey);
    }
}