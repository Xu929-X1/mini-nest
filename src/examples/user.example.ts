import "../examples/controllers/UserController";
import { simulateRequest } from "../simulateRequest";
import "reflect-metadata";
simulateRequest('/users', 'GET');
simulateRequest('/users/3', 'GET');
simulateRequest('/users/123?verbose=true', 'GET');