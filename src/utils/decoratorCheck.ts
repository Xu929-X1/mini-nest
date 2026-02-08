import "reflect-metadata";
import { Log } from "./log";
// Preflight check for emitDecoratorMetadata
export function checkDecoratorMetadata() {
    @((target: any) => { })
    class Test {
        constructor(dep: string) { }
    }

    const metadata = Reflect.getMetadata("design:paramtypes", Test);
    if (!metadata) {
        throw new Error(
            `[mini-nest] emitDecoratorMetadata is not enabled!\n` +
            `Your compiler (tsx/esbuild) doesn't support decorator metadata.\n\n` +
            `Solutions:\n` +
            `  1. Use ts-node: npx ts-node your-app.ts\n` +
            `  2. Use tsc: npx tsc && node dist/your-app.js\n` +
            `  3. Configure SWC with decoratorMetadata: true\n`
        );
    }else{
        Log.info('[Metadata check]: Metadata check complete, starting server...')
    }
}