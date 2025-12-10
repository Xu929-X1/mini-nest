import "reflect-metadata";
import { Log } from "./log/log";
import { Container } from "./container";
export function Injectable() {
    return function (target: any) {
        const container = Container.instance;
        const dependencies = Reflect.getMetadata('design:paramtypes', target);
        Log.info(`Dependencies for ${target.name}: ${dependencies}`, 'Injectable');
        container.register(target, dependencies || []);
    };
}