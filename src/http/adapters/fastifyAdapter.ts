import { HttpAdapter, RequestHandler } from "./httpAdapter";
import Fastify, { FastifyHttpsOptions, FastifyInstance } from "fastify";
import * as fs from "fs";
import * as https from "https";
import { HttpMethod } from "../HttpRequest";

export interface FastifyAdapterOptions {
    https?: {
        key: string;
        cert: string;
    }
}

export class FastifyAdapter implements HttpAdapter {
    private app: FastifyInstance;

    constructor(private handler: RequestHandler, private options?: FastifyAdapterOptions) {
        if (this.options?.https) {
            this.app = Fastify({
                https: {
                    key: fs.readFileSync(this.options.https.key, 'utf8'),
                    cert: fs.readFileSync(this.options.https.cert, 'utf8'),
                }
            } as FastifyHttpsOptions<https.Server>);
        } else {
            this.app = Fastify();
        }

        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.app.route({
            method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
            url: '*',
            handler: async (request, reply) => {
                const result = await this.handler({
                    method: request.method as HttpMethod,
                    url: request.url,
                    headers: request.headers as Record<string, string>,
                    body: request.body as any,
                });

                reply.status(result.statusCode);
                for (const [key, value] of Object.entries(result.headers)) {
                    reply.header(key, value as string);
                }
                return result.body;
            }
        });
    }

    listen(port: number, cb?: () => void): void {
        this.app.listen({ port, host: '0.0.0.0' }).then(() => {
            cb?.();
        }).catch((err) => {
            console.error(err);
            process.exit(1);
        });
    }

    async shutdown(): Promise<void> {
        await this.app.close();
    }
}