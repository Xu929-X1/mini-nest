import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Injectable } from '../decorators';
import { applyInterceptors } from '../interceptors/applyInterceptor';
import { Interceptor } from '../interceptors/Interceptor';
import { Container } from '../core/container/container';


// ============================================
// Test fixtures
// ============================================

let interceptorCallOrder: string[] = [];

@Injectable()
class LoggingInterceptor implements Interceptor {
    async intercept(next: () => Promise<unknown>): Promise<unknown> {
        interceptorCallOrder.push('logging:before');
        const result = await next();
        interceptorCallOrder.push('logging:after');
        return result;
    }
}

@Injectable()
class TimingInterceptor implements Interceptor {
    async intercept(next: () => Promise<unknown>): Promise<unknown> {
        interceptorCallOrder.push('timing:before');
        const start = Date.now();
        const result = await next();
        const elapsed = Date.now() - start;
        interceptorCallOrder.push(`timing:after:${elapsed >= 0 ? 'ok' : 'error'}`);
        return result;
    }
}

@Injectable()
class TransformInterceptor implements Interceptor {
    async intercept(next: () => Promise<unknown>): Promise<unknown> {
        const result = await next();
        return { data: result, transformed: true };
    }
}

@Injectable()
class CacheInterceptor implements Interceptor {
    private cache: Map<string, unknown> = new Map();
    
    async intercept(next: () => Promise<unknown>): Promise<unknown> {
        const cacheKey = 'test-key';
        if (this.cache.has(cacheKey)) {
            interceptorCallOrder.push('cache:hit');
            return this.cache.get(cacheKey);
        }
        interceptorCallOrder.push('cache:miss');
        const result = await next();
        this.cache.set(cacheKey, result);
        return result;
    }
}

@Injectable()
class ErrorInterceptor implements Interceptor {
    async intercept(next: () => Promise<unknown>): Promise<unknown> {
        try {
            return await next();
        } catch (error) {
            interceptorCallOrder.push('error:caught');
            throw error;
        }
    }
}

@Injectable()
class ShortCircuitInterceptor implements Interceptor {
    async intercept(_next: () => Promise<unknown>): Promise<unknown> {
        interceptorCallOrder.push('shortcircuit');
        return { shortCircuited: true }; // 不调用 next()
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

describe('Interceptors', () => {
    beforeEach(() => {
        resetContainer();
        interceptorCallOrder = [];
    });

    describe('applyInterceptors', () => {
        it('should call handler when no interceptors', async () => {
            let handlerCalled = false;
            const result = await applyInterceptors([], async () => {
                handlerCalled = true;
                return 'result';
            });

            expect(handlerCalled).toBe(true);
            expect(result).toBe('result');
        });

        it('should wrap handler with single interceptor', async () => {
            const result = await applyInterceptors(
                [LoggingInterceptor],
                async () => {
                    interceptorCallOrder.push('handler');
                    return 'result';
                }
            );

            expect(interceptorCallOrder).toEqual([
                'logging:before',
                'handler',
                'logging:after',
            ]);
            expect(result).toBe('result');
        });

        it('should chain multiple interceptors in order', async () => {
            await applyInterceptors(
                [LoggingInterceptor, TimingInterceptor],
                async () => {
                    interceptorCallOrder.push('handler');
                    return 'result';
                }
            );

            expect(interceptorCallOrder).toEqual([
                'logging:before',
                'timing:before',
                'handler',
                'timing:after:ok',
                'logging:after',
            ]);
        });

        it('should transform response', async () => {
            const result = await applyInterceptors(
                [TransformInterceptor],
                async () => 'original'
            );

            expect(result).toEqual({
                data: 'original',
                transformed: true,
            });
        });

        it('should allow interceptor to short-circuit', async () => {
            let handlerCalled = false;
            const result = await applyInterceptors(
                [ShortCircuitInterceptor],
                async () => {
                    handlerCalled = true;
                    return 'should not reach';
                }
            );

            expect(handlerCalled).toBe(false);
            expect(result).toEqual({ shortCircuited: true });
        });
    });

    describe('error handling', () => {
        it('should propagate errors from handler', async () => {
            await expect(
                applyInterceptors([LoggingInterceptor], async () => {
                    throw new Error('Handler error');
                })
            ).rejects.toThrow('Handler error');
        });

        it('should allow interceptor to catch and rethrow', async () => {
            await expect(
                applyInterceptors([ErrorInterceptor], async () => {
                    throw new Error('Test error');
                })
            ).rejects.toThrow('Test error');

            expect(interceptorCallOrder).toContain('error:caught');
        });

        it('should propagate errors through interceptor chain', async () => {
            await expect(
                applyInterceptors(
                    [LoggingInterceptor, TimingInterceptor, ErrorInterceptor],
                    async () => {
                        interceptorCallOrder.push('handler');
                        throw new Error('Deep error');
                    }
                )
            ).rejects.toThrow('Deep error');

            expect(interceptorCallOrder).toContain('handler');
            expect(interceptorCallOrder).toContain('error:caught');
        });
    });

    describe('interceptor isolation', () => {
        it('should resolve interceptors as singletons', async () => {
            // 第一次调用 - cache miss
            await applyInterceptors([CacheInterceptor], async () => 'value1');
            
            // 重置调用顺序但不重置 container
            interceptorCallOrder = [];
            
            // 第二次调用 - 应该是 cache hit（因为是同一个实例）
            const result = await applyInterceptors([CacheInterceptor], async () => 'value2');

            expect(interceptorCallOrder).toContain('cache:hit');
            expect(result).toBe('value1'); // 返回缓存的值
        });
    });

    describe('sync and async handlers', () => {
        it('should handle sync handler', async () => {
            const result = await applyInterceptors(
                [LoggingInterceptor],
                () => 'sync result'
            );

            expect(result).toBe('sync result');
        });

        it('should handle async handler', async () => {
            const result = await applyInterceptors(
                [LoggingInterceptor],
                async () => {
                    await new Promise(r => setTimeout(r, 10));
                    return 'async result';
                }
            );

            expect(result).toBe('async result');
        });
    });
});