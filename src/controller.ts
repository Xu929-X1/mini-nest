import 'reflect-metadata';
import { metadata } from './request/metadata';
import { Constructor } from './container';

export function Controller(baseUrl: string) {
    return function (target: Function) {
        metadata.finalizeRouteOnControllerLoad(target as Constructor, baseUrl);
    };
}