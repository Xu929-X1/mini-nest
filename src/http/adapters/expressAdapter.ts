import { HttpAdapter, RequestHandler } from "./httpAdapter";
import express, { Express } from "express";
import * as http from "http";
import * as fs from "fs";
import * as https from "https";
import { HttpMethod } from "../httpRequest";

export interface ExpressAdapterOptions {
    https?: {
        key: string;
        cert: string;
    }
}

export class ExpressAdapter implements HttpAdapter {
    private app: Express;
    private server: http.Server | null = null;

    constructor(private handler: RequestHandler, private options?: ExpressAdapterOptions) {
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
                res.setHeader(key, value as string); 
            }
            res.send(result.body);
        });
    }

    listen(port: number, cb?: () => void): void {
        if (this.options?.https) {
            const { key, cert } = this.options.https;
            const credentials = {
                key: fs.readFileSync(key, 'utf8'),
                cert: fs.readFileSync(cert, 'utf8'),
            };
            this.server = https.createServer(credentials, this.app).listen(port, cb);
        } else {
            this.server = this.app.listen(port, cb);
        }
    }

    async shutdown(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}