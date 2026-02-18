import { request } from "undici";
import { Injectable } from "../../decorators/Injectable";
import { HttpMethod } from "../httpRequest";
import { Log } from "../../utils/log";

export interface RequestOptions {
    headers?: Record<string, string | string[] | undefined>,
    timeout?: number,
    retries?: number,
    params?: Record<string, string | number | undefined>
}

export interface HttpClientResponse<T> {
    data: T,
    status: number,
    headers?: Record<string, string | string[] | undefined>
}

interface SourceConfig {
    url: string,
    method?: HttpMethod,
    body?: any;
    headers?: Record<string, string>
}

interface AggregateResultItem {
    key: string;
    data: any;
    error: Error | null;
}

type SourceDef = string | SourceConfig

export interface AggregateOption<S extends Record<string, SourceDef>, R> {
    sources: S,
    output: (
        sources: {
            [K in keyof S]: any
        },
        errors?: {
            [K in keyof S]?: Error
        }
    ) => R,
    timeout?: number;
    partial?: boolean;
    params?: Record<string, any>;
    baseUrl?: string
}

export interface AggregateResult<R> {
    data: R
    errors?: Record<string, Error>
}

@Injectable()
export class HttpClient {
    private defaultTimeout = 10000;
    private defaultRetries = 0;

    async get<T = any>(url: string, options?: RequestOptions): Promise<HttpClientResponse<T>> {
        return this.dispatchRequest<T>('GET', url, undefined, options);
    }

    async post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<HttpClientResponse<T>> {
        return this.dispatchRequest<T>('POST', url, body, options);
    }

    async put<T = any>(url: string, body?: any, options?: RequestOptions): Promise<HttpClientResponse<T>> {
        return this.dispatchRequest<T>('PUT', url, body, options);
    }

    async patch<T = any>(url: string, body?: any, options?: RequestOptions): Promise<HttpClientResponse<T>> {
        return this.dispatchRequest<T>('PATCH', url, body, options);
    }

    async delete<T = any>(url: string, options?: RequestOptions): Promise<HttpClientResponse<T>> {
        return this.dispatchRequest<T>('DELETE', url, undefined, options);
    }

    async aggregate<S extends Record<string, SourceDef>, R>(options: AggregateOption<S, R>): Promise<AggregateResult<R>> {
        const { params = {}, sources, output, timeout, partial = false, baseUrl = '' } = options;
        const requestEntries = Object.entries(sources);
        const promises: Promise<AggregateResultItem>[] = requestEntries.map(async ([key, source]) => {
            //if source is only string default to get method
            const config = typeof source === 'string' ? { url: source, method: "GET", headers: undefined, body: undefined } : { method: "GET", ...source };
            const url = baseUrl + this.resolveUrl(config.url, params);
            try {
                let res
                switch (config.method as HttpMethod) {
                    case "GET":
                        res = await this.get(url, { timeout, headers: config.headers });
                        break;
                    case "POST":
                        res = await this.post(url, config.body, { timeout, headers: config.headers });
                        break;
                    case "PUT":
                        res = await this.put(url, config.body, { timeout, headers: config.headers });
                        break;
                    case "DELETE":
                        res = await this.delete(url, { timeout, headers: config.headers });
                        break;
                    case "PATCH":
                        res = await this.patch(url, config.body, { timeout, headers: config.headers });
                        break;
                    default:
                        throw Error("Unsupported method detected");
                }
                return {
                    key,
                    data: res?.data,
                    error: null
                }
            } catch (error) {
                if (partial) {
                    return {
                        key,
                        data: null,
                        error: error as Error
                    }
                } else {
                    throw error;
                }
            }
        });

        const results = await Promise.all(promises);
        const sourcesData: Record<string, any> = {};
        const errors: Record<string, Error> = {};


        for (const result of results) {
            if (result.error) {
                errors[result.key] = result.error;
            } else {
                sourcesData[result.key] = result.data;
            }
        }

        const data = output(sourcesData as any, errors);
        return {
            data,
            errors
        }
    }

    private resolveUrl(template: string, params: Record<string, any>): string {
        return template.replace(/:(\w+)/g, (_, key) => {
            const value = params[key];
            if (value === undefined) {
                throw new Error(`Missing param: ${key}`);
            }
            return encodeURIComponent(String(value));
        });
    }

    private async dispatchRequest<T>(
        method: HttpMethod,
        url: string,
        body?: any,
        options?: RequestOptions
    ): Promise<HttpClientResponse<T>> {
        const fullUrl = this.buildUrl(url, options?.params);
        const retries = options?.retries ?? this.defaultRetries;
        const timeout = options?.timeout ?? this.defaultTimeout;

        let lastError: Error | undefined;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const startTimeStamp = Date.now();
                const response = await request(fullUrl, {
                    method: method,
                    headers: {
                        "Content-type": "application/json",
                        ...options?.headers
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    headersTimeout: timeout,
                    bodyTimeout: timeout
                });

                const data = await response.body.json() as T;
                Log.info(`[HttpClient] ${method} ${fullUrl} - ${response.statusCode} (${Date.now() - startTimeStamp}ms)`);
                return {
                    data,
                    status: response.statusCode,
                    headers: response.headers
                }

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                Log.warn(`[HttpClient] ${method} ${fullUrl} - attempt ${attempt + 1} failed: ${lastError.message}`);
                if (attempt < retries) {
                    await this.delay(100 * Math.pow(2, attempt));
                }
            }
        }

        Log.error(`[HttpClient] ${method} ${fullUrl} - all ${retries + 1} attempts failed`);
        throw lastError;
    }

    private buildUrl(url: string, params?: Record<string, string | number | undefined>): string {
        if (!params) return url;

        const filtered = Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]);

        if (filtered.length === 0) return url;

        const queryString = new URLSearchParams(filtered).toString();
        const separator = url.includes('?') ? '&' : '?';
        return url + separator + queryString;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}