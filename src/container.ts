import { OnDestroy, OnInit } from "./lifecycle";

export interface Constructor<T = any> extends Function {
    new(...args: any[]): T;
}
class Container {
    // DI container
    private container = new Map<Constructor, any>();
    // dep map
    private depMap = new Map<Constructor, Constructor[]>();

    private readonly instances = new Set<any>();
    private static created: boolean = false;
    constructor() {
        if (Container.created) {
            throw new Error("Container is a singleton class and has already been instantiated.");
        }
        Container.created = true;
    }

    register(token: Constructor, deps?: Constructor[]): void {
        if (deps) {
            this.depMap.set(token, deps);
        }
    }

    // resolve a token, if it is not in the container, create a new instance and store it in the container
    resolve<T>(token: Constructor<T>): T {
        if (this.container.has(token)) {
            return this.container.get(token) as T;
        }
        try {
            const deps = this.depMap.get(token) || Reflect.getMetadata("design:paramtypes", token) || [];
            const injections = deps.map((param: Constructor) => this.resolve(param));
            const newInstance = new token(...injections);
            this.container.set(token, newInstance);
            this.instances.add(newInstance);

            const maybeInit = newInstance as unknown as OnInit;
            if (maybeInit && typeof maybeInit.onModuleInit === 'function') {
                maybeInit.onModuleInit();
            }

            return newInstance;
        } catch (error) {
            throw new Error(`Error resolving ${token.name}: ${error}`);
        }

    }

    async shutdown(): Promise<void> {
        for (const instance of this.instances) {
            const maybeDestroy = instance as unknown as OnDestroy;
            if (maybeDestroy && typeof maybeDestroy.onModuleDestroy === 'function') {
                await maybeDestroy.onModuleDestroy();
            }
        }
    }
}

export const container = new Container(); 