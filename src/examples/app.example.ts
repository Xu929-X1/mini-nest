import 'reflect-metadata';
import { createMiniNestApp } from '../app/App';
import { UserController } from './controllers/UserController';
import { LogController } from './controllers/LogController';

createMiniNestApp({
    port: 3000, controllers: [
        UserController,
        LogController
    ]
}).listen();
