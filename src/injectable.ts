import { container } from "./container";
import "reflect-metadata";
import { Log } from "./log/log";
export function Injectable() {
    return function (target: any) {
        const dependencies = Reflect.getMetadata('design:paramtypes', target);
        Log.info(`Dependencies for ${target.name}: ${dependencies}`, 'Injectable');
        container.register(target, dependencies || []);
    };
}