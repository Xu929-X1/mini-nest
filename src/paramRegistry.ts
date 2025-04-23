import { Constructor } from "./container";

type ParamSource = 'body' | 'query' | 'params' | 'headers';
type TypeInfo = {
    name: string;
    raw: any; // Original Contructor
    isPrimitive: boolean;
    isArray?: boolean;
    //could include validator, transformer, etc. in the future
}
export type ParamMetadata = {
    index: number;
    source: ParamSource;
    key?: string;
    type?: TypeInfo;
};
type ParamRegistry = Map<Constructor, Map<string, ParamMetadata[]>>;

export const paramRegistry: ParamRegistry = new Map();