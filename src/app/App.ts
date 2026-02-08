import { Container } from "../container";
import { InternalServerErrorException } from "../exceptions";
import { Log } from "../log/log";
import { RequestPipeline } from "../request/core/RequestPipeline";
import { RawRequest } from "../request/http/httpRequest";
import { HttpAdapter } from "./adapters/httpAdapter";
export type HTTPAdapter = "express" | "not-supported"; //we'll support more later, possibly.. :)
export type AppOptions = {
    port?: number,
    adapter?: HTTPAdapter,
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
    }


    async shutdown(): Promise<void> {
        if (this.server) {
            await this.server.shutdown();
            await this.container.shutdown();
        } else {
            throw new InternalServerErrorException("Server is not running");
        }
    }

}

export function createMiniNestApp(options: AppOptions): App {
    return new App({
        port: options.port || 8080,
        adapter: options.adapter || "express",
    });
}