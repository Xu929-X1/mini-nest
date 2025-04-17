export type Constructor<T = any> = new (...args: any[]) => T;
class Container {

    private container = new Map<Constructor, any>();
    private depMap = new Map<Constructor, Constructor[]>();
    constructor() {
    }

    register(token: Constructor, deps: Constructor[]): void {
        this.depMap.set(token, deps);
    }

    resolve<T>(token: Constructor<T>): T {
        if (this.container.has(token)) {
            return this.container.get(token) as T;
        }
        try {
            const deps = this.depMap.get(token) || Reflect.getMetadata("design:paramtypes", token);
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