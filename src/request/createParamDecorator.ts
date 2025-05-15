import { Constructor } from "../container";
import { ParamMetadata, paramRegistry } from "./paramRegistry";


function registerParam(target: Object, propertyKey: string | symbol | undefined, meta: ParamMetadata) {
    const controller = target.constructor;

    const methodName = propertyKey?.toString() || "";
    if (!paramRegistry.has(controller as Constructor<any>)) {
        paramRegistry.set(controller as Constructor<any>, new Map<string, ParamMetadata[]>());
    }
    const methodParams = paramRegistry.get(controller as Constructor<any>)!;
    if (!methodParams.has(methodName)) {
        methodParams.set(methodName, []);
    }
    const existingParams = methodParams.get(methodName)!;
    //make sure it is index safe
    existingParams[meta.index] = meta;
    // log out the param metadata for debugging
    if (process.env.NODE_ENV === "development") {
        console.log(`[ParamRegistry] ${controller.name}.${methodName}(${meta.index}) ← ${meta.source}${meta.key ? `('${meta.key}')` : ''}`);
    }
}


function createMethodDecorator(key: ParamMetadata['source']): (paramKey: string) => ParameterDecorator {
    return function (paramKey?: string) {
        return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
            //body does not require a key, but others do
            if (['param', 'query', 'header'].includes(key) && !paramKey) {
                throw new Error(`@${key}() requires a key (e.g. @${key}('id'))`);
            }
            const paramMetadata: ParamMetadata = {
                index: parameterIndex,
                source: key as ParamMetadata["source"],
                key: paramKey,
            };
            registerParam(target, propertyKey, paramMetadata);
        };
    };

}

const Body = createMethodDecorator("body");
const Query = createMethodDecorator("query");
const Param = createMethodDecorator("param");
const Header = createMethodDecorator("header");

export { Body, Query, Param, Header };