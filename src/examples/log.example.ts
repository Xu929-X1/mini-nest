import { createTestApp } from './createTestApp';
import { LogController } from './controllers/LogController';

createTestApp(LogController, '/log/test', 'GET');