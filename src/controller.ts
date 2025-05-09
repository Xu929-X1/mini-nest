import 'reflect-metadata';

export function Controller(baseUrl: string) {
    return function (target: Function) {
        Reflect.defineMetadata('prefix', baseUrl, target);
    };
}