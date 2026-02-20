export interface Interceptor {
    intercept(next: () => Promise<unknown> | unknown): Promise<unknown> | unknown;
}
