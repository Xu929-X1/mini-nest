import { RuleBuilder, Validator } from "../validation/rule";
//TODO: Change this to reflect metadata
type ParamSource = 'body' | 'query' | 'param' | 'header';

export type TypeInfo = {
    name: string;
    raw: any; // Original Contructor
    isPrimitive: boolean;
    isArray?: boolean;
    default?: any;
}

export type ParamMetadata = {
    index: number;
    source: ParamSource;
    key?: string;
    type?: TypeInfo;
    validator?: RuleBuilder | Validator;

};
