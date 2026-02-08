import { ExecutionContext } from "../core/pipeline/ExecutionContext";

export interface ExceptionFilter<T = any> {
    catch(exception: T, context: ExecutionContext): void | Promise<void>;
    canHandle(exception: unknown): boolean;
}