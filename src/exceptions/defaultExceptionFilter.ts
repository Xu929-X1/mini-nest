import { ExecutionContext } from "../request/core/ExecutionContext";
import { Log } from "../log/log";
import { HttpResponse } from "../request/http/httpResponse";
import { BaseHTTPException } from "./baseHTTPException";
import { ExceptionFilter } from "./exceptionFilter";

export class DefaultExceptionFilter implements ExceptionFilter<any> {
    catch(exception: unknown, context: ExecutionContext): void {
        const response = context.getResponse();
        if (exception instanceof BaseHTTPException) {
            this.handleHttpException(exception, response, context);
        } else if (exception instanceof Error) {
            this.handleError(exception, response, context);
        } else {
            this.handleUnknown(exception, response, context);
        }

    }

    //by design this filter can handle any exception
    canHandle(_: unknown): boolean {
        return true;
    }


    private handleHttpException(exception: BaseHTTPException, response: HttpResponse, context: ExecutionContext) {
        const exceptionResponse = exception.getResponse();
        const request = context.getRequest();
        const errorResponse = {
            ...exceptionResponse,
            timestamp: new Date().toISOString(),
            path: request.path,
        }
        response.status(exceptionResponse.statusCode).json(errorResponse);

        if (exception.statusCode >= 500) {
            Log.error(
                `[HTTP Exception:] ${exceptionResponse.statusCode} ${exceptionResponse.message} on ${request.method} ${request.path}`,
                exception.stack
            );
        } else {
            Log.warn(
                `[HTTP Exception:] ${exceptionResponse.statusCode} ${exceptionResponse.message} on ${request.method} ${request.path}`
            );
        }

    }

    private handleError(error: Error, response: HttpResponse, context: ExecutionContext) {
        const request = context.getRequest();
        const errorResponse = {
            statusCode: 500,
            message: 'Internal Server Error',
            error: 'InternalServerError',
            timestamp: new Date().toISOString(),
            path: request.path,
        };
        response.status(500).json(errorResponse);
        Log.error(
            `[Unhandled Exception:] 500 ${error.message} on ${request.method} ${request.path}`,
            error.stack
        );
    }

    private handleUnknown(cause: unknown, response: HttpResponse, context: ExecutionContext) {
        const request = context.getRequest();
        const errorResponse = {
            statusCode: 500,
            message: 'Internal Server Error',
            error: 'InternalServerError',
            timestamp: new Date().toISOString(),
            path: request.path,
        };
        response.status(500).json(errorResponse);
        Log.error(
            `[Unhandled Critical Exception:] Unknown error on ${request.method} ${request.path}, it is more likely the framework's fault than yours.` ,
            JSON.stringify(cause)
        );
    }
}