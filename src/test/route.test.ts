import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouteMetadataType, routeRegistryTrie } from '../routing/routeRegistry';
import { HttpMethod } from '../http/HttpRequest';


// ============================================
// Helpers
// ============================================

function createRoute(
    method: HttpMethod,
    fullUrl: string,
    handlerName = 'handler'
): RouteMetadataType {
    return {
        method,
        url: fullUrl,
        fullUrl,
        handlerName,
        controllerClass: class TestController {},
    };
}

// ============================================
// Tests
// ============================================

describe('RouteRegistryTrie', () => {
    beforeEach(() => {
        routeRegistryTrie.clear();
    });

    describe('addRoute', () => {
        it('should add a simple route', () => {
            const route = createRoute('GET', '/users');
            routeRegistryTrie.addRoute('GET', route);

            const result = routeRegistryTrie.findRoute('GET', '/users');
            expect(result).toBeDefined();
            expect(result?.route.fullUrl).toBe('/users');
        });

        it('should add nested routes', () => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/api/v1/users'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/api/v1/posts'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/api/v2/users'));

            expect(routeRegistryTrie.findRoute('GET', '/api/v1/users')).toBeDefined();
            expect(routeRegistryTrie.findRoute('GET', '/api/v1/posts')).toBeDefined();
            expect(routeRegistryTrie.findRoute('GET', '/api/v2/users')).toBeDefined();
        });

        it('should add routes with different methods', () => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users', 'getUsers'));
            routeRegistryTrie.addRoute('POST', createRoute('POST', '/users', 'createUser'));
            routeRegistryTrie.addRoute('DELETE', createRoute('DELETE', '/users', 'deleteUser'));

            const getResult = routeRegistryTrie.findRoute('GET', '/users');
            const postResult = routeRegistryTrie.findRoute('POST', '/users');
            const deleteResult = routeRegistryTrie.findRoute('DELETE', '/users');

            expect(getResult?.route.handlerName).toBe('getUsers');
            expect(postResult?.route.handlerName).toBe('createUser');
            expect(deleteResult?.route.handlerName).toBe('deleteUser');
        });
    });

    describe('findRoute - static routes', () => {
        beforeEach(() => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users/profile'));
            routeRegistryTrie.addRoute('POST', createRoute('POST', '/users'));
        });

        it('should find root route', () => {
            const result = routeRegistryTrie.findRoute('GET', '/');
            expect(result).toBeDefined();
            expect(result?.route.fullUrl).toBe('/');
        });

        it('should find exact match', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users');
            expect(result).toBeDefined();
            expect(result?.route.fullUrl).toBe('/users');
        });

        it('should find nested route', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/profile');
            expect(result).toBeDefined();
            expect(result?.route.fullUrl).toBe('/users/profile');
        });

        it('should return undefined for non-existent route', () => {
            const result = routeRegistryTrie.findRoute('GET', '/nonexistent');
            expect(result).toBeUndefined();
        });

        it('should return undefined for wrong method', () => {
            const result = routeRegistryTrie.findRoute('DELETE', '/users');
            expect(result).toBeUndefined();
        });
    });

    describe('findRoute - parameterized routes', () => {
        beforeEach(() => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users/:id'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users/:id/posts'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users/:userId/posts/:postId'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/files/:path'));
        });

        it('should match single param', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/123');

            expect(result).toBeDefined();
            expect(result?.params).toEqual({ userId: '123' });
        });

        it('should match param with nested path', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/456/posts');

            expect(result).toBeDefined();
            expect(result?.params).toEqual({ userId: '456' });
        });

        it('should match multiple params', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/123/posts/789');

            expect(result).toBeDefined();
            expect(result?.params).toEqual({ userId: '123', postId: '789' });
        });

        it('should handle string params', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/alice');

            expect(result).toBeDefined();
            expect(result?.params).toEqual({ userId: 'alice' });
        });

        it('should handle special characters in params', () => {
            const result = routeRegistryTrie.findRoute('GET', '/files/path-to-file.txt');

            expect(result).toBeDefined();
            expect(result?.params).toEqual({ path: 'path-to-file.txt' });
        });
    });

    describe('findRoute - mixed static and param routes', () => {
        beforeEach(() => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users/me', 'getCurrentUser'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users/:id', 'getUserById'));
        });

        it('should prefer static route over param', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/me');

            expect(result).toBeDefined();
            expect(result?.route.handlerName).toBe('getCurrentUser');
            expect(result?.params).toEqual({});
        });

        it('should fall back to param route', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/123');

            expect(result).toBeDefined();
            expect(result?.route.handlerName).toBe('getUserById');
            expect(result?.params).toEqual({ id: '123' });
        });
    });

    describe('findRoute - path normalization', () => {
        beforeEach(() => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users'));
        });

        it('should handle trailing slash', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/');
            expect(result).toBeDefined();
        });

        it('should handle query string', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users?page=1&limit=10');
            expect(result).toBeDefined();
        });

        it('should handle query string with trailing slash', () => {
            const result = routeRegistryTrie.findRoute('GET', '/users/?page=1');
            expect(result).toBeDefined();
        });
    });

    describe('deleteRoute', () => {
        it('should delete a route', () => {
            const route = createRoute('GET', '/users');
            routeRegistryTrie.addRoute('GET', route);

            expect(routeRegistryTrie.findRoute('GET', '/users')).toBeDefined();

            routeRegistryTrie.deleteRoute('GET', route);

            expect(routeRegistryTrie.findRoute('GET', '/users')).toBeUndefined();
        });

        it('should not affect other routes', () => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/posts'));

            routeRegistryTrie.deleteRoute('GET', createRoute('GET', '/users'));

            expect(routeRegistryTrie.findRoute('GET', '/users')).toBeUndefined();
            expect(routeRegistryTrie.findRoute('GET', '/posts')).toBeDefined();
        });
    });

    describe('clear', () => {
        it('should remove all routes', () => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/users'));
            routeRegistryTrie.addRoute('POST', createRoute('POST', '/users'));
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/posts'));

            routeRegistryTrie.clear();

            expect(routeRegistryTrie.findRoute('GET', '/users')).toBeUndefined();
            expect(routeRegistryTrie.findRoute('POST', '/users')).toBeUndefined();
            expect(routeRegistryTrie.findRoute('GET', '/posts')).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('should handle empty path segments', () => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/api//users'));
            // 行为取决于实现，这里只是确保不会崩溃
        });

        it('should handle very long paths', () => {
            const longPath = '/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p';
            routeRegistryTrie.addRoute('GET', createRoute('GET', longPath));

            const result = routeRegistryTrie.findRoute('GET', longPath);
            expect(result).toBeDefined();
        });

        it('should handle unicode in paths', () => {
            routeRegistryTrie.addRoute('GET', createRoute('GET', '/用户'));

            const result = routeRegistryTrie.findRoute('GET', '/用户');
            expect(result).toBeDefined();
        });
    });
});