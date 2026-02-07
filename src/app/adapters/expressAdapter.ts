import { HttpAdapter, RequestHandler } from "./httpAdapter";
import express, { Express } from "express";
import * as http from "http";
import { HttpMethod } from "../../request/http/httpRequest";
export class ExpressAdapter implements HttpAdapter {
    private app: Express;
    private server: http.Server | null = null;

    constructor(private handler: RequestHandler) {
        this.app = express();
        this.app.use(express.json());
        
        this.app.use(async (req, res) => {
            const result = await this.handler({
                method: req.method as HttpMethod,
                url: req.originalUrl,
                headers: req.headers as Record<string, string>,
                body: req.body,
            });

            res.status(result.statusCode);
            for (const [key, value] of Object.entries(result.headers)) {
                res.setHeader(key, value);
            }
            res.send(result.body);
        });
    }

    listen(port: number, cb?: () => void): void {
        this.server = this.app.listen(port, cb);
    }

    async shutdown(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => resolve());
            } else {
                resolve();
            }
        });
    }
}