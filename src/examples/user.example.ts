import "../examples/controllers/UserController";
import { simulateRequest } from "../simulateRequest";
import "reflect-metadata";
simulateRequest('/users', 'GET');
simulateRequest('/users/3', 'GET');
simulateRequest('/users/123?verbose=true', 'GET');
simulateRequest('/users/999?expand=true&randomQuery=123', 'POST', {
    body: { name: 'John Doe' },
    headers: { authorization: 'Bearer token 123' }
});