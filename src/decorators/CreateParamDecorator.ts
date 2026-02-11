import { Constructor } from "../core/container/container";
import { ParamMetadata } from "../routing/paramTypes";
import "reflect-metadata";
import { RuleBuilder, Validator } from "../validation/rule";
import { Log } from "../utils/log";
import { PARAMS } from "../routing/metadataKeys";
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
            const methodName = propertyKey?.toString() || "";

            const types = Reflect.getMetadata("design:paramtypes", target, propertyKey!) as any[];
            const paramMetadata: ParamMetadata = {
                index: parameterIndex,
                source,
                key,
                validator,
            };

            if (types && types[parameterIndex]) {
                paramMetadata.type = {
                    name: types[parameterIndex]?.name,
                    raw: types[parameterIndex],
                    isPrimitive: [String, Number, Boolean].includes(types[parameterIndex]),
                    isArray: types[parameterIndex] === Array,
                };
            }

            const existing = PARAMS.getOrDefault(target, [], methodName);
            existing[parameterIndex] = paramMetadata;
            PARAMS.set(target, existing, methodName);

            if (process.env.NODE_ENV === "development") {
                Log.info(`[ParamRegistry] ${target.constructor.name}.${methodName}(${parameterIndex}) ← ${source}${key ? `('${key}')` : ''}`);
            }
        };
    };

}

const Body = createMethodDecorator("body");
const Query = createMethodDecorator("query");
const Param = createMethodDecorator("param");
const Header = createMethodDecorator("header");

export { Body, Query, Param, Header };