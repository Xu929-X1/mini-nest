import "../examples/controllers/UserController";
import { simulateRequest } from "../simulateRequest";
import "reflect-metadata";
simulateRequest('/users', 'GET');
simulateRequest('/users/3', 'GET');