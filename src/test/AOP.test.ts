import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheManager } from '../cache/cacheManager';
import { circuitBreakerManager } from '../circuitBreaker/circuitBreakerManager';
import { CircuitOpenError } from '../circuitBreaker/circuitOpenError';
import { Container } from '../core/container/container';
import { Injectable, Timeout, Retry, CircuitBreaker, Cache } from '../decorators';


// ============================================
// Test fixtures
// ============================================

let cacheCallCount = 0;

@Injectable()
class CacheTestService {
    @Cache({ ttl: 60 })
    getData() {
        cacheCallCount++;
        return 'cached-data';
    }

    @Cache({ ttl: 1, key: 'custom-key' })
    getWithCustomKey() {
        cacheCallCount++;
        return 'custom-cached';
    }

    @Cache({ ttl: 60 })
    getWithArgs(id: string) {
        cacheCallCount++;
        return `data-${id}`;
    }
}

let timeoutCallCount = 0;

@Injectable()
class TimeoutTestService {
    @Timeout(100)
    async fastOperation() {
        timeoutCallCount++;
        await delay(10);
        return 'fast';
    }

    @Timeout(50)
    async slowOperation() {
        timeoutCallCount++;
        await delay(200);
        return 'slow';
    }
}

let retryAttempts = 0;

@Injectable()
class RetryTestService {
    @Retry(3)
    async eventuallySucceeds() {
        retryAttempts++;
        if (retryAttempts < 3) {
            throw new Error('Not yet');
        }
        return 'success';
    }

    @Retry(2)
    async alwaysFails() {
        retryAttempts++;
        throw new Error('Always fails');
    }

    @Retry(3)
    async succeedsFirstTry() {
        retryAttempts++;
        return 'immediate';
    }
}

let circuitCallCount = 0;
let shouldFail = false;

@Injectable()
class CircuitBreakerTestService {
    @CircuitBreaker({ failureThreshold: 3, resetTimeout: 100 })
    async riskyOperation() {
        circuitCallCount++;
        if (shouldFail) {
            throw new Error('Service unavailable');
        }
        return 'success';
    }
}

// Combined decorators
let combinedCallCount = 0;

@Injectable()
class CombinedService {
    @Cache({ ttl: 60 })
    @Retry(2)
    @Timeout(500)
    async combinedOperation() {
        combinedCallCount++;
        return 'combined';
    }
}

// ============================================
// Helpers
// ============================================

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resetContainer() {
    // @ts-ignore
    Container._containerInstance = undefined;
}

// ============================================
// Tests
// ============================================

describe('AOP System', () => {
    beforeEach(() => {
        resetContainer();
        cacheManager.clear();
        circuitBreakerManager.clear();
        cacheCallCount = 0;
        timeoutCallCount = 0;
        retryAttempts = 0;
        circuitCallCount = 0;
        combinedCallCount = 0;
        shouldFail = false;
    });

    describe('@Cache', () => {
        it('should cache method results', async () => {
            const container = Container.instance;
            const service = container.resolve(CacheTestService);

            const result1 = await service.getData();
            const result2 = await service.getData();
            const result3 = await service.getData();

            expect(result1).toBe('cached-data');
            expect(result2).toBe('cached-data');
            expect(result3).toBe('cached-data');
            expect(cacheCallCount).toBe(1); // 只执行一次
        });

        it('should use custom cache key', async () => {
            const container = Container.instance;
            const service = container.resolve(CacheTestService);

            await service.getWithCustomKey();
            await service.getWithCustomKey();

            expect(cacheCallCount).toBe(1);
            expect(cacheManager.has('custom-key')).toBe(true);
        });

        it('should cache separately for different arguments', async () => {
            const container = Container.instance;
            const service = container.resolve(CacheTestService);

            const result1 = await service.getWithArgs('a');
            const result2 = await service.getWithArgs('b');
            const result3 = await service.getWithArgs('a'); // cache hit

            expect(result1).toBe('data-a');
            expect(result2).toBe('data-b');
            expect(result3).toBe('data-a');
            expect(cacheCallCount).toBe(2); // 'a' 和 'b' 各一次
        });

        it('should expire cache after TTL', async () => {
            const container = Container.instance;
            const service = container.resolve(CacheTestService);

            await service.getWithCustomKey(); // ttl = 1 second
            expect(cacheCallCount).toBe(1);

            await delay(1100); // wait for expiration

            await service.getWithCustomKey();
            expect(cacheCallCount).toBe(2); // 重新执行
        });
    });

    describe('@Timeout', () => {
        it('should complete fast operations normally', async () => {
            const container = Container.instance;
            const service = container.resolve(TimeoutTestService);

            const result = await service.fastOperation();

            expect(result).toBe('fast');
            expect(timeoutCallCount).toBe(1);
        });

        it('should throw error on timeout', async () => {
            const container = Container.instance;
            const service = container.resolve(TimeoutTestService);

            await expect(service.slowOperation()).rejects.toThrow(/timeout/i);
        });
    });

    describe('@Retry', () => {
        it('should retry until success', async () => {
            const container = Container.instance;
            const service = container.resolve(RetryTestService);

            const result = await service.eventuallySucceeds();

            expect(result).toBe('success');
            expect(retryAttempts).toBe(3); // 第3次成功
        });

        it('should throw after max retries exceeded', async () => {
            const container = Container.instance;
            const service = container.resolve(RetryTestService);

            await expect(service.alwaysFails()).rejects.toThrow('Always fails');
            expect(retryAttempts).toBe(3); // 1 + 2 retries
        });

        it('should not retry if first attempt succeeds', async () => {
            const container = Container.instance;
            const service = container.resolve(RetryTestService);

            const result = await service.succeedsFirstTry();

            expect(result).toBe('immediate');
            expect(retryAttempts).toBe(1);
        });
    });

    describe('@CircuitBreaker', () => {
        it('should allow requests when circuit is closed', async () => {
            const container = Container.instance;
            const service = container.resolve(CircuitBreakerTestService);

            const result = await service.riskyOperation();

            expect(result).toBe('success');
            expect(circuitCallCount).toBe(1);
        });

        it('should open circuit after threshold failures', async () => {
            const container = Container.instance;
            const service = container.resolve(CircuitBreakerTestService);
            shouldFail = true;

            // 触发 3 次失败
            for (let i = 0; i < 3; i++) {
                try {
                    await service.riskyOperation();
                } catch (e) {
                    // expected
                }
            }

            // 第 4 次应该直接被拒绝
            await expect(service.riskyOperation()).rejects.toThrow(CircuitOpenError);
            expect(circuitCallCount).toBe(3); // 第4次没有真正执行
        });

        it('should transition to half-open after reset timeout', async () => {
            const container = Container.instance;
            const service = container.resolve(CircuitBreakerTestService);
            shouldFail = true;

            // 触发熔断
            for (let i = 0; i < 3; i++) {
                try {
                    await service.riskyOperation();
                } catch (e) {}
            }

            // 等待 resetTimeout
            await delay(150);

            // 恢复正常
            shouldFail = false;
            const result = await service.riskyOperation();

            expect(result).toBe('success');
        });

        it('should re-open circuit if half-open request fails', async () => {
            const container = Container.instance;
            const service = container.resolve(CircuitBreakerTestService);
            shouldFail = true;

            // 触发熔断
            for (let i = 0; i < 3; i++) {
                try {
                    await service.riskyOperation();
                } catch (e) {}
            }

            // 等待进入 half-open
            await delay(150);

            // half-open 状态下失败
            try {
                await service.riskyOperation();
            } catch (e) {}

            // 应该重新 open
            await expect(service.riskyOperation()).rejects.toThrow(CircuitOpenError);
        });
    });

    describe('Combined decorators', () => {
        it('should apply multiple AOP aspects', async () => {
            const container = Container.instance;
            const service = container.resolve(CombinedService);

            const result1 = await service.combinedOperation();
            const result2 = await service.combinedOperation();

            expect(result1).toBe('combined');
            expect(result2).toBe('combined');
            expect(combinedCallCount).toBe(1); // cached
        });
    });
});

describe('CacheManager', () => {
    beforeEach(() => {
        cacheManager.clear();
    });

    it('should set and get values', () => {
        cacheManager.set('key1', 'value1', 60);
        expect(cacheManager.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
        expect(cacheManager.get('nonexistent')).toBeUndefined();
    });

    it('should delete values', () => {
        cacheManager.set('key1', 'value1', 60);
        cacheManager.delete('key1');
        expect(cacheManager.get('key1')).toBeUndefined();
    });

    it('should check existence with has()', () => {
        cacheManager.set('key1', 'value1', 60);
        expect(cacheManager.has('key1')).toBe(true);
        expect(cacheManager.has('key2')).toBe(false);
    });

    it('should expire entries after TTL', async () => {
        cacheManager.set('key1', 'value1', 1); // 1 second TTL
        expect(cacheManager.has('key1')).toBe(true);

        await delay(1100);

        expect(cacheManager.has('key1')).toBe(false);
        expect(cacheManager.get('key1')).toBeUndefined();
    });

    it('should clear all entries', () => {
        cacheManager.set('key1', 'value1', 60);
        cacheManager.set('key2', 'value2', 60);
        cacheManager.clear();

        expect(cacheManager.has('key1')).toBe(false);
        expect(cacheManager.has('key2')).toBe(false);
    });
});

describe('CircuitBreakerManager', () => {
    beforeEach(() => {
        circuitBreakerManager.clear();
    });

    it('should start in CLOSED state', () => {
        const state = circuitBreakerManager.getState('test-key');
        expect(state.circuitState).toBe('CLOSED');
        expect(state.failures).toBe(0);
    });

    it('should allow execution when CLOSED', () => {
        const result = circuitBreakerManager.canExecute('test-key', 1000);
        expect(result.allowed).toBe(true);
    });

    it('should record failures', () => {
        circuitBreakerManager.recordFailure('test-key', 5);
        const state = circuitBreakerManager.getState('test-key');
        expect(state.failures).toBe(1);
    });

    it('should open circuit when threshold reached', () => {
        for (let i = 0; i < 3; i++) {
            circuitBreakerManager.recordFailure('test-key', 3);
        }

        const state = circuitBreakerManager.getState('test-key');
        expect(state.circuitState).toBe('OPEN');
    });

    it('should block execution when OPEN', () => {
        for (let i = 0; i < 3; i++) {
            circuitBreakerManager.recordFailure('test-key', 3);
        }

        const result = circuitBreakerManager.canExecute('test-key', 10000);
        expect(result.allowed).toBe(false);
        expect(result.reason).toMatch(/Circuit open/);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
        for (let i = 0; i < 3; i++) {
            circuitBreakerManager.recordFailure('test-key', 3);
        }

        await delay(150);

        const result = circuitBreakerManager.canExecute('test-key', 100);
        expect(result.allowed).toBe(true);

        const state = circuitBreakerManager.getState('test-key');
        expect(state.circuitState).toBe('HALF_OPEN');
    });

    it('should reset on success', () => {
        circuitBreakerManager.recordFailure('test-key', 5);
        circuitBreakerManager.recordFailure('test-key', 5);
        circuitBreakerManager.recordSuccess('test-key');

        const state = circuitBreakerManager.getState('test-key');
        expect(state.circuitState).toBe('CLOSED');
        expect(state.failures).toBe(0);
    });
});