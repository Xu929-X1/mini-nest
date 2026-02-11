import { MetadataKey } from '../utils/metadataKey';
import { Constructor } from '../core/container/container';
import { Guard } from '../guards/guard';
import { Interceptor } from '../interceptor/applyInterceptor';
import { ParamMetadata } from './paramTypes';
export const INTERCEPTOR_KEY = "mini-nest:interceptor";
export const GUARD_KEY = "mini-nest:guards"
export const PARAM_KEY = "mini-nest:params"
export const PARAMS = new MetadataKey<ParamMetadata[]>(PARAM_KEY);
export const GUARDS = new MetadataKey<Constructor<Guard>[]>(GUARD_KEY);
export const INTERCEPTORS = new MetadataKey<Constructor<Interceptor>[]>(INTERCEPTOR_KEY);
