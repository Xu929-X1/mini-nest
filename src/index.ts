// Core
export { createMiniNestApp, App } from './core/app/App';
export type { AppOptions, HTTPAdapter } from './core/app/App';
export { Container } from './core/container/container';
export type { Constructor } from './core/container/container';
export { ExecutionContext } from './core/pipeline/ExecutionContext';
export type { RouteMetadata } from './core/pipeline/ExecutionContext';

// Decorators
export {
    // HTTP
    Controller,
    Get, Post, Put, Delete, Patch, Options, Head,
    Body, Query, Param, Header,
    // AOP
    Cache,
    Retry,
    Timeout,
    CircuitBreaker,
    // DI
    Injectable,
    // Guards & Interceptors
    UseGuard,
    UseInterceptor,
} from './decorators';
export type { CacheOptions, CircuitBreakerOptions } from './decorators';

// HTTP
export { HttpClient } from './http/client/httpClient';
export type {
    RequestOptions,
    HttpClientResponse,
    AggregateOption,
    AggregateResult,
} from './http/client/httpClient';
export { HttpRequest } from './http/HttpRequest';
export type { RawRequest, HttpMethod } from './http/HttpRequest';
export { HttpResponse } from './http/HttpResponse';

// Exceptions
export {
    BaseHTTPException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    InternalServerErrorException,
    NotImplementedException,
    BadGatewayException,
    ValidationException,
    DefaultExceptionFilter,
    ExceptionHandler,
    exceptionHandler,
} from './exceptions';
export type {
    HttpExceptionResponse,
    ExceptionFilter,
    ValidationError,
} from './exceptions';

// Guards & Interceptors
export type { Guard } from './guards/Guard';
export type { Interceptor } from './interceptors/Interceptor';

// Lifecycle
export type {
    OnInit,
    OnDestroy,
    OnAppBootstrap,
    OnAppShutdown,
    OnBeforeHandle,
    OnAfterHandle,
    OnHandleError,
} from './lifecycle/lifecycle';

// Validation
export { rule, RuleBuilder } from './validation/rule';
export type { Validator, ValidatorRule } from './validation/rule';

// Circuit Breaker
export { CircuitOpenError } from './circuitBreaker/circuitOpenError';