import { RETRY } from "../../routing/metadataKeys"

export function Retry(times: number): MethodDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        RETRY.set(target, times, propertyKey.toString());
    }
}