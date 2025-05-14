import 'reflect-metadata';
import { metadata } from './metadata';
import { Constructor } from './container';

export function Controller(baseUrl: string) {
    return function (target: Function) {
        metadata.finalizeRouteOnControllerLoad(target as Constructor, baseUrl);
    };
}