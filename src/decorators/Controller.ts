import 'reflect-metadata';
import { metadata } from '../routing/metadata';
import { Constructor } from '../core/container/container';

export function Controller(baseUrl: string) {
    return function (target: Function) {
        metadata.finalizeRouteOnControllerLoad(target as Constructor, baseUrl);
    };
}