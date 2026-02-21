import 'reflect-metadata';
import { createMiniNestApp } from '../../src/core/app/App';
import { Controller } from '../../src/decorators/http/Controller';
import { Get } from '../../src/decorators/http/CreateMethodDecorator';
import { Param } from '../../src/decorators/http/CreateParamDecorator';
import { Injectable } from '../../src/decorators/Injectable';

@Injectable()
class UserService {
    getUser(id: string) {
        return {
            id,
            name: 'Alice',
            email: 'alice@example.com',
        };
    }

    getProfile(id: string) {
        return {
            id,
            name: 'Alice',
            email: 'alice@example.com',
            posts: 42,
            followers: 1234,
            bio: 'Software Engineer',
        };
    }
}

@Controller('/')
class BenchmarkController {
    constructor(private userService: UserService) {}

    @Get('/')
    hello() {
        return 'Hello World';
    }

    @Get('/json')
    json() {
        return { message: 'Hello World', timestamp: Date.now() };
    }

    @Get('/users/:id')
    getUser(@Param('id') id: string) {
        return this.userService.getUser(id);
    }

    @Get('/users/:id/profile')
    getProfile(@Param('id') id: string) {
        return this.userService.getProfile(id);
    }
}

const PORT = parseInt(process.env.PORT || '3003');

const app = createMiniNestApp({
    port: PORT,
    adapter: 'fastify', 
    controllers: [BenchmarkController],
});

app.listen(() => {
    console.log(`[mini-nest-fastify] Server running on http://localhost:${PORT}`);
});

export { app };