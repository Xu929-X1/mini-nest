import { Constructor } from "../container";

type ParamSource = 'body' | 'query' | 'param' | 'header';
type ValidatorRule = {
    type: "min",
    value: number;
} | {
    type: "max",
    value: number;
} | {
    type: "required"
} | {
    type: "minLength",
    value: string
} | {
    type: "maxLength",
    value: string
} | {
    type: "pattern",
    value: RegExp
} | {
    type: "custom",
    value: Validator
}

type TypeInfo = {
    name: string;
    raw: any; // Original Contructor
    isPrimitive: boolean;
    isArray?: boolean;
    default?: any;
}

type Validator = (value: any) => boolean | Promise<boolean>;
type ValidatorOptions = {
    required?: boolean;
}

export type ParamMetadata = {
    index: number;
    source: ParamSource;
    key?: string;
    type?: TypeInfo;
    validator?: Validator;
    
};
type ParamRegistry = Map<Constructor, Map<string, ParamMetadata[]>>;

export const paramRegistry: ParamRegistry = new Map();