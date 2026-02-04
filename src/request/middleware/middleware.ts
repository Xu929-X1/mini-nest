import { Middleware } from "./type";


 class MiddlewareRegistry {
    private globalMiddlewares: Middleware[] = [];
    private routeMiddlewares: Map<string, Middleware[]> = new Map();

    registerGlobal(middleware: Middleware) {
        this.globalMiddlewares.push(middleware);
    }
    registerForRoute(routeKey: string, middleware: Middleware) {
        const middlewares = this.routeMiddlewares.get(routeKey) || [];
        middlewares.push(middleware);
        this.routeMiddlewares.set(routeKey, middlewares);
    }

    getMiddlewares(routeKey?: string): Middleware[] {
        const routeMiddlewares = routeKey ? this.routeMiddlewares.get(routeKey) || [] : [];
        return [...this.globalMiddlewares, ...routeMiddlewares];
    }

}

export const middlewareRegistry = new MiddlewareRegistry();

export async function runMiddleware(middlewares: Middleware[], req: Request, res: Response) {
    let index = -1;
    async function dispatch(i: number): Promise<void> {
        if (i <= index) {
            throw new Error('next() called multiple times');
        }

        index = i;
        const currentMiddleware = middlewares[i];

        if (currentMiddleware) {
            await currentMiddleware(req, res, () => dispatch(i + 1));
        } else {
            return;
        }
    }

    await dispatch(0);
}