# mini-nest

A lightweight, NestJS-inspired BFF (Backend-for-Frontend) framework for Node.js.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-92.5%25-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

English | [中文](README-CN.md)

## Features

- 🎯 **Decorator-based** - Familiar NestJS-style decorators
- 💉 **Dependency Injection** - Automatic constructor injection
- 🛡️ **Guards & Interceptors** - Request pipeline control
- ⚡ **AOP Decorators** - `@Cache`, `@Retry`, `@Timeout`, `@CircuitBreaker`
- 🔗 **HTTP Client** - Built-in client with `aggregate()` for BFF patterns
- 🌳 **Trie-based Routing** - Fast route matching with params
- 🔄 **Lifecycle Hooks** - `OnInit`, `OnDestroy`, etc.
- 📦 **Lightweight** - Minimal dependencies, ~65% Express performance, ~90% fastify performance


## Design Boundaries

mini-nest is intentionally lightweight. Here's what it **does** and **doesn't** do:

| Feature | Status | Notes |
|---------|--------|-------|
| Singleton DI | ✅ | No request-scope support yet |
| Static routing | ✅ | No regex/wildcard patterns |
| JSON API | ✅ | No streaming/multipart built-in |
| Single-tenant | ✅ | Multi-tenant needs manual handling |
| Decorator-based | ✅ | No runtime route registration |

**Best for:**
- BFF (Backend-for-Frontend) layers
- Small to medium APIs
- Teams familiar with NestJS patterns
- Projects prioritizing simplicity over features

**Not ideal for:**
- Large monoliths needing module isolation
- Real-time streaming applications
- Multi-tenant SaaS (without custom work)
- Projects requiring request-scoped DI

## Installation

```bash
npm install mini-nest
```

## Quick Start

```typescript
import 'reflect-metadata';
import { createMiniNestApp, Controller, Get, Injectable, Param } from 'mini-nest';

@Injectable()
class UserService {
    getUser(id: string) {
        return { id, name: 'Alice' };
    }
}

@Controller('/api/users')
class UserController {
    constructor(private userService: UserService) {}

    @Get('/:id')
    getUser(@Param('id') id: string) {
        return this.userService.getUser(id);
    }
}

const app = createMiniNestApp({
    port: 3000,
    controllers: [UserController],
});

app.listen(() => console.log('Server running on http://localhost:3000'));
```

## Documentation

### Controllers & Routes

```typescript
import { Controller, Get, Post, Put, Delete, Patch } from 'mini-nest';

@Controller('/api/users')
class UserController {
    @Get('/')
    findAll() {
        return [];
    }

    @Get('/:id')
    findOne(@Param('id') id: string) {
        return { id };
    }

    @Post('/')
    create(@Body() data: any) {
        return data;
    }

    @Put('/:id')
    update(@Param('id') id: string, @Body() data: any) {
        return { id, ...data };
    }

    @Delete('/:id')
    remove(@Param('id') id: string) {
        return { deleted: id };
    }
}
```

### Parameter Decorators

```typescript
import { Body, Query, Param, Header } from 'mini-nest';

@Controller('/api')
class ExampleController {
    @Post('/search')
    search(
        @Body() body: any,                    // Full body
        @Body('query') query: string,         // Specific field
        @Query('page') page: string,          // Query param
        @Param('id') id: string,              // Route param
        @Header('authorization') auth: string // Header
    ) {
        return { body, query, page, id, auth };
    }
}
```

### Dependency Injection

```typescript
import { Injectable } from 'mini-nest';

@Injectable()
class DatabaseService {
    query(sql: string) {
        return [{ id: 1 }];
    }
}

@Injectable()
class UserRepository {
    constructor(private db: DatabaseService) {}

    findAll() {
        return this.db.query('SELECT * FROM users');
    }
}

@Injectable()
class UserService {
    constructor(private repo: UserRepository) {}

    getUsers() {
        return this.repo.findAll();
    }
}
```

### Guards

```typescript
import { Injectable, Guard, UseGuard, ExecutionContext } from 'mini-nest';

@Injectable()
class AuthGuard implements Guard {
    canActivate(ctx: ExecutionContext): boolean {
        const request = ctx.getRequest();
        const token = request.header('authorization');
        return token === 'Bearer valid-token';
    }
}

@Controller('/api/admin')
class AdminController {
    @Get('/dashboard')
    @UseGuard([AuthGuard])
    getDashboard() {
        return { data: 'secret' };
    }
}
```

### Interceptors

```typescript
import { Injectable, Interceptor, UseInterceptor } from 'mini-nest';

@Injectable()
class LoggingInterceptor implements Interceptor {
    async intercept(next: () => Promise<unknown>) {
        console.log('Before...');
        const result = await next();
        console.log('After...');
        return result;
    }
}

@Injectable()
class TransformInterceptor implements Interceptor {
    async intercept(next: () => Promise<unknown>) {
        const result = await next();
        return { data: result, timestamp: Date.now() };
    }
}

@Controller('/api')
@UseInterceptor(LoggingInterceptor)
class ApiController {
    @Get('/data')
    @UseInterceptor(TransformInterceptor)
    getData() {
        return { message: 'Hello' };
    }
}
```

### AOP Decorators

#### @Cache

```typescript
import { Cache } from 'mini-nest';

@Injectable()
class DataService {
    @Cache({ ttl: 60 })  // Cache for 60 seconds
    getExpensiveData() {
        return computeExpensiveOperation();
    }

    @Cache({ ttl: 300, key: 'custom-key' })
    getWithCustomKey() {
        return data;
    }
}
```

#### @Retry

```typescript
import { Retry } from 'mini-nest';

@Injectable()
class ExternalApiService {
    @Retry(3)  // Retry up to 3 times with exponential backoff
    async fetchData() {
        return await fetch('https://api.example.com/data');
    }
}
```

#### @Timeout

```typescript
import { Timeout } from 'mini-nest';

@Injectable()
class SlowService {
    @Timeout(5000)  // Timeout after 5 seconds
    async slowOperation() {
        return await longRunningTask();
    }
}
```

#### @CircuitBreaker

```typescript
import { CircuitBreaker } from 'mini-nest';

@Injectable()
class RiskyService {
    @CircuitBreaker({ 
        failureThreshold: 5,  // Open after 5 failures
        resetTimeout: 30000   // Try again after 30s
    })
    async callExternalService() {
        return await externalApi.call();
    }
}
```

### HttpClient

Built-in HTTP client with retry, timeout, and aggregation support:

```typescript
import { Injectable, HttpClient } from 'mini-nest';

@Injectable()
class ApiService {
    constructor(private http: HttpClient) {}

    async getUser(id: string) {
        const res = await this.http.get(`https://api.example.com/users/${id}`);
        return res.data;
    }

    async createUser(data: any) {
        const res = await this.http.post('https://api.example.com/users', data);
        return res.data;
    }
}
```

#### Aggregate (BFF Pattern)

Combine multiple API calls into a single response:

```typescript
@Injectable()
class BffService {
    constructor(private http: HttpClient) {}

    async getUserProfile(userId: string) {
        const { data, errors } = await this.http.aggregate({
            baseUrl: 'https://api.example.com',
            params: { id: userId },
            sources: {
                user: '/users/:id',
                posts: '/users/:id/posts',
                followers: '/users/:id/followers',
            },
            output: (sources) => ({
                id: sources.user.id,
                name: sources.user.name,
                postCount: sources.posts.length,
                followerCount: sources.followers.length,
            }),
            timeout: 5000,
            partial: true,  // Continue even if some requests fail
        });

        return data;
    }
}
```

### Lifecycle Hooks

```typescript
import { Injectable, OnInit, OnDestroy } from 'mini-nest';

@Injectable()
class DatabaseService implements OnInit, OnDestroy {
    private connection: any;

    OnInit() {
        console.log('Connecting to database...');
        this.connection = createConnection();
    }

    OnDestroy() {
        console.log('Closing database connection...');
        this.connection.close();
    }
}
```

### Validation

```typescript
import { Query, Body, rule } from 'mini-nest';

@Controller('/api')
class ValidationController {
    @Get('/search')
    search(
        @Query({ 
            key: 'page', 
            validator: rule().required().min(1) 
        }) 
        page: number,

        @Query({ 
            key: 'email', 
            validator: rule().required().pattern(/^[\w-]+@[\w-]+\.\w+$/) 
        }) 
        email: string
    ) {
        return { page, email };
    }

    @Post('/users')
    createUser(
        @Body({
            key: 'name',
            validator: rule().required().minLength(2).maxLength(50)
        })
        name: string
    ) {
        return { name };
    }
}
```

### Exception Handling

```typescript
import { 
    NotFoundException, 
    BadRequestException, 
    UnauthorizedException,
    ForbiddenException,
    InternalServerErrorException 
} from 'mini-nest';

@Controller('/api/users')
class UserController {
    @Get('/:id')
    getUser(@Param('id') id: string) {
        const user = findUser(id);
        if (!user) {
            throw new NotFoundException(`User ${id} not found`);
        }
        return user;
    }
}
```

Custom exception filter:

```typescript
import { ExceptionFilter, ExecutionContext } from 'mini-nest';

class CustomExceptionFilter implements ExceptionFilter {
    canHandle(exception: unknown): boolean {
        return exception instanceof CustomError;
    }

    catch(exception: CustomError, context: ExecutionContext) {
        const response = context.getResponse();
        response.status(400).json({
            error: 'CustomError',
            message: exception.message,
        });
    }
}
```

## Configuration

```typescript
const app = createMiniNestApp({
    port: 3000,
    adapter: 'express' | 'fastify',  
    controllers: [UserController, PostController],
    https: {             // Optional HTTPS
        key: '/path/to/key.pem',
        cert: '/path/to/cert.pem',
    },
});
```

## Benchmark

Compared against Express and Fastify (10s, 100 connections):


| Framework | Requests | Relative |
|-----------|----------|----------|
| Fastify (raw) | 2,544,032 | 100% |
| mini-nest + Fastify | 2,290,571 | 90.0% |
| Express (raw) | 1,742,452 | 68.5% |
| mini-nest + Express | 1,739,737 | 68.4% |

mini-nest performs comparably to Express while providing:
- Dependency Injection
- Decorator-based routing
- AOP features (Cache, Retry, Timeout, CircuitBreaker)
- Guards & Interceptors
- Built-in HTTP client with aggregation

Run benchmarks locally:

```bash
npm run benchmark
```

## Project Structure

```
src/
├── core/
│   ├── app/           # Application bootstrap
│   ├── container/     # DI container
│   └── pipeline/      # Request pipeline
├── decorators/
│   ├── http/          # @Controller, @Get, @Post, etc.
│   └── aop/           # @Cache, @Retry, @Timeout, @CircuitBreaker
├── http/
│   ├── adapters/      # Express and Fastify adapter
│   └── client/        # HttpClient
├── guards/            # Guard system
├── interceptors/      # Interceptor system
├── exceptions/        # Exception handling
├── routing/           # Trie-based router
├── validation/        # Parameter validation
└── lifecycle/         # Lifecycle hooks
```

## Requirements

- Node.js 18+
- TypeScript 5.0+
- `experimentalDecorators: true`
- `emitDecoratorMetadata: true`

tsconfig.json:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "experimentalDecorators": true, //very important
    "emitDecoratorMetadata": true, //very important
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Roadmap

- [ ] Module system (`@Module()`)
- [ ] WebSocket support
- [ ] OpenAPI/Swagger generation
- [ ] CLI tool

## License

MIT