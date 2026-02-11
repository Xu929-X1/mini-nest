import { Constructor } from "../core/container/container";
import { ParamMetadata } from "../routing/paramTypes";
import "reflect-metadata";
import { RuleBuilder, Validator } from "../validation/rule";
import { Log } from "../utils/log";
export const PARAM_KEY = "mini-nest:param"
type ParamOptions = {
    key?: string,
    validator?: RuleBuilder | Validator
}

function createMethodDecorator(source: ParamMetadata['source']): (paramKeyOrOption: string | ParamOptions) => ParameterDecorator {
    return function (paramKeyOrOption?: string | ParamOptions) {
        return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
            //body does not require a key, but others do
            let key: string | undefined;
            let validator: RuleBuilder | Validator | undefined;
            if (typeof paramKeyOrOption === 'string') {
                key = paramKeyOrOption;
            } else if (typeof paramKeyOrOption === 'object' && paramKeyOrOption !== null) {
                key = paramKeyOrOption.key;
                validator = paramKeyOrOption.validator;
            }

            if (['param', 'query', 'header'].includes(source) && !key) {
                throw new Error(`@${source}() requires a key (e.g. @${source}('id'))`);
            }

            const paramMetadata: ParamMetadata = {
                index: parameterIndex,
                source: source as ParamMetadata["source"],
                key: key,
                validator: validator,
            };
            registerParam(target, propertyKey, paramMetadata);
        };
    };

}

function registerParam(target: Object, propertyKey: string | symbol | undefined, meta: ParamMetadata) {
    const controller = target.constructor;
    const methodName = propertyKey?.toString() || "";
    //collect type info, use this later in apply default casting
    const type = Reflect.getMetadata("design:paramtypes", target, propertyKey!) as any[];
    if (type && type[meta.index]) {
        meta.type = {
            name: type[meta.index]?.name,
            raw: type[meta.index],
            isPrimitive: [String, Number, Boolean].includes(type[meta.index]),
            isArray: type[meta.index] === Array,
        };
    }
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
        Log.info(`[ParamRegistry] ${controller.name}.${methodName}(${meta.index}) ← ${meta.source}${meta.key ? `('${meta.key}')` : ''}`);
    }
}

const Body = createMethodDecorator("body");
const Query = createMethodDecorator("query");
const Param = createMethodDecorator("param");
const Header = createMethodDecorator("header");

export { Body, Query, Param, Header };