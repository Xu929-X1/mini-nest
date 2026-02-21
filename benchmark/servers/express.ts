import express from 'express';

const app = express();
app.use(express.json());

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

app.get('/', (_req, res) => {
    res.send('Hello World');
});

app.get('/json', (_req, res) => {
    res.json({ message: 'Hello World', timestamp: Date.now() });
});

app.get('/users/:id', (req, res) => {
    res.json(userService.getUser(req.params.id));
});

app.get('/users/:id/profile', (req, res) => {
    res.json(userService.getProfile(req.params.id));
});

const PORT = parseInt(process.env.PORT || '3001');

app.listen(PORT, () => {
    console.log(`[express] Server running on http://localhost:${PORT}`);
});

export { app };