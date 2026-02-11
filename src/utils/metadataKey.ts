export class MetadataKey<T> {
    constructor(public readonly key: string) { }

    get(target: object, propertyKey?: string): T | undefined {
        return propertyKey ? Reflect.getMetadata(this.key, target, propertyKey) : Reflect.getMetadata(this.key, target);
    }

    getOrDefault(target: object, defaultValue: T, propertyKey?: string): T {
        return this.get(target, propertyKey) ?? defaultValue;
    }

    set(target: object, value: T, propertyKey?: string): void {
        if (propertyKey) {
            Reflect.defineMetadata(this.key, value, target, propertyKey);
        } else {
            Reflect.defineMetadata(this.key, value, target);
        }
    }

    append(target: object, value: T extends (infer U)[] ? U : never, propertyKey?: string): void {
        const existing = this.getOrDefault(target, [] as T, propertyKey);
        this.set(target, [...(existing as any[]), value] as T, propertyKey);
    }
}