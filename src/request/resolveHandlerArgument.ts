import { Constructor } from '../container';
import { ParamMetadata, paramRegistry, TypeInfo } from './paramRegistry';
import { RuleBuilder, Validator, ValidatorRule } from './validation/rule';

interface RequestContext {
    body?: any;
    query?: Record<string, string>;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}

function isRuleBuilder(validator: RuleBuilder | Validator): validator is RuleBuilder {
    return (validator as RuleBuilder).build !== undefined;
}

function runValidation(value: any, rule: Validator | ValidatorRule[]): boolean {
    if (Array.isArray(rule)) {
        for (const r of rule) {
            if (r.type === 'required' && (value == null || value === '')) {
                return false;
            }
            if (r.type === 'min' && value < r.value) {
                return false;
            }
            if (r.type === 'max' && value > r.value) {
                return false;
            }
            if (r.type === 'minLength' && value.length < r.value) {
                return false;
            }
            if (r.type === 'maxLength' && value.length > r.value) {
                return false;
            }
            if (r.type === 'pattern' && !r.value.test(value)) {
                return false;
            }
            if (r.type === 'custom' && !r.value(value)) {
                return false;
            }
        }
    } else {
        if (rule(value) === false) {
            return false;
        }
    }
    return true;
}

function applyDefaultAndCast(value: any, type: TypeInfo) {
    console.log("[applyDefaultAndCast] value:", value, " type:", type);
    if (value == null || value == undefined) {
        if (type.default != null) {
            return type.default;
        }
        return undefined;
    }
    if (type.isPrimitive) {
        if (type.isArray) {
            return Array.isArray(value) ? value : [value];
        }
        if (type.raw === String) {
            return String(value);
        }
        if (type.raw === Number) {
            if(isNaN(Number(value))) {
                throw new Error(`Cannot cast value '${value}' to Number`);
            }
            return Number(value);
        }
        if (type.raw === Boolean) {
            return Boolean(value);
        }
    }
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
        const type = meta.type;
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
        // Apply default value and cast if type is provided
        if (type) {
            const castedValue = applyDefaultAndCast(value, type);
            if (castedValue !== undefined) {
                value = castedValue;
            }
        }
        // apply validation
        if (meta.validator) {
            const rule = isRuleBuilder(meta.validator) ? meta.validator.build() : meta.validator;
            if (rule) {
                const valid = runValidation(value, rule);
                if (!valid) {
                    throw new Error(`Validation failed for parameter ${meta.key}`);
                }
            }

        }

        args[meta.index] = value;
    }

    return args;
}