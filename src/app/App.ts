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
}

export class App {
    server: HttpAdapter | null = null;
    private readonly container: Container;
    constructor(private readonly options: AppOptions) {
        this.options.adapter = options.adapter || "express";
        this.options.port = options.port || 8080;
        this.container = Container.instance;
    };

    async listen(port: number = 8080, cb: () => void = () => { }): Promise<void> {
        const requestPipeline = new RequestPipeline(Container.instance);
        switch (this.options.adapter) {
            case "express":
                Log.info("Starting server with Express adapter...");
                const { ExpressAdapter } = await import("./adapters/ExpressAdapter");
                const handler = async (raw: RawRequest) => {
                    return await requestPipeline.handle(raw);
                }
                const adapter = new ExpressAdapter(handler);
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