import { ExecutionContext } from "../context/ExecutionContext";
import { Log } from "../log/log";
import { HttpResponse } from "../request/http/httpResponse";
import { DefaultExceptionFilter } from "./defaultExceptionFilter";
import { ExceptionFilter } from "./exceptionFilter";

interface FilterRegistration {
    filter: ExceptionFilter;
    order: number;
}

//TODO: Improve Exception Handler to support async filters and filter chaining
export class ExceptionHandler {
    private filters: FilterRegistration[] = [];
    private defaultFilter = new DefaultExceptionFilter();

    registerFilter(filter: ExceptionFilter, order: number) {
        this.filters.push({ filter, order });
        this.filters.sort((a, b) => a.order - b.order);
    }

    async handleException(exception: unknown, context: ExecutionContext): Promise<HttpResponse> {
        const response = new HttpResponse();
        for (const { filter } of this.filters) {
            if (filter.canHandle && !filter.canHandle(exception)) {
                continue;
            }
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