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

## Getting Started

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

or use ts-node to run all examples directly: 

```bash
ts-node src/main.ts
```

I have a script defined already, this is equivalent to the previous command: 

```bash
npm run dev
```

## 🔍 Roadmap
 
- Route parameters: /users/:id ✅

- Request body decorators (@Body()) ✅

- Parameter validation ✅

- Life cycle hooks (WIP)

- Exception Filter (WIP)

- Validation Pipeline

- Guards / Interceptors / Middleware

- Module organization (@Module)

- Real HTTP server integration (e.g. Express/Fastify)

## 🦅 High Level

This is a server-side framework designed to help developers handle API requests in a structured and elegant way. From that perspective, understanding the lifecycle of a request is essential to grasp how the project is architected.

### Request Life Cycle     

A request begins in simulateRequest (for now), which serves as the entry point of the framework. The following steps occur in order:

1. Route lookup: The framework looks up the appropriate handler in the routeRegistry based on HTTP method and URL.

2. Controller instantiation: It creates a controller instance using the DI container, resolving any constructor dependencies automatically.

3. Parameter injection: It collects metadata from the paramRegistry and resolves the parameters (e.g., from body, query, params, headers) to inject into the handler.

4. Handler execution: It calls the controller method with the resolved arguments.

5. Business logic: Finally, control is handed over to the logic the user has written inside the handler method.

This flow mimics the core behavior of frameworks like NestJS, but with a minimal and transparent implementation.


## Credits
Built with ❤️ by Xu929-X1 for learning and experimentation.