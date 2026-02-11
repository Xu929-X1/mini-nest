import { Constructor } from "../core/container/container";
import { ExecutionContext } from "../core/pipeline/ExecutionContext";
import { GUARDS } from "../routing/metadataKeys";
type ClassOrPrototype = Constructor | Record<string, any>;

export interface Guard {
    canActivate(ctx: ExecutionContext): boolean | Promise<boolean>
}

export function Guard(guards: Array<Constructor<Guard>>) {
    return function (
        target: ClassOrPrototype,
        propertyKey: string,
    ) {
        if (propertyKey) {
            //method decorator
            for (let guard of guards) {
                GUARDS.append(target, guard, propertyKey);
            }
        } else {
            for (let guard of guards) {
                GUARDS.append(target, guard);
            }
        }
    }

}