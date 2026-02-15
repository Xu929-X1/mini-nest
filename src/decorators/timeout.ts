import { TIMEOUT } from "../routing/metadataKeys"

export function Timeout(ms: number): MethodDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        TIMEOUT.set(target, ms, propertyKey.toString());
    }
}