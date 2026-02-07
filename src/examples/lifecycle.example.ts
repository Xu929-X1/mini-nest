import "reflect-metadata";
import { Container } from "../container";
import { RequestPipeline } from "../request/core/RequestPipeline";
import "./controllers/UserController";

const pipeline = new RequestPipeline(Container.instance);

async function test() {
    console.log("=== Test 1: Lifecycle hooks (success) ===");
    const res1 = await pipeline.handle({
        method: "GET",
        url: "/users",
    });
    console.log("Response:", res1.statusCode);

    console.log("\n=== Test 2: Lifecycle hooks (error) ===");
    const res2 = await pipeline.handle({
        method: "GET",
        url: "/users/error",
    });
    console.log("Response:", res2.toJSON());
}

test().catch(console.error);