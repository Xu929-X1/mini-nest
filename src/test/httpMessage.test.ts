import { describe, it, expect } from 'vitest';
import { HttpRequest } from '../http/HttpRequest';
import { HttpResponse } from '../http/HttpResponse';


// ============================================
// HttpRequest Tests
// ============================================

describe('HttpRequest', () => {
    describe('constructor', () => {
        it('should parse basic request', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users',
            });

            expect(req.method).toBe('GET');
            expect(req.path).toBe('/users');
            expect(req.url).toBe('/users');
        });

        it('should parse query string', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users?page=1&limit=10',
            });

            expect(req.path).toBe('/users');
            expect(req.query).toEqual({ page: '1', limit: '10' });
        });

        it('should normalize headers to lowercase', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Custom-Header': 'value',
                },
            });

            expect(req.headers?.['content-type']).toBe('application/json');
            expect(req.headers?.['x-custom-header']).toBe('value');
        });

        it('should store body', () => {
            const body = { name: 'Alice', email: 'alice@example.com' };
            const req = new HttpRequest({
                method: 'POST',
                url: '/users',
                body,
            });

            expect(req.body).toEqual(body);
        });
    });

    describe('path normalization', () => {
        it('should add leading slash', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: 'users',
            });

            expect(req.path).toBe('/users');
        });

        it('should remove trailing slash', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users/',
            });

            expect(req.path).toBe('/users');
        });

        it('should handle root path', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/',
            });

            expect(req.path).toBe('/');
        });

        it('should handle empty path', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '',
            });

            expect(req.path).toBe('/');
        });
    });

    describe('static normalizePath', () => {
        it('should normalize various path formats', () => {
            expect(HttpRequest.normalizePath('')).toBe('/');
            expect(HttpRequest.normalizePath('/')).toBe('/');
            expect(HttpRequest.normalizePath('/users')).toBe('/users');
            expect(HttpRequest.normalizePath('/users/')).toBe('/users');
            expect(HttpRequest.normalizePath('users')).toBe('/users');
            expect(HttpRequest.normalizePath('users/')).toBe('/users');
        });
    });

    describe('params', () => {
        it('should get and set params', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users/123',
            });

            req.setParams({ id: '123' });

            expect(req.params).toEqual({ id: '123' });
            expect(req.param('id')).toBe('123');
        });

        it('should return undefined for missing param', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users',
            });

            expect(req.param('id')).toBeUndefined();
        });

        it('should return copy of params object', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users/123',
            });

            req.setParams({ id: '123' });
            const params = req.params;
            params.id = 'modified';

            expect(req.param('id')).toBe('123'); // Original unchanged
        });
    });

    describe('header', () => {
        it('should get header case-insensitively', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
                headers: { 'Content-Type': 'application/json' },
            });

            expect(req.header('content-type')).toBe('application/json');
            expect(req.header('Content-Type')).toBe('application/json');
            expect(req.header('CONTENT-TYPE')).toBe('application/json');
        });

        it('should return undefined for missing header', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
            });

            expect(req.header('authorization')).toBeUndefined();
        });
    });

    describe('query', () => {
        it('should parse multiple query params', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/search?q=hello&page=1&sort=asc',
            });

            expect(req.query).toEqual({
                q: 'hello',
                page: '1',
                sort: 'asc',
            });
        });

        it('should decode URL-encoded values', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/search?q=hello%20world',
            });

            expect(req.query.q).toBe('hello world');
        });

        it('should handle empty query string', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users',
            });

            expect(req.query).toEqual({});
        });

        it('should get single query param', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/users?page=2',
            });

            expect(req.getQueryParam('page')).toBe('2');
            expect(req.getQueryParam('limit')).toBeUndefined();
        });
    });

    describe('isJson', () => {
        it('should return true for JSON content type', () => {
            const req = new HttpRequest({
                method: 'POST',
                url: '/api',
                headers: { 'Content-Type': 'application/json' },
            });

            expect(req.isJson).toBe(true);
        });

        it('should return true for JSON with charset', () => {
            const req = new HttpRequest({
                method: 'POST',
                url: '/api',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            });

            expect(req.isJson).toBe(true);
        });

        it('should return false for non-JSON', () => {
            const req = new HttpRequest({
                method: 'POST',
                url: '/api',
                headers: { 'Content-Type': 'text/html' },
            });

            expect(req.isJson).toBe(false);
        });
    });

    describe('ip', () => {
        it('should get IP from x-forwarded-for', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
                headers: { 'X-Forwarded-For': '192.168.1.1, 10.0.0.1' },
            });

            expect(req.ip).toBe('192.168.1.1');
        });

        it('should get IP from x-real-ip', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
                headers: { 'X-Real-IP': '192.168.1.100' },
            });

            expect(req.ip).toBe('192.168.1.100');
        });

        it('should return unknown when no IP header', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
            });

            expect(req.ip).toBe('unknown');
        });
    });

    describe('accepts', () => {
        it('should check accept header', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
                headers: { 'Accept': 'application/json, text/html' },
            });

            expect(req.accepts('application/json')).toBe(true);
            expect(req.accepts('text/html')).toBe(true);
            expect(req.accepts('text/plain')).toBe(false);
        });

        it('should handle wildcard', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
                headers: { 'Accept': '*/*' },
            });

            expect(req.accepts('anything')).toBe(true);
        });

        it('should return false when no accept header', () => {
            const req = new HttpRequest({
                method: 'GET',
                url: '/test',
            });

            expect(req.accepts('application/json')).toBe(false);
        });
    });
});

// ============================================
// HttpResponse Tests
// ============================================

describe('HttpResponse', () => {
    describe('status', () => {
        it('should set status code', () => {
            const res = new HttpResponse();
            res.status(201);

            expect(res.statusCode).toBe(201);
        });

        it('should default to 200', () => {
            const res = new HttpResponse();
            expect(res.statusCode).toBe(200);
        });

        it('should be chainable', () => {
            const res = new HttpResponse();
            const result = res.status(404);

            expect(result).toBe(res);
        });
    });

    describe('header', () => {
        it('should set header', () => {
            const res = new HttpResponse();
            res.header('X-Custom', 'value');

            expect(res.headers['x-custom']).toBe('value');
        });

        it('should normalize header key to lowercase', () => {
            const res = new HttpResponse();
            res.header('Content-Type', 'text/plain');

            expect(res.headers['content-type']).toBe('text/plain');
        });

        it('should be chainable', () => {
            const res = new HttpResponse();
            const result = res.header('X-Test', 'value');

            expect(result).toBe(res);
        });
    });

    describe('json', () => {
        it('should set JSON body', () => {
            const res = new HttpResponse();
            res.json({ message: 'Hello' });

            expect(res.body).toEqual({ message: 'Hello' });
        });

        it('should set content-type header', () => {
            const res = new HttpResponse();
            res.json({ data: true });

            expect(res.headers['content-type']).toBe('application/json');
        });

        it('should mark response as sent', () => {
            const res = new HttpResponse();
            res.json({});

            expect(res.isSent).toBe(true);
        });

        it('should throw if already sent', () => {
            const res = new HttpResponse();
            res.json({ first: true });

            expect(() => res.json({ second: true })).toThrow();
        });
    });

    describe('send', () => {
        it('should set body', () => {
            const res = new HttpResponse();
            res.send('Hello World');

            expect(res.body).toBe('Hello World');
        });

        it('should mark response as sent', () => {
            const res = new HttpResponse();
            res.send('data');

            expect(res.isSent).toBe(true);
        });

        it('should throw if already sent', () => {
            const res = new HttpResponse();
            res.send('first');

            expect(() => res.send('second')).toThrow();
        });
    });

    describe('toJSON', () => {
        it('should serialize response', () => {
            const res = new HttpResponse();
            res.status(201).header('X-Test', 'value').json({ id: 1 });

            const json = res.toJSON();

            expect(json).toEqual({
                statusCode: 201,
                headers: {
                    'x-test': 'value',
                    'content-type': 'application/json',
                },
                body: { id: 1 },
            });
        });
    });

    describe('immutability after send', () => {
        it('should throw when setting status after send', () => {
            const res = new HttpResponse();
            res.send('done');

            expect(() => res.status(500)).toThrow();
        });

        it('should throw when setting header after send', () => {
            const res = new HttpResponse();
            res.json({});

            expect(() => res.header('X-Late', 'value')).toThrow();
        });
    });
});