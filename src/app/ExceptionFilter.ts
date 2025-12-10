interface ExceptionFilter {
    catch(exception: any, host: any): void;
}

class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: any): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception.getStatus ? exception.getStatus() : 500;
        response.status(status).json({
            statusCode: status,
            message: exception.message || 'Internal server error',
        });
    }
}

export { ExceptionFilter, HttpExceptionFilter };