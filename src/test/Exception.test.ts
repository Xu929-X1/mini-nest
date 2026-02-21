import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../core/container/container';
import { ExecutionContext } from '../core/pipeline/ExecutionContext';
import { BaseHTTPException, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, InternalServerErrorException, NotImplementedException, BadGatewayException, ValidationException, ExceptionHandler, ExceptionFilter, DefaultExceptionFilter } from '../exceptions';
import { HttpRequest } from '../http/HttpRequest';
import { HttpResponse } from '../http/HttpResponse';


// ============================================
// Helpers
// ============================================

function resetContainer() {
    // @ts-ignore
    Container._containerInstance = undefined;
}

function createMockContext(): ExecutionContext {
    const request = new HttpRequest({
        method: 'GET',
        url: '/test',
    });
    const response = new HttpResponse();

    return new ExecutionContext(
        request,
        response,
        {
            controllerClass: class TestController {},
            handlerName: 'testHandler',
            fullPath: '/test',
        },
        Container.instance
    );
}

// ============================================
// Tests
// ============================================

describe('HTTP Exceptions', () => {
    describe('BaseHTTPException', () => {
        it('should create exception with message and status', () => {
            const exception = new BaseHTTPException('Test error', 400, 'BadRequest');

            expect(exception.message).toBe('Test error');
            expect(exception.statusCode).toBe(400);
            expect(exception.error).toBe('BadRequest');
        });

        it('should generate response object', () => {
            const exception = new BaseHTTPException('Test', 500, 'Error');
            const response = exception.getResponse();

            expect(response).toEqual({
                statusCode: 500,
                message: 'Test',
                error: 'Error',
            });
        });

        it('should return status code', () => {
            const exception = new BaseHTTPException('Test', 404);
            expect(exception.getStatus()).toBe(404);
        });
    });

    describe('BadRequestException', () => {
        it('should have status 400', () => {
            const exception = new BadRequestException();
            expect(exception.statusCode).toBe(400);
            expect(exception.message).toBe('Bad Request');
        });

        it('should accept custom message', () => {
            const exception = new BadRequestException('Invalid input');
            expect(exception.message).toBe('Invalid input');
        });
    });

    describe('UnauthorizedException', () => {
        it('should have status 401', () => {
            const exception = new UnauthorizedException();
            expect(exception.statusCode).toBe(401);
            expect(exception.message).toBe('Unauthorized');
        });
    });

    describe('ForbiddenException', () => {
        it('should have status 403', () => {
            const exception = new ForbiddenException();
            expect(exception.statusCode).toBe(403);
            expect(exception.message).toBe('Forbidden');
        });
    });

    describe('NotFoundException', () => {
        it('should have status 404', () => {
            const exception = new NotFoundException();
            expect(exception.statusCode).toBe(404);
            expect(exception.message).toBe('Not Found');
        });

        it('should accept custom message', () => {
            const exception = new NotFoundException('User not found');
            expect(exception.message).toBe('User not found');
        });
    });

    describe('InternalServerErrorException', () => {
        it('should have status 500', () => {
            const exception = new InternalServerErrorException();
            expect(exception.statusCode).toBe(500);
            expect(exception.message).toBe('Internal Server Error');
        });
    });

    describe('NotImplementedException', () => {
        it('should have status 501', () => {
            const exception = new NotImplementedException();
            expect(exception.statusCode).toBe(501);
        });
    });

    describe('BadGatewayException', () => {
        it('should have status 502', () => {
            const exception = new BadGatewayException();
            expect(exception.statusCode).toBe(502);
        });
    });

    describe('ValidationException', () => {
        it('should have status 422', () => {
            const exception = new ValidationException([
                { field: 'email', message: 'Invalid email' },
            ]);
            expect(exception.statusCode).toBe(422);
        });

        it('should include validation errors in response', () => {
            const errors = [
                { field: 'email', message: 'Invalid email', value: 'bad-email' },
                { field: 'password', message: 'Too short' },
            ];
            const exception = new ValidationException(errors);
            const response = exception.getResponse();

            expect(response.errors).toEqual(errors);
            expect(response.statusCode).toBe(422);
        });
    });
});

describe('ExceptionHandler', () => {
    let handler: ExceptionHandler;

    beforeEach(() => {
        resetContainer();
        handler = new ExceptionHandler();
    });

    describe('handleException', () => {
        it('should handle BaseHTTPException', async () => {
            const ctx = createMockContext();
            const exception = new NotFoundException('Resource not found');

            const response = await handler.handleException(exception, ctx);

            expect(response.statusCode).toBe(404);
            expect(response.body.message).toBe('Resource not found');
        });

        it('should handle generic Error', async () => {
            const ctx = createMockContext();
            const error = new Error('Something went wrong');

            const response = await handler.handleException(error, ctx);

            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe('Internal Server Error');
        });

        it('should handle unknown exception types', async () => {
            const ctx = createMockContext();

            const response = await handler.handleException('string error', ctx);

            expect(response.statusCode).toBe(500);
        });

        it('should include timestamp in response', async () => {
            const ctx = createMockContext();
            const exception = new BadRequestException();

            const response = await handler.handleException(exception, ctx);

            expect(response.body.timestamp).toBeDefined();
        });

        it('should include path in response', async () => {
            const ctx = createMockContext();
            const exception = new BadRequestException();

            const response = await handler.handleException(exception, ctx);

            expect(response.body.path).toBe('/test');
        });
    });

    describe('custom filters', () => {
        it('should use custom filter when registered', async () => {
            let customFilterCalled = false;

            const customFilter: ExceptionFilter<NotFoundException> = {
                canHandle: (ex) => ex instanceof NotFoundException,
                catch: (ex, ctx) => {
                    customFilterCalled = true;
                    ctx.getResponse().status(404).json({
                        custom: true,
                        message: ex.message,
                    });
                },
            };

            handler.registerFilter(customFilter, 1);

            const ctx = createMockContext();
            const response = await handler.handleException(
                new NotFoundException('Custom handling'),
                ctx
            );

            expect(customFilterCalled).toBe(true);
            expect(response.body.custom).toBe(true);
        });

        it('should fall back to default filter when custom cannot handle', async () => {
            const customFilter: ExceptionFilter = {
                canHandle: () => false,
                catch: () => {},
            };

            handler.registerFilter(customFilter, 1);

            const ctx = createMockContext();
            const response = await handler.handleException(
                new BadRequestException(),
                ctx
            );

            expect(response.statusCode).toBe(400);
        });

        it('should respect filter order', async () => {
            const callOrder: number[] = [];

            const filter1: ExceptionFilter = {
                canHandle: () => true,
                catch: (_, ctx) => {
                    callOrder.push(1);
                    ctx.getResponse().status(500).json({ filter: 1 });
                },
            };

            const filter2: ExceptionFilter = {
                canHandle: () => true,
                catch: (_, ctx) => {
                    callOrder.push(2);
                    ctx.getResponse().status(500).json({ filter: 2 });
                },
            };

            handler.registerFilter(filter2, 2);
            handler.registerFilter(filter1, 1);

            const ctx = createMockContext();
            await handler.handleException(new Error(), ctx);

            // filter1 has lower order number, should be called first
            expect(callOrder[0]).toBe(1);
        });
    });

    describe('clearCache', () => {
        it('should remove all registered filters', async () => {
            let filterCalled = false;

            handler.registerFilter({
                canHandle: () => true,
                catch: () => {
                    filterCalled = true;
                },
            }, 1);

            handler.clearCache();

            const ctx = createMockContext();
            await handler.handleException(new Error(), ctx);

            // Custom filter should not be called after clear
            expect(filterCalled).toBe(false);
        });
    });
});

describe('DefaultExceptionFilter', () => {
    let filter: DefaultExceptionFilter;

    beforeEach(() => {
        resetContainer();
        filter = new DefaultExceptionFilter();
    });

    it('should handle any exception', () => {
        expect(filter.canHandle(new Error())).toBe(true);
        expect(filter.canHandle(new BadRequestException())).toBe(true);
        expect(filter.canHandle('string')).toBe(true);
        expect(filter.canHandle(null)).toBe(true);
    });

    it('should format HTTP exceptions properly', () => {
        const ctx = createMockContext();
        const exception = new ForbiddenException('Access denied');

        filter.catch(exception, ctx);

        const response = ctx.getResponse();
        expect(response.statusCode).toBe(403);
        expect(response.body.message).toBe('Access denied');
        expect(response.body.error).toBe('Forbidden');
    });

    it('should format generic errors as 500', () => {
        const ctx = createMockContext();
        const error = new Error('Unexpected error');

        filter.catch(error, ctx);

        const response = ctx.getResponse();
        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
    });
});