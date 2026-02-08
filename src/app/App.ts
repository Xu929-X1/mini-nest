import { Constructor, Container } from "../container";
import { checkDecoratorMetadata } from "../decoratorCheck";
import { InternalServerErrorException } from "../exceptions";
import { OnAppBootstrap, OnAppShutdown } from "../lifecycle";
import { Log } from "../log/log";
import { RequestPipeline } from "../request/core/RequestPipeline";
import { RawRequest } from "../request/http/httpRequest";
import { HttpAdapter } from "./adapters/httpAdapter";
export type HTTPAdapter = "express" | "not-supported"; //we'll support more later, possibly.. :)
export type AppOptions = {
    port?: number,
    adapter?: HTTPAdapter,
    controllers: Constructor[]
    /**
     * I am still thinking about how to design this, currently 2 ways:
     * 1. Support only http and let nginx handle https, which is more common in production and simpler to implement.
     * 2. Support both http and https in the app, which is more flexible but requires more work to implement and maintain.
    */
    https?: {
        key: string;
        cert: string;
    }
}

export class App {
    server: HttpAdapter | null = null;
    private readonly container: Container;
    constructor(private readonly options: AppOptions) {
        this.options.adapter = options.adapter || "express";
        this.options.port = options.port || 8080;
        this.container = Container.instance;
    };

    async listen(cb: () => void = () => { }): Promise<void> {
        checkDecoratorMetadata();
        await this.bootstrapControllers();
        await this.triggerBootstrapHooks();
        const requestPipeline = new RequestPipeline(Container.instance);
        const port = this.options.port || 8080;
        const protocol = this.options.https ? 'HTTPS' : 'HTTP';
        switch (this.options.adapter) {
            case "express":
                Log.info(`Starting ${protocol} server with Express adapter...`);
                const { ExpressAdapter } = await import("./adapters/expressAdapter");
                const handler = async (raw: RawRequest) => {
                    return await requestPipeline.handle(raw);
                };
                const adapter = new ExpressAdapter(handler, {
                    https: this.options.https,
                });
                this.server = adapter;
                adapter.listen(port, cb);
                Log.info(`Server is listening on port ${port}`);
                break;
            default:
                throw new Error(`Unsupported HTTP adapter: ${this.options.adapter}`);
        }

        this.setupGracefulShutdown();
    }

    async shutdown(): Promise<void> {
        await this.triggerShutdownHooks();
        if (this.server) {
            await this.server.shutdown();
            await this.container.shutdown();
        } else {
            throw new InternalServerErrorException("Server is not running");
        }
    }

    private async bootstrapControllers(): Promise<void> {
        const controllers = this.options.controllers || [];
        if (controllers.length === 0) {
            Log.warn("No controllers registered, did you forget to add controllers to createMiniNestApp()?");
            return;
        }

        for (const controller of controllers) {
            this.container.resolve(controller);
        }
        Log.info(`[Controller Register]: Registered ${controllers.length} controllers`)
    }

    private setupGracefulShutdown(): void {
        const shutdown = async () => {
            Log.info('Shutting down server...');
            await this.shutdown();
            process.exit(0);
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }

    private async triggerBootstrapHooks(): Promise<void> {
        const registeredInstances = this.container.getInstances();
        for (const instance of registeredInstances) {
            const maybeBootstrap = instance as unknown as OnAppBootstrap;
            if (maybeBootstrap && typeof maybeBootstrap.onAppBootstrap === 'function') {
                await maybeBootstrap.onAppBootstrap();
            }
        }
    }

    private async triggerShutdownHooks(): Promise<void> {
        const registeredInstances = this.container.getInstances();
        for (const instance of registeredInstances) {
            const maybeShutdown = instance as unknown as OnAppShutdown;
            if (maybeShutdown && typeof maybeShutdown.onAppShutdown === 'function') {
                await maybeShutdown.onAppShutdown();
            }
        }
    }
}

export function createMiniNestApp(options: AppOptions): App {
    return new App({
        port: options.port || 8080,
        adapter: options.adapter || "express",
        https: options.https,
        controllers: options.controllers
    });
}