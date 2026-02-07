import { ExecutionContext } from "./core/ExecutionContext";

//module related stuff
export interface OnInit {
    onModuleInit(): void | Promise<void>;
}

export interface OnDestroy {
    onModuleDestroy(): void | Promise<void>;
}


//application layer stuff
export interface OnAppBootstrap {
    onAppBootstrap(): void | Promise<void>;
}

export interface OnAppShutdown {
    onAppShutdown(): void | Promise<void>;
}

//request lifecycle stuff
export interface OnBeforeHandle {
    onBeforeHandle(ctx: ExecutionContext): void | Promise<void>;
}

export interface OnAfterHandle {
    onAfterHandle(ctx: ExecutionContext): void | Promise<void>;
}

export interface OnHandleError {
    onHandleError(ctx: ExecutionContext, error: Error): void | Promise<void>;
}