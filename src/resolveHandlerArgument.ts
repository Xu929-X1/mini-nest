import { Constructor } from "./container";
import { ParamMetadata, paramRegistry } from "./paramRegistry";
interface RequestContext {
    body?: any;
    query?: Record<string, string>;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}
const sourceToContextField: Record<ParamMetadata["source"], keyof RequestContext> = {
    param: 'params',
    query: 'query',
    header: 'headers',
    body: 'body',
};
function getValFromReq(source: ParamMetadata["source"], key: string | undefined, req: RequestContext) {
    const field = sourceToContextField[source];
    const sourceData = req[field];
    if (!sourceData) {
        return undefined;
    }
    return key ? sourceData[key] : sourceData;
}

export function resolveHandlerArgument(controllerClass: Constructor, methodName: string, req: RequestContext) {
    console.log(paramRegistry.get(controllerClass));
    const methodParams = paramRegistry.get(controllerClass)?.get(methodName.toString());
    const args: any[] = [];
    if (!methodParams) {
        return [];
    }
    for (const param of methodParams) {
        const { index, source, key } = param;
        const value = getValFromReq(source, key, req);
        args[index] = value;
    }
    if (process.env.NODE_ENV === "development") {
        console.log(`[resolveHandlerArgument] ${controllerClass.name}.${methodName}(${args.map((arg, index) => `${index}: ${arg}`).join(", ")})`);
    }
    return args;
}