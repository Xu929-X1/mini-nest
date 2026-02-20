export class MetadataKey<T> {
    constructor(public readonly key: string | symbol) { }

    get(target: object, propertyKey?: string | symbol): T | undefined {
        return propertyKey ? Reflect.getMetadata(this.key, target, propertyKey) : Reflect.getMetadata(this.key, target);
    }

    getOrDefault(target: object, defaultValue: T, propertyKey?: string | symbol): T {
        return this.get(target, propertyKey) ?? defaultValue;
    }

    set(target: object, value: T, propertyKey?: string | symbol): void {
        if (propertyKey) {
            Reflect.defineMetadata(this.key, value, target, propertyKey);
        } else {
            Reflect.defineMetadata(this.key, value, target);
        }
    }

    append(target: object, value: T extends (infer U)[] ? U : never, propertyKey?: string | symbol): void {
        const existing = this.getOrDefault(target, [] as T, propertyKey);
        this.set(target, [...(existing as any[]), value] as T, propertyKey);
    }
}