import { createMiniNestApp } from "../../core/app/App";
import { UserController } from "./controllers/UserController";


const app = createMiniNestApp({
    port: 3000,
    controllers: [UserController],
});

app.listen(() => {
    console.log('BFF Example running on http://localhost:3000');
    console.log('');
    console.log('Try:');
    console.log('  GET  http://localhost:3000/api/users/1');
    console.log('  GET  http://localhost:3000/api/users/1/profile');
    console.log('  POST http://localhost:3000/api/users');
});