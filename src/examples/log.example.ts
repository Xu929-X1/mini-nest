import { simulateRequest } from '../simulateRequest';
import './controllers/LogController';
import "reflect-metadata";

simulateRequest('/log/test', 'GET');