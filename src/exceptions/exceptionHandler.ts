import { ExecutionContext } from "../context/ExecutionContext";
import { Log } from "../log/log";
import { HttpResponse } from "../request/http/httpResponse";
import { DefaultExceptionFilter } from "./defaultExceptionFilter";
import { ExceptionFilter } from "./exceptionFilter";

//TODO: Improve Exception Handler to support async filters and filter chaining
export class ExceptionHandler {
    private filters: ExceptionFilter[] = [];
    private defaultFilter = new DefaultExceptionFilter();

    registerFilter(filter: ExceptionFilter) {
        this.filters.push(filter);
    }

    async handleException(exception: unknown, context: ExecutionContext): Promise<HttpResponse> {
        const response = new HttpResponse();
        for (const filter of this.filters) {
            try {
                await filter.catch(exception, context);
                return response;
            } catch (filterError) {
                Log.error(`[Exception Filter Error:] Error in exception filter ${filter.constructor.name}`);
            }
        }

        try {
            await this.defaultFilter.catch(exception, context);

        } catch (defaultExceptionFilterError) {
            Log.error(`[Default Exception Filter Error:] Error in default exception filter`);
            response.status(500).json({
                statusCode: 500,
                message: 'Critical Internal Server Error, unable to process exception',
                error: 'InternalServerError',
                timestamp: new Date().toISOString(),
            });
        }

        return response;
    }

    clearCache() {
        this.filters = [];
    }
}


export const exceptionHandler = new ExceptionHandler();