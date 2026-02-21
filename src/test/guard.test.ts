import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from '../core/container/container';
import { ExecutionContext } from '../core/pipeline/ExecutionContext';
import { Injectable } from '../decorators';
import { ForbiddenException } from '../exceptions';
import { applyGuards } from '../guards/applyGuard';
import { Guard } from '../guards/Guard';
import { HttpRequest } from '../http/HttpRequest';
import { HttpResponse } from '../http/HttpResponse';

// ============================================
// Test fixtures
// ============================================

@Injectable()
class AllowAllGuard implements Guard {
    canActivate(_ctx: ExecutionContext): boolean {
        return true;
    }
}

@Injectable()
class DenyAllGuard implements Guard {
    canActivate(_ctx: ExecutionContext): boolean {
        return false;
    }
}

@Injectable()
class AsyncAllowGuard implements Guard {
    async canActivate(_ctx: ExecutionContext): Promise<boolean> {
        await delay(10);
        return true;
    }
}

@Injectable()
class AsyncDenyGuard implements Guard {
    async canActivate(_ctx: ExecutionContext): Promise<boolean> {
        await delay(10);
        return false;
    }
}

let headerCheckValue: string | undefined;

@Injectable()
class AuthGuard implements Guard {
    canActivate(ctx: ExecutionContext): boolean {
        const request = ctx.getRequest();
        const token = request.header('authorization');
        headerCheckValue = token;
        return token === 'Bearer valid-token';
    }
}

let guardCallOrder: string[] = [];

@Injectable()
class FirstGuard implements Guard {
    canActivate(_ctx: ExecutionContext): boolean {
        guardCallOrder.push('first');
        return true;
    }
}

@Injectable()
class SecondGuard implements Guard {
    canActivate(_ctx: ExecutionContext): boolean {
        guardCallOrder.push('second');
        return true;
    }
}

@Injectable()
class ThirdGuard implements Guard {
    canActivate(_ctx: ExecutionContext): boolean {
        guardCallOrder.push('third');
        return false; // 拒绝
    }
}

@Injectable()
class FourthGuard implements Guard {
    canActivate(_ctx: ExecutionContext): boolean {
        guardCallOrder.push('fourth'); // 不应该被调用
        return true;
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

function createMockContext(headers: Record<string, string> = {}): ExecutionContext {
    const request = new HttpRequest({
        method: 'GET',
        url: '/test',
        headers,
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

describe('Guards', () => {
    beforeEach(() => {
        resetContainer();
        guardCallOrder = [];
        headerCheckValue = undefined;
    });

    describe('applyGuards', () => {
        it('should allow request when guard returns true', async () => {
            const ctx = createMockContext();

            await expect(
                applyGuards([AllowAllGuard], ctx)
            ).resolves.toBeUndefined();
        });

        it('should throw ForbiddenException when guard returns false', async () => {
            const ctx = createMockContext();

            await expect(
                applyGuards([DenyAllGuard], ctx)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should handle async guards that allow', async () => {
            const ctx = createMockContext();

            await expect(
                applyGuards([AsyncAllowGuard], ctx)
            ).resolves.toBeUndefined();
        });

        it('should handle async guards that deny', async () => {
            const ctx = createMockContext();

            await expect(
                applyGuards([AsyncDenyGuard], ctx)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should pass when no guards provided', async () => {
            const ctx = createMockContext();

            await expect(
                applyGuards([], ctx)
            ).resolves.toBeUndefined();
        });
    });

    describe('guard execution order', () => {
        it('should execute guards in order', async () => {
            const ctx = createMockContext();

            await applyGuards([FirstGuard, SecondGuard], ctx);

            expect(guardCallOrder).toEqual(['first', 'second']);
        });

        it('should stop at first failing guard', async () => {
            const ctx = createMockContext();

            await expect(
                applyGuards([FirstGuard, SecondGuard, ThirdGuard, FourthGuard], ctx)
            ).rejects.toThrow(ForbiddenException);

            expect(guardCallOrder).toEqual(['first', 'second', 'third']);
            expect(guardCallOrder).not.toContain('fourth');
        });
    });

    describe('guard context access', () => {
        it('should have access to request headers', async () => {
            const ctx = createMockContext({
                'Authorization': 'Bearer valid-token',
            });

            await applyGuards([AuthGuard], ctx);

            expect(headerCheckValue).toBe('Bearer valid-token');
        });

        it('should deny when auth header is missing', async () => {
            const ctx = createMockContext();

            await expect(
                applyGuards([AuthGuard], ctx)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should deny when auth header is invalid', async () => {
            const ctx = createMockContext({
                'Authorization': 'Bearer invalid-token',
            });

            await expect(
                applyGuards([AuthGuard], ctx)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('multiple guards combination', () => {
        it('should pass when all guards allow', async () => {
            const ctx = createMockContext({
                'Authorization': 'Bearer valid-token',
            });

            await expect(
                applyGuards([AllowAllGuard, AuthGuard, AsyncAllowGuard], ctx)
            ).resolves.toBeUndefined();
        });

        it('should fail when any guard denies', async () => {
            const ctx = createMockContext({
                'Authorization': 'Bearer valid-token',
            });

            await expect(
                applyGuards([AllowAllGuard, DenyAllGuard, AuthGuard], ctx)
            ).rejects.toThrow(ForbiddenException);
        });
    });
});