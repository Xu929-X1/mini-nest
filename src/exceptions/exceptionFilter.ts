import { ExecutionContext } from "../core/ExecutionContext";

export interface ExceptionFilter<T = any> {
    catch(exception: T, context: ExecutionContext): void | Promise<void>;
    canHandle(exception: unknown): boolean;
}