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

