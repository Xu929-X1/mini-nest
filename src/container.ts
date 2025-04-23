export interface Constructor<T = any> extends Function {
    new(...args: any[]): T;
}
class Container {
    // DI container
    private container = new Map<Constructor, any>();
    // dep map
    private depMap = new Map<Constructor, Constructor[]>();
    constructor() {
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

            return newInstance;
        } catch (error) {

            throw new Error(`Error resolving ${token.name}: ${error}`);
        }

    }
}

export const container = new Container(); 