import Fastify from 'fastify';

const app = Fastify();

// Simulate service
const userService = {
    getUser(id: string) {
        return {
            id,
            name: 'Alice',
            email: 'alice@example.com',
        };
    },
    getProfile(id: string) {
        return {
            id,
            name: 'Alice',
            email: 'alice@example.com',
            posts: 42,
            followers: 1234,
            bio: 'Software Engineer',
        };
    },
};

app.get('/', async () => {
    return 'Hello World';
});

app.get('/json', async () => {
    return { message: 'Hello World', timestamp: Date.now() };
});

app.get('/users/:id', async (request) => {
    const { id } = request.params as { id: string };
    return userService.getUser(id);
});

app.get('/users/:id/profile', async (request) => {
    const { id } = request.params as { id: string };
    return userService.getProfile(id);
});

const PORT = parseInt(process.env.PORT || '3002');

app.listen({ port: PORT }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`[fastify] Server running on http://localhost:${PORT}`);
});

export { app };