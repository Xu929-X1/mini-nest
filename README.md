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

- Exception Filter ✅

- Validation Pipeline

- Guards / Interceptors / Middleware (WIP)

- Module organization (@Module)

- Real HTTP server integration (e.g. Express/Fastify)

## 🦅 High Level

This is a server-side framework designed to help developers handle API requests in a structured and elegant way. From that perspective, understanding the lifecycle of a request is essential to grasp how the project is architected.

### 🥾 Bootstrap 

**Bootstrap** is the process of initializing the framework, registering metadata,
and preparing the runtime environment **before any request is handled**.

At the end of bootstrap, the application reaches a **stable state** where:
- Routes are registered
- Controllers and dependencies are instantiated
- Global middleware / interceptors / guards are ready
- The HTTP server is listening for incoming requests


## High-Level Flow

```text
Create Application
  ↓
Load Modules & Metadata
  ↓
Instantiate Controllers & Providers
  ↓
Register Routes
  ↓
Initialize Global Pipeline
  ↓
Start HTTP Server
```

### Request Life Cycle     

When a request enters this framework, this is what will happen: 

---

### Phase 1: Request parsing and route matching

- HTTP request enters the framework, the framework receives the request as:
    - Raw HTTP request (method, headers, url, body)

- URL parsing and normalization
    - The framework parses the URL and extracts **path** and **query parameters**
    - Request headers are normalized (header keys are converted to lower case)

- Route matching
    - The framework looks up the route registry using **method + path**
    - The corresponding route handler and its metadata are resolved
    - If no route is matched, the request is terminated with a `NotFound` error

---

### Phase 2: Execution context preparation and pre-processing

- Execution context creation
    - An execution context is created for the current request
    - The context contains:
        - Request and response objects
        - Matched route information
        - Controller instance and handler reference
        - Parameter and metadata definitions

- Guards (authorization / access control)
    - Guards are executed to determine whether the request is allowed to proceed
    - If any guard denies the request, execution stops immediately

- Parameter resolution
    - Handler parameters are resolved from the execution context
    - Supported parameter sources include:
        - Path parameters
        - Query parameters
        - Request body
        - Headers

- Pipes (transformation and validation)
    - Resolved parameters are passed through pipes
    - Pipes may transform or validate parameter values
    - If a pipe throws an error, request execution is terminated

---

### Phase 3: Handler execution and interception

- Interceptors (before execution)
    - Interceptors are invoked before the handler is executed
    - Interceptors may perform:
        - Logging
        - Timing
        - Context modification
        - Result wrapping

- Handler execution
    - The matched controller method is executed with resolved parameters
    - The handler may return a value synchronously or asynchronously

- Interceptors (after execution)
    - Interceptors process the handler’s return value
    - The result may be transformed or wrapped before being sent

---

### Phase 4: Response mapping and completion

- Response mapping
    - The final result is mapped to an HTTP response
    - Status code, headers, and response body are resolved by the framework

- Response sent
    - The HTTP response is sent back to the client
    - The request life cycle ends

---

### Error handling

- Errors may be thrown at any phase of the request lifecycle
- Thrown errors are captured and handled by the framework’s error handling layer
- Errors are converted into appropriate HTTP responses




## Credits
Built with ❤️ by Xu929-X1 for learning and experimentation.