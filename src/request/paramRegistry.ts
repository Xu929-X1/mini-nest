import { Constructor } from "../container";
import { RuleBuilder, Validator } from "./validation/rule";

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
type ParamRegistry = Map<Constructor, Map<string, ParamMetadata[]>>;

export const paramRegistry: ParamRegistry = new Map();