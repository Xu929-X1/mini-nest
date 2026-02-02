export type Middleware = (req: Request, res: Response, next: () => Promise<void>) => void | Promise<void>;
