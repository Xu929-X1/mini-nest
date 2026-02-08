import { ExecutionContext } from "./request/core/ExecutionContext";
import { OnDestroy, OnInit } from "./lifecycle";

export interface Constructor<T = any> extends Function {
    new(...args: any[]): T;
}
export class Container {
    // DI container
    private container = new Map<Constructor, any>();
    // dep map
    private depMapOverride = new Map<Constructor, Constructor[]>();
    private readonly instances = new Set<any>();
    private static _containerInstance: Container;
    //currently we support singleton scope, later when module is implemented, we can support transient scope and request scope as well
    static get instance(): Container {
        if (!this._containerInstance) {
            this._containerInstance = new Container();
        }
        return this._containerInstance;
    }

    getInstances() {
        return this.instances;
    }

    // allow manual registration of dependencies, useful for testing and overriding dependencies
    registerOverride(token: Constructor, deps?: Constructor[]): void {
        if (deps) {
            this.depMapOverride.set(token, deps);
        }
    }

    // resolve a token, if it is not in the container, create a new instance and store it in the container
    resolve<T>(token: Constructor<T>, context?: ExecutionContext): T {
        if (this.container.has(token)) {
            return this.container.get(token) as T;
        }
        try {
            const deps = this.depMapOverride.get(token) || Reflect.getMetadata("design:paramtypes", token) || [];
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
