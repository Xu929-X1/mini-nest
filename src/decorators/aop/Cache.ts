import { CACHE } from "../../routing/metadataKeys";

export interface CacheOptions {
    ttl: number,
    key?: string | symbol
}

export function Cache(options: CacheOptions | number): MethodDecorator {
    return function (target: Object, propertyKey: string | symbol) {
        const opts: CacheOptions = typeof options === 'number'
            ? { ttl: options }
            : options;
        CACHE.set(target, opts, propertyKey.toString());
    }
}