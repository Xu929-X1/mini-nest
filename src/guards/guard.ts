import { Constructor } from "../core/container/container";
import { ExecutionContext } from "../core/pipeline/ExecutionContext";
type ClassOrPrototype = Constructor | Record<string, any>;

export const GUARD_KEY = "mini-nest:guards"
export interface Guard {
    canActivate(ctx: ExecutionContext): boolean | Promise<boolean>
}

export function Guard(guards: Array<Guard>) {
    return function (
        target: ClassOrPrototype,
        propertyKey: string,
    ) {
        if (propertyKey) {
            //method decorator
            Reflect.defineMetadata(GUARD_KEY, guards, target.constructor, propertyKey);
        } else {
            //class decorator
            Reflect.defineMetadata(GUARD_KEY, guards, target);
        }
    }

}