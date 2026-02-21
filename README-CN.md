# mini-nest

一个轻量级、受 NestJS 启发的 BFF（Backend-for-Frontend）Node.js 框架。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-92.5%25-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](./README.md) | 中文

## 特性

- 🎯 **装饰器驱动** - 熟悉的 NestJS 风格装饰器
- 💉 **依赖注入** - 自动构造函数注入
- 🛡️ **守卫与拦截器** - 请求管道控制
- ⚡ **AOP 装饰器** - `@Cache`、`@Retry`、`@Timeout`、`@CircuitBreaker`
- 🔗 **HTTP 客户端** - 内置客户端，支持 `aggregate()` BFF 聚合模式
- 🌳 **Trie 路由** - 基于前缀树的快速路由匹配
- 🔄 **生命周期钩子** - `onModuleInit`、`onModuleDestroy` 等
- 📦 **轻量级** - 最小依赖，达到原生框架 ~90% 性能

## 设计边界

mini-nest 刻意保持轻量。以下是它**支持**和**不支持**的功能：

| 功能 | 状态 | 说明 |
|------|------|------|
| 单例 DI | ✅ | 暂不支持请求作用域 |
| 静态路由 | ✅ | 不支持正则/通配符 |
| JSON API | ✅ | 不内置流式/multipart |
| 单租户 | ✅ | 多租户需手动处理 |
| 装饰器驱动 | ✅ | 不支持运行时动态注册 |

**适合场景：**
- BFF（Backend-for-Frontend）聚合层
- 中小型 API 服务
- 熟悉 NestJS 的团队
- 追求简洁的项目

**不太适合：**
- 需要模块隔离的大型单体
- 实时流式应用
- 多租户 SaaS（需额外开发）
- 需要请求级 DI 作用域的项目

## 安装

```bash
npm install mini-nest
```

## 快速开始

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

app.listen(() => console.log('服务运行在 http://localhost:3000'));
```

## 文档

### 控制器与路由

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

### 参数装饰器

```typescript
import { Body, Query, Param, Header } from 'mini-nest';

@Controller('/api')
class ExampleController {
    @Post('/search')
    search(
        @Body() body: any,                    // 完整请求体
        @Body('query') query: string,         // 指定字段
        @Query('page') page: string,          // 查询参数
        @Param('id') id: string,              // 路由参数
        @Header('authorization') auth: string // 请求头
    ) {
        return { body, query, page, id, auth };
    }
}
```

### 依赖注入

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

### 守卫

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

### 拦截器

```typescript
import { Injectable, Interceptor, UseInterceptor } from 'mini-nest';

@Injectable()
class LoggingInterceptor implements Interceptor {
    async intercept(next: () => Promise<unknown>) {
        console.log('请求前...');
        const result = await next();
        console.log('请求后...');
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

### AOP 装饰器

#### @Cache（缓存）

```typescript
import { Cache } from 'mini-nest';

@Injectable()
class DataService {
    @Cache({ ttl: 60 })  // 缓存 60 秒
    getExpensiveData() {
        return computeExpensiveOperation();
    }

    @Cache({ ttl: 300, key: 'custom-key' })
    getWithCustomKey() {
        return data;
    }
}
```

#### @Retry（重试）

```typescript
import { Retry } from 'mini-nest';

@Injectable()
class ExternalApiService {
    @Retry(3)  // 最多重试 3 次，指数退避
    async fetchData() {
        return await fetch('https://api.example.com/data');
    }
}
```

#### @Timeout（超时）

```typescript
import { Timeout } from 'mini-nest';

@Injectable()
class SlowService {
    @Timeout(5000)  // 5 秒超时
    async slowOperation() {
        return await longRunningTask();
    }
}
```

#### @CircuitBreaker（熔断器）

```typescript
import { CircuitBreaker } from 'mini-nest';

@Injectable()
class RiskyService {
    @CircuitBreaker({ 
        failureThreshold: 5,  // 5 次失败后熔断
        resetTimeout: 30000   // 30 秒后尝试恢复
    })
    async callExternalService() {
        return await externalApi.call();
    }
}
```

### HTTP 客户端

内置 HTTP 客户端，支持重试、超时和聚合：

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

#### Aggregate（BFF 聚合模式）

将多个 API 调用合并为单个响应：

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
            partial: true,  // 部分失败时继续返回
        });

        return data;
    }
}
```

### 生命周期钩子

```typescript
import { Injectable, OnInit, OnDestroy } from 'mini-nest';

@Injectable()
class DatabaseService implements OnInit, OnDestroy {
    private connection: any;

    onInit() {
        console.log('连接数据库...');
        this.connection = createConnection();
    }

    onDestory() {
        console.log('关闭数据库连接...');
        this.connection.close();
    }
}
```

### 参数验证

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

### 异常处理

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
            throw new NotFoundException(`用户 ${id} 不存在`);
        }
        return user;
    }
}
```

自定义异常过滤器：

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

## 配置

```typescript
const app = createMiniNestApp({
    port: 3000,
    adapter: 'express' | 'fastify',  // 支持 Express 和 Fastify
    controllers: [UserController, PostController],
    https: {             // 可选 HTTPS
        key: '/path/to/key.pem',
        cert: '/path/to/cert.pem',
    },
});
```

## 性能测试

与 Express 和 Fastify 对比（10 秒，100 连接）：

| 框架 | 请求数 | 相对性能 |
|------|--------|----------|
| Fastify（原生） | 2,544,032 | 100% |
| **mini-nest + Fastify** | **2,290,571** | **90.0%** |
| Express（原生） | 1,742,452 | 68.5% |
| mini-nest + Express | 1,739,737 | 68.4% |

**mini-nest + Fastify** 达到原生 Fastify 90% 的性能，同时提供：
- 依赖注入
- 装饰器路由
- AOP 功能（缓存、重试、超时、熔断）
- 守卫与拦截器
- 内置 HTTP 客户端聚合

本地运行性能测试：

```bash
npm run benchmark
```

## 项目结构

```
src/
├── core/
│   ├── app/           # 应用启动
│   ├── container/     # DI 容器
│   └── pipeline/      # 请求管道
├── decorators/
│   ├── http/          # @Controller, @Get, @Post 等
│   └── aop/           # @Cache, @Retry, @Timeout, @CircuitBreaker
├── http/
│   ├── adapters/      # Express 和 Fastify 适配器
│   └── client/        # HttpClient
├── guards/            # 守卫系统
├── interceptors/      # 拦截器系统
├── exceptions/        # 异常处理
├── routing/           # Trie 路由
├── validation/        # 参数验证
└── lifecycle/         # 生命周期钩子
```

## 环境要求

- Node.js 18+
- TypeScript 5.0+
- `experimentalDecorators: true`
- `emitDecoratorMetadata: true`

tsconfig.json 配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "experimentalDecorators": true,  // 必须开启
    "emitDecoratorMetadata": true,   // 必须开启
    "esModuleInterop": true,
    "strict": true
  }
}
```

## 测试

```bash
# 运行测试
npm test

# 运行覆盖率测试
npm run test:coverage
```

## 路线图

- [ ] 模块系统（`@Module()`）
- [ ] WebSocket 支持
- [ ] OpenAPI/Swagger 生成
- [ ] CLI 工具

## License

MIT