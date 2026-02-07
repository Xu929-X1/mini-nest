import { Container } from "../container";
import { exceptionHandler, NotFoundException } from "../exceptions";
import { HttpRequest, RawRequest } from "../request/http/httpRequest";
import { HttpResponse } from "../request/http/httpResponse";
import { applyInterceptors } from "../request/interceptor";
import { metadata } from "../request/metadata";
import { resolveHandlerArguments } from "../request/resolveHandlerArgument";
import { routeRegistryTrie } from "../request/routeRegistry";
import { ExecutionContext } from "./ExecutionContext";

export class RequestPipeline {
    constructor(private readonly container: Container) { }
    async handle(rawRequest: RawRequest) {
        const request = new HttpRequest(rawRequest);
        const response = new HttpResponse();
        const matched = routeRegistryTrie.findRoute(request.method, request.path);
        if (!matched) {
            response.status(404).json({
                statusCode: 404,
                message: `No route found for ${request.method} ${request.path}`,
                error: 'Not Found',
            });
            return response;
        }

        const { route } = matched;
        const executionContext = new ExecutionContext(request, response, {
            controllerClass: route.controllerClass,
            handlerName: route.handlerName,
            fullPath: route.fullUrl as string,
        }, this.container);
        request.setParams(matched.params);

        const controllerInstance = this.container.resolve(route.controllerClass);
        try {
            if (typeof controllerInstance.onBeforeHandle === 'function') {
                await controllerInstance.onBeforeHandle(executionContext);
            }
            //guard

            //interceptors
            const interceptors = [
                ...metadata.getClassInterceptors(route.controllerClass) || [],
                ...metadata.getMethodInterceptors(route.controllerClass, route.handlerName) || []
            ];

            const result = await applyInterceptors(interceptors, async () => {
                const args = resolveHandlerArguments(route.controllerClass, route.handlerName, {
                    body: request.body,
                    query: request.query,
                    params: request.params,
                    headers: request.headers,
                });


                const handler = controllerInstance[route.handlerName];
                return handler.apply(controllerInstance, args);
            });

            if (typeof controllerInstance.onAfterHandle === 'function') {
                await controllerInstance.onAfterHandle(executionContext, result);
            }
            if (typeof result === 'object') {
                response.json(result);
            } else {
                response.send(result);
            }
            return response;
        } catch (error) {
            // onHandleError
            if (typeof controllerInstance.onHandleError === 'function') {
                await controllerInstance.onHandleError(executionContext, error instanceof Error ? error : new Error(String(error)));
            }

            return exceptionHandler.handleException(error, executionContext);
        }
    }
}