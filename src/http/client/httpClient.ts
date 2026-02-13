import { errors, request } from "undici";
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