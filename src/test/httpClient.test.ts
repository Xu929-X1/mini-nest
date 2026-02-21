import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HttpClient } from '../http/client/httpClient';

// ============================================
// Mock undici
// ============================================

const mockRequest = vi.fn();

vi.mock('undici', () => ({
    request: (...args: any[]) => mockRequest(...args),
}));

// ============================================
// Helpers
// ============================================

function mockResponse(data: any, status = 200, headers = {}) {
    return {
        statusCode: status,
        headers,
        body: {
            json: vi.fn().mockResolvedValue(data),
        },
    };
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Tests
// ============================================

describe('HttpClient', () => {
    let client: HttpClient;

    beforeEach(() => {
        client = new HttpClient();
        mockRequest.mockReset();
    });

    describe('GET requests', () => {
        it('should make a GET request', async () => {
            mockRequest.mockResolvedValue(mockResponse({ id: 1, name: 'Test' }));

            const result = await client.get('https://api.example.com/users/1');

            expect(result.data).toEqual({ id: 1, name: 'Test' });
            expect(result.status).toBe(200);
            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/users/1',
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('should append query params to URL', async () => {
            mockRequest.mockResolvedValue(mockResponse([{ id: 1 }]));

            await client.get('https://api.example.com/users', {
                params: { page: 1, limit: 10 },
            });

            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/users?page=1&limit=10',
                expect.any(Object)
            );
        });

        it('should filter undefined params', async () => {
            mockRequest.mockResolvedValue(mockResponse([]));

            await client.get('https://api.example.com/users', {
                params: { page: 1, filter: undefined },
            });

            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/users?page=1',
                expect.any(Object)
            );
        });
    });

    describe('POST requests', () => {
        it('should make a POST request with body', async () => {
            mockRequest.mockResolvedValue(mockResponse({ id: 1 }, 201));

            const result = await client.post('https://api.example.com/users', {
                name: 'Alice',
                email: 'alice@example.com',
            });

            expect(result.status).toBe(201);
            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/users',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' }),
                })
            );
        });
    });

    describe('PUT requests', () => {
        it('should make a PUT request', async () => {
            mockRequest.mockResolvedValue(mockResponse({ id: 1, name: 'Updated' }));

            const result = await client.put('https://api.example.com/users/1', {
                name: 'Updated',
            });

            expect(result.data).toEqual({ id: 1, name: 'Updated' });
            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/users/1',
                expect.objectContaining({ method: 'PUT' })
            );
        });
    });

    describe('PATCH requests', () => {
        it('should make a PATCH request', async () => {
            mockRequest.mockResolvedValue(mockResponse({ id: 1, status: 'active' }));

            const result = await client.patch('https://api.example.com/users/1', {
                status: 'active',
            });

            expect(result.data).toEqual({ id: 1, status: 'active' });
            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/users/1',
                expect.objectContaining({ method: 'PATCH' })
            );
        });
    });

    describe('DELETE requests', () => {
        it('should make a DELETE request', async () => {
            mockRequest.mockResolvedValue(mockResponse({ success: true }));

            const result = await client.delete('https://api.example.com/users/1');

            expect(result.data).toEqual({ success: true });
            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/users/1',
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('Headers', () => {
        it('should send custom headers', async () => {
            mockRequest.mockResolvedValue(mockResponse({}));

            await client.get('https://api.example.com/data', {
                headers: { 'Authorization': 'Bearer token123' },
            });

            expect(mockRequest).toHaveBeenCalledWith(
                'https://api.example.com/data',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer token123',
                    }),
                })
            );
        });

        it('should include Content-Type header', async () => {
            mockRequest.mockResolvedValue(mockResponse({}));

            await client.post('https://api.example.com/data', { foo: 'bar' });

            expect(mockRequest).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-type': 'application/json',
                    }),
                })
            );
        });
    });

    describe('Retries', () => {
        it('should retry on failure', async () => {
            mockRequest
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue(mockResponse({ success: true }));

            const result = await client.get('https://api.example.com/data', {
                retries: 2,
            });

            expect(result.data).toEqual({ success: true });
            expect(mockRequest).toHaveBeenCalledTimes(3);
        });

        it('should throw after all retries exhausted', async () => {
            mockRequest.mockRejectedValue(new Error('Network error'));

            await expect(
                client.get('https://api.example.com/data', { retries: 2 })
            ).rejects.toThrow('Network error');

            expect(mockRequest).toHaveBeenCalledTimes(3);
        });
    });

    describe('Timeout', () => {
        it('should pass timeout options to undici', async () => {
            mockRequest.mockResolvedValue(mockResponse({}));

            await client.get('https://api.example.com/data', {
                timeout: 5000,
            });

            expect(mockRequest).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headersTimeout: 5000,
                    bodyTimeout: 5000,
                })
            );
        });
    });
});

describe('HttpClient.aggregate', () => {
    let client: HttpClient;

    beforeEach(() => {
        client = new HttpClient();
        mockRequest.mockReset();
    });

    it('should aggregate multiple GET requests', async () => {
        mockRequest
            .mockResolvedValueOnce(mockResponse({ id: 1, name: 'Alice' }))
            .mockResolvedValueOnce(mockResponse([{ id: 1, title: 'Post 1' }]))
            .mockResolvedValueOnce(mockResponse({ count: 100 }));

        const result = await client.aggregate({
            baseUrl: 'https://api.example.com',
            sources: {
                user: '/users/1',
                posts: '/posts?userId=1',
                stats: '/stats',
            },
            output: (sources) => ({
                userName: sources.user.name,
                postCount: sources.posts.length,
                followerCount: sources.stats.count,
            }),
        });

        expect(result.data).toEqual({
            userName: 'Alice',
            postCount: 1,
            followerCount: 100,
        });
        expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    it('should substitute URL params', async () => {
        mockRequest.mockResolvedValue(mockResponse({ id: 123 }));

        await client.aggregate({
            baseUrl: 'https://api.example.com',
            params: { id: '123', type: 'premium' },
            sources: {
                user: '/users/:id',
                subscription: '/users/:id/subscription/:type',
            },
            output: (s) => s,
        });

        expect(mockRequest).toHaveBeenCalledWith(
            'https://api.example.com/users/123',
            expect.any(Object)
        );
        expect(mockRequest).toHaveBeenCalledWith(
            'https://api.example.com/users/123/subscription/premium',
            expect.any(Object)
        );
    });

    it('should support different HTTP methods', async () => {
        mockRequest
            .mockResolvedValueOnce(mockResponse({ id: 1 }))
            .mockResolvedValueOnce(mockResponse({ created: true }))
            .mockResolvedValueOnce(mockResponse({ updated: true }));

        await client.aggregate({
            baseUrl: 'https://api.example.com',
            sources: {
                get: '/data',
                post: { url: '/items', method: 'POST', body: { name: 'New' } },
                put: { url: '/items/1', method: 'PUT', body: { name: 'Updated' } },
            },
            output: (s) => s,
        });

        expect(mockRequest).toHaveBeenCalledWith(
            'https://api.example.com/data',
            expect.objectContaining({ method: 'GET' })
        );
        expect(mockRequest).toHaveBeenCalledWith(
            'https://api.example.com/items',
            expect.objectContaining({ method: 'POST' })
        );
        expect(mockRequest).toHaveBeenCalledWith(
            'https://api.example.com/items/1',
            expect.objectContaining({ method: 'PUT' })
        );
    });

    it('should handle partial failures when partial=true', async () => {
        mockRequest
            .mockResolvedValueOnce(mockResponse({ id: 1, name: 'Alice' }))
            .mockRejectedValueOnce(new Error('Posts service unavailable'))
            .mockResolvedValueOnce(mockResponse({ count: 50 }));

        const result = await client.aggregate({
            baseUrl: 'https://api.example.com',
            sources: {
                user: '/users/1',
                posts: '/posts',
                stats: '/stats',
            },
            output: (sources, errors) => ({
                user: sources.user,
                posts: sources.posts ?? [],
                stats: sources.stats,
                hasErrors: Object.keys(errors || {}).length > 0,
            }),
            partial: true,
        });

        expect(result.data.user).toEqual({ id: 1, name: 'Alice' });
        expect(result.data.posts).toEqual([]);
        expect(result.data.stats).toEqual({ count: 50 });
        expect(result.data.hasErrors).toBe(true);
        expect(result.errors?.posts).toBeInstanceOf(Error);
    });

    it('should throw on first failure when partial=false', async () => {
        mockRequest
            .mockResolvedValueOnce(mockResponse({ id: 1 }))
            .mockRejectedValueOnce(new Error('Service unavailable'));

        await expect(
            client.aggregate({
                baseUrl: 'https://api.example.com',
                sources: {
                    user: '/users/1',
                    posts: '/posts',
                },
                output: (s) => s,
                partial: false,
            })
        ).rejects.toThrow('Service unavailable');
    });

    it('should throw on missing URL param', async () => {
        await expect(
            client.aggregate({
                baseUrl: 'https://api.example.com',
                params: {}, // missing 'id'
                sources: {
                    user: '/users/:id',
                },
                output: (s) => s,
            })
        ).rejects.toThrow('Missing param: id');
    });

    it('should pass timeout to all requests', async () => {
        mockRequest.mockResolvedValue(mockResponse({}));

        await client.aggregate({
            baseUrl: 'https://api.example.com',
            sources: {
                a: '/a',
                b: '/b',
            },
            output: (s) => s,
            timeout: 3000,
        });

        expect(mockRequest).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headersTimeout: 3000,
                bodyTimeout: 3000,
            })
        );
    });

    it('should pass custom headers per source', async () => {
        mockRequest.mockResolvedValue(mockResponse({}));

        await client.aggregate({
            baseUrl: 'https://api.example.com',
            sources: {
                public: '/public',
                private: {
                    url: '/private',
                    headers: { 'Authorization': 'Bearer secret' },
                },
            },
            output: (s) => s,
        });

        // Find the call with Authorization header
        const privateCall = mockRequest.mock.calls.find(
            (call) => call[0].includes('/private')
        );
        expect(privateCall?.[1].headers).toEqual(
            expect.objectContaining({ 'Authorization': 'Bearer secret' })
        );
    });

    it('should execute requests in parallel', async () => {
        const startTime = Date.now();
        
        mockRequest.mockImplementation(async (url) => {
            await delay(50); // 每个请求 50ms
            return mockResponse({ url });
        });

        await client.aggregate({
            baseUrl: 'https://api.example.com',
            sources: {
                a: '/a',
                b: '/b',
                c: '/c',
            },
            output: (s) => s,
        });

        const elapsed = Date.now() - startTime;
        // 并行执行应该 < 150ms（串行会是 150ms+）
        expect(elapsed).toBeLessThan(120);
    });

    it('should work without baseUrl', async () => {
        mockRequest.mockResolvedValue(mockResponse({ ok: true }));

        await client.aggregate({
            sources: {
                external: 'https://other-api.com/data',
            },
            output: (s) => s,
        });

        expect(mockRequest).toHaveBeenCalledWith(
            'https://other-api.com/data',
            expect.any(Object)
        );
    });

    it('should handle empty sources', async () => {
        const result = await client.aggregate({
            sources: {},
            output: () => ({ empty: true }),
        });

        expect(result.data).toEqual({ empty: true });
        expect(mockRequest).not.toHaveBeenCalled();
    });
});