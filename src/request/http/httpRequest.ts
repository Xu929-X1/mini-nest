export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
export interface RawRequest {
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    body?: any;
}

export class HttpRequest {
    readonly method: HttpMethod;
    readonly url: string;
    readonly path: string; // normalized path
    readonly headers?: Record<string, string>;
    readonly query: Record<string, string> = {};
    body: any;

    private _params: Record<string, string> = {};
    constructor(raw: RawRequest) {
        this.method = raw.method;
        this.url = raw.url;
        this.headers = this.normalizeHeaders(raw.headers || {});
        this.body = raw.body;
        const { path, query } = this.parseUrl(raw.url);

        this.path = this.normalizePath(path);
        this.query = query;
    }

    /**
        * Splits a URL string into a normalized path and a query parameter map.
        *
        * @param url Raw URL string (may include query string)
        * @returns An object containing the normalized path and parsed query parameters
    */
    private parseUrl(url: string): { path: string; query: Record<string, string> } {
        const [rawPath, queryString] = url.split('?');
        const path = this.normalizePath(rawPath);
        const query = queryString ? this.parseQueryString(queryString) : {};

        return { path, query };
    }

    /**
     * Normalizes a path string by ensuring it starts with a forward slash and does not end with one.
     * @param path 
     * @returns Normalized path string
     */
    public normalizePath(path: string): string {
        if (!path) return "/";
        if (!path.startsWith('/')) path = '/' + path;
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        return path;
    }

    /**
     * Normalizes header keys to lowercase for consistent access.
     * @param headers 
     * @returns A new record with all header keys normalized to lowercase
     */

    private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
        const normalized: Record<string, string> = {};

        for (const [key, value] of Object.entries(headers)) {
            normalized[key.toLowerCase()] = value;
        }

        return normalized;
    }

    /**
     * Parse a query string into key-value pairs.
     * @param queryString 
     * @returns A record of query parameters parsed from the query string
     */
    private parseQueryString(queryString: string): Record<string, string> {
        const query: Record<string, string> = {};

        const params = new URLSearchParams(queryString);
        params.forEach((value, key) => {
            query[key] = decodeURIComponent(value);
        });

        return query;
    }

    param(key: string): string | undefined {
        return this._params[key];
    }

    header(key: string): string | undefined {
        return this.headers?.[key.toLowerCase()];
    }

    get params(): Record<string, string> {
        return { ...this._params };
    }

    setParams(params: Record<string, string>) {
        this._params = params;
    }

    getQueryParam(key: string): string | undefined {
        return this.query[key];
    }

    get isJson(): boolean {
        const contentType = this.header('content-type');
        return contentType?.includes('application/json') ?? false;
    }

    get ip(): string {
        return (
            this.header('x-forwarded-for')?.split(',')[0].trim() ||
            this.header('x-real-ip') ||
            'unknown'
        );
    }

    accepts(type: string): boolean {
        const acceptHeader = this.header('accept');
        if (!acceptHeader) return false;
        const acceptedTypes = acceptHeader.split(',').map(t => t.split(';')[0].trim());
        return acceptedTypes.includes(type) || acceptedTypes.includes('*/*');
    }
}