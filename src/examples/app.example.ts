import 'reflect-metadata';
import './controllers/UserController';
import { createMiniNestApp } from '../app/App';

createMiniNestApp({ port: 3000 }).listen();
