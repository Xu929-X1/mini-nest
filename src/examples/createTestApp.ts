import { container } from '../container';
import { simulateRequest } from '../simulateRequest';
import { HttpMethod } from '../createMethodDecorator';
import { Constructor } from '../container';

export async function createTestApp<T>(
    controller: Constructor<T>,
    route: string,
    method: HttpMethod,
    options?: {
        body?: any;
        headers?: Record<string, string>;
        services?: Constructor[]; // optional explicit service registration
    }
): Promise<any> {
    // auto register controller & its dependencies
    if (!container.resolve(controller)) {
        container.register(controller, undefined);
    }

    // optional manual service registration
    options?.services?.forEach(serviceClass => {
        if (!container.resolve(serviceClass)) {
            container.register(serviceClass, new serviceClass());
        }
    });

    // simulate request
    return await simulateRequest(route, method, {
        body: options?.body,
        headers: options?.headers,
    });
}