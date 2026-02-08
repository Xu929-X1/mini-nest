import { Constructor } from "../core/container/container";
import { ExecutionContext } from "../core/pipeline/ExecutionContext";
type ClassOrPrototype = Constructor | Record<string, any>;
export const classGuards = new Map<Constructor, Guard[]>();
export const methodGuards = new Map<Constructor, Map<string, Guard[]>>();

export interface Guard {
    canActivate(ctx: ExecutionContext): boolean | Promise<boolean>
}

export function UseGuard(guards: Array<Guard>) {
    return function (
        target: ClassOrPrototype,
        propertyKey: string,
        descriptor?: PropertyDescriptor
    ) {
        if (propertyKey) {
            //method decorator
            Reflect.defineMetadata('guards', guards, target.constructor, propertyKey);
        } else {
            //class decorator
            Reflect.defineMetadata('guards', guards, target);
        }
    }

}