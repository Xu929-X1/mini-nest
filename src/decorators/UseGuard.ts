import { Constructor } from "../core/container/container";
import { Guard } from "../guards/Guard";
import { GUARDS } from "../routing/metadataKeys";
type ClassOrPrototype = Constructor | Record<string, any>;

export function UseGuard(guards: Array<Constructor<Guard>>) {
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