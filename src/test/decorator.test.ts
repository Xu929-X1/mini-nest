import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../core/container/container';
import { ExecutionContext } from '../core/pipeline/ExecutionContext';
import { Injectable, Controller, Get, Post, Put, Delete, Patch, Body, Query, Param, Header, Retry, Timeout, CircuitBreaker, UseGuard, UseInterceptor } from '../decorators';
import { Guard } from '../guards/Guard';
import { Interceptor } from '../interceptors/Interceptor';
import { PARAMS, CACHE, RETRY, CIRCUITBREAKER, GUARDS, INTERCEPTORS, TIMEOUT } from '../routing/metadataKeys';
import { routeRegistryTrie } from '../routing/routeRegistry';
import { Cache } from '../decorators';
// ============================================
// Test fixtures
// ============================================

@Injectable()
class TestGuard implements Guard {
    canActivate(_ctx: ExecutionContext): boolean {
        return true;
    }
}

@Injectable()
class TestInterceptor implements Interceptor {
    intercept(next: () => Promise<unknown>): Promise<unknown> {
        return Promise.resolve(next());
    }
}

// ============================================
// Helpers
// ============================================

function resetContainer() {
    // @ts-ignore
    Container._containerInstance = undefined;
}

// ============================================
// Tests
// ============================================

describe('Decorators', () => {
    beforeEach(() => {
        resetContainer();
        routeRegistryTrie.clear();
    });

    describe('@Injectable', () => {
        it('should allow class to be resolved by container', () => {
            @Injectable()
            class TestService {
                getValue() {
                    return 42;
                }
            }

            const container = Container.instance;
            const instance = container.resolve(TestService);

            expect(instance).toBeDefined();
            expect(instance.getValue()).toBe(42);
        });

        it('should emit design:paramtypes metadata', () => {
            @Injectable()
            class Dependency { }

            @Injectable()
            class TestService {
                constructor(private dep: Dependency) { }
            }

            const types = Reflect.getMetadata('design:paramtypes', TestService);
            expect(types).toBeDefined();
            expect(types[0]).toBe(Dependency);
        });
    });

    describe('@Controller and HTTP method decorators', () => {
        it('should register routes with @Controller and @Get', () => {
            @Controller('/api/users')
            class UserController {
                @Get('/')
                getAll() { }

                @Get('/:id')
                getOne() { }
            }

            const getAllRoute = routeRegistryTrie.findRoute('GET', '/api/users');
            const getOneRoute = routeRegistryTrie.findRoute('GET', '/api/users/123');

            expect(getAllRoute).toBeDefined();
            expect(getAllRoute?.route.handlerName).toBe('getAll');

            expect(getOneRoute).toBeDefined();
            expect(getOneRoute?.route.handlerName).toBe('getOne');
        });

        it('should register POST routes', () => {
            @Controller('/api/items')
            class ItemController {
                @Post('/')
                create() { }
            }

            const route = routeRegistryTrie.findRoute('POST', '/api/items');
            expect(route).toBeDefined();
            expect(route?.route.handlerName).toBe('create');
        });

        it('should register PUT routes', () => {
            @Controller('/api/items')
            class ItemController {
                @Put('/:id')
                update() { }
            }

            const route = routeRegistryTrie.findRoute('PUT', '/api/items/1');
            expect(route).toBeDefined();
        });

        it('should register DELETE routes', () => {
            @Controller('/api/items')
            class ItemController {
                @Delete('/:id')
                remove() { }
            }

            const route = routeRegistryTrie.findRoute('DELETE', '/api/items/1');
            expect(route).toBeDefined();
        });

        it('should register PATCH routes', () => {
            @Controller('/api/items')
            class ItemController {
                @Patch('/:id')
                patch() { }
            }

            const route = routeRegistryTrie.findRoute('PATCH', '/api/items/1');
            expect(route).toBeDefined();
        });
    });

    describe('Parameter decorators', () => {
        it('should store @Body metadata', () => {
            class TestController {
                handler(@Body() body: any) { }
            }

            const params = PARAMS.get(TestController.prototype, 'handler');
            expect(params).toBeDefined();
            expect(params?.[0].source).toBe('body');
        });

        it('should store @Body with key', () => {
            class TestController {
                handler(@Body('name') name: string) { }
            }

            const params = PARAMS.get(TestController.prototype, 'handler');
            expect(params?.[0].key).toBe('name');
        });

        it('should store @Query metadata', () => {
            class TestController {
                handler(@Query('page') page: string) { }
            }

            const params = PARAMS.get(TestController.prototype, 'handler');
            expect(params?.[0].source).toBe('query');
            expect(params?.[0].key).toBe('page');
        });

        it('should store @Param metadata', () => {
            class TestController {
                handler(@Param('id') id: string) { }
            }

            const params = PARAMS.get(TestController.prototype, 'handler');
            expect(params?.[0].source).toBe('param');
            expect(params?.[0].key).toBe('id');
        });

        it('should store @Header metadata', () => {
            class TestController {
                handler(@Header('authorization') auth: string) { }
            }

            const params = PARAMS.get(TestController.prototype, 'handler');
            expect(params?.[0].source).toBe('header');
            expect(params?.[0].key).toBe('authorization');
        });

        it('should handle multiple parameters', () => {
            class TestController {
                handler(
                    @Param('id') id: string,
                    @Query('include') include: string,
                    @Body() body: any
                ) { }
            }

            const params = PARAMS.get(TestController.prototype, 'handler');
            expect(params?.[0].source).toBe('param');
            expect(params?.[1].source).toBe('query');
            expect(params?.[2].source).toBe('body');
        });

        it('should throw when @Query is used without key', () => {
            expect(() => {
                class TestController {
                    // @ts-ignore - intentionally testing runtime error
                    handler(@Query() query: string) { }
                }
            }).toThrow();
        });

        it('should throw when @Param is used without key', () => {
            expect(() => {
                class TestController {
                    // @ts-ignore
                    handler(@Param() param: string) { }
                }
            }).toThrow();
        });
    });

    describe('AOP decorators', () => {
        describe('@Cache', () => {
            it('should store cache metadata with ttl', () => {
                class TestService {
                    @Cache({ ttl: 60 })
                    getData() { }
                }

                const cacheOpts = CACHE.get(TestService.prototype, 'getData');
                expect(cacheOpts).toBeDefined();
                expect(cacheOpts?.ttl).toBe(60);
            });

            it('should store cache metadata with custom key', () => {
                class TestService {
                    @Cache({ ttl: 30, key: 'custom-key' })
                    getData() { }
                }

                const cacheOpts = CACHE.get(TestService.prototype, 'getData');
                expect(cacheOpts?.key).toBe('custom-key');
            });

            it('should accept number shorthand', () => {
                class TestService {
                    @Cache(120)
                    getData() { }
                }

                const cacheOpts = CACHE.get(TestService.prototype, 'getData');
                expect(cacheOpts?.ttl).toBe(120);
            });
        });

        describe('@Retry', () => {
            it('should store retry count', () => {
                class TestService {
                    @Retry(3)
                    riskyOperation() { }
                }

                const retryCount = RETRY.get(TestService.prototype, 'riskyOperation');
                expect(retryCount).toBe(3);
            });
        });

        describe('@Timeout', () => {
            it('should store timeout value', () => {
                class TestService {
                    @Timeout(5000)
                    slowOperation() { }
                }

                const timeout = TIMEOUT.get(TestService.prototype, 'slowOperation');
                expect(timeout).toBe(5000);
            });
        });

        describe('@CircuitBreaker', () => {
            it('should store circuit breaker options', () => {
                class TestService {
                    @CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 })
                    externalCall() { }
                }

                const opts = CIRCUITBREAKER.get(TestService.prototype, 'externalCall');
                expect(opts?.failureThreshold).toBe(5);
                expect(opts?.resetTimeout).toBe(30000);
            });

            it('should accept empty options', () => {
                class TestService {
                    @CircuitBreaker()
                    externalCall() { }
                }

                const opts = CIRCUITBREAKER.get(TestService.prototype, 'externalCall');
                expect(opts).toBeDefined();
            });
        });
    });

    describe('@UseGuard', () => {
        it('should store guard on method', () => {
            class TestController {
                @UseGuard([TestGuard])
                protectedRoute() { }
            }

            const guards = GUARDS.get(TestController.prototype, 'protectedRoute');
            expect(guards).toContain(TestGuard);
        });

        it('should store multiple guards', () => {
            @Injectable()
            class AnotherGuard implements Guard {
                canActivate() { return true; }
            }

            class TestController {
                @UseGuard([TestGuard, AnotherGuard])
                protectedRoute() { }
            }

            const guards = GUARDS.get(TestController.prototype, 'protectedRoute');
            expect(guards).toHaveLength(2);
        });
    });

    describe('@UseInterceptor', () => {
        it('should store interceptor on method', () => {
            class TestController {
                @UseInterceptor(TestInterceptor)
                handler() { }
            }

            const interceptors = INTERCEPTORS.get(TestController.prototype, 'handler');
            expect(interceptors).toContain(TestInterceptor);
        });
    });

    describe('Combined decorators on single method', () => {
        it('should store all decorator metadata', () => {
            class TestService {
                @Cache({ ttl: 60 })
                @Retry(3)
                @Timeout(5000)
                @CircuitBreaker({ failureThreshold: 5 })
                complexOperation() { }
            }

            const proto = TestService.prototype;
            const method = 'complexOperation';

            expect(CACHE.get(proto, method)).toBeDefined();
            expect(RETRY.get(proto, method)).toBe(3);
            expect(TIMEOUT.get(proto, method)).toBe(5000);
            expect(CIRCUITBREAKER.get(proto, method)).toBeDefined();
        });
    });
});