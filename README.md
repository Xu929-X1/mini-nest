# mini-nest

A lightweight, educational Node.js framework inspired by [NestJS](https://nestjs.com), written in TypeScript. It implements constructor-based Dependency Injection (DI), decorator-driven routing, and a simplified controller system—all without relying on Express or HTTP servers.

---

## ✨ Features

- ⚙️ Constructor-based dependency injection system
- 🧩 Decorator support: `@Injectable()`, `@Controller()`, `@Get()` etc.
- 📦 Centralized route registry
- 🧪 Simulated HTTP-like request dispatch (`simulateRequest`)
- 📚 Designed to help understand framework internals

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```
### 2. Build the project

```bash
npm run build
```

### 3. Run Examples

Examples are in example directory, if you want, for example, run user service/controller example: 

```bash
node dist/examples/user.example.js
```

## Project Structure

```ruby
mini-nest/
├── src/
│   ├── container.ts              # Dependency injection container
│   ├── injectable.ts             # @Injectable decorator
│   ├── controller.ts             # @Controller decorator
│   ├── createMethodDecorator.ts  # @Get / @Post decorators
│   ├── routeRegistry.ts          # Route metadata and registry
│   ├── simulateRequest.ts        # Mock request dispatcher
│   └── examples/
│       ├── services/
│       │   ├── LoggerService.ts
│       │   └── UserService.ts
│       ├── controllers/
│       │   └── UserController.ts
│       └── user.example.ts       # Entry point for testing
```

## 🔍 Roadmap
 
- Route parameters: /users/:id

- Request body decorators (@Body())

- Guards / Interceptors / Middleware

- Module organization (@Module)

- Real HTTP server integration (e.g. Express/Fastify)

## 👏 Credits
Built with ❤️ by Xu929-X1 for learning and experimentation.