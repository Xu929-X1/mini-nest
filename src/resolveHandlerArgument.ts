import { Constructor } from './container';
import { ParamMetadata, paramRegistry } from './paramRegistry';

interface RequestContext {
    body?: any;
    query?: Record<string, string>;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}

export function resolveHandlerArguments(
    controllerClass: Constructor,
    methodName: string,
    req: RequestContext
): any[] {
    const methodParams = paramRegistry.get(controllerClass)?.get(methodName.toString());
    if (!methodParams || methodParams.length === 0) {
        return [];
    }

    const args: any[] = [];

    for (const meta of methodParams) {
        let value: any = undefined;

        switch (meta.source) {
            case 'param':
                value = meta.key ? req.params?.[meta.key] : req.params;
                break;
            case 'query':
                value = meta.key ? req.query?.[meta.key] : req.query;
                break;
            case 'body':
                value = meta.key ? req.body?.[meta.key] : req.body;
                break;
            case 'header':
                value = meta.key ? req.headers?.[meta.key.toLowerCase()] : req.headers;
                break;
            default:
                throw new Error(`Unsupported param source: ${meta.source}`);
        }

        args[meta.index] = value;
    }

    return args;
}