import { ExecutionContext } from "../core/pipeline/ExecutionContext";

export interface Guard {
    canActivate(ctx: ExecutionContext): boolean | Promise<boolean>
}