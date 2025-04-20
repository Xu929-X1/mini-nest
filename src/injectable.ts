import { container } from "./container";
import "reflect-metadata";
export function Injectable() {
    return function (target: any) {
        const dependencies = Reflect.getMetadata('design:paramtypes', target);
        console.log('Dependencies for', target.name, ':', dependencies);
        container.register(target, dependencies || []);
    };
}