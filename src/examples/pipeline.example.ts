// src/examples/pipeline.example.ts
import "reflect-metadata";
import { Container } from "../container";
import { RequestPipeline } from "../core/RequestPipeline";
import "./controllers/UserController";  // 触发装饰器注册路由

const pipeline = new RequestPipeline(Container.instance);

async function test() {
    console.log("=== Test 1: GET /users ===");
    const res1 = await pipeline.handle({
        method: "GET",
        url: "/users",
    });
    console.log("Response:", res1.toJSON());

    console.log("\n=== Test 2: GET /users/123 ===");
    const res2 = await pipeline.handle({
        method: "GET",
        url: "/users/123",
    });
    console.log("Response:", res2.toJSON());

    console.log("\n=== Test 3: GET /users/123?verbose=true ===");
    const res3 = await pipeline.handle({
        method: "GET",
        url: "/users/123?verbose=true",
    });
    console.log("Response:", res3.toJSON());

    console.log("\n=== Test 4: POST /users/999 ===");
    const res4 = await pipeline.handle({
        method: "POST",
        url: "/users/999?expand=true",
        body: { name: "John Doe" },
        headers: { authorization: "Bearer token123" },
    });
    console.log("Response:", res4.toJSON());

    console.log("\n=== Test 5: 404 Not Found ===");
    const res5 = await pipeline.handle({
        method: "GET",
        url: "/not-exist",
    });
    console.log("Response:", res5.toJSON());
}

test().catch(console.error);