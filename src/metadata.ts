import { Constructor } from "./container";
import { RouteRecord, routeRegistry } from "./routeRegistry";
import { ParamMetadata, paramRegistry } from "./paramRegistry";
import {
  Interceptor,
  classInterceptors,
  methodInterceptors,
} from "./interceptor";

export const metadata = {
  // 🟦 Route Metadata
  getRoutes(controller: Constructor, url: string): RouteRecord[] {
    return routeRegistry.get(controller, url) || [];
  },

  registerRoute(controller: Constructor, route: RouteRecord) {
    const routes = routeRegistry.get(controller) || [];
    routes.push(route);
    routeRegistry.set(controller, routes);
  },

  // 🟨 Parameter Metadata
  getParams(controller: Constructor, methodName: string): ParamMetadata[] {
    return paramRegistry.get(controller)?.get(methodName) || [];
  },

  registerParam(
    controller: Constructor,
    methodName: string,
    param: ParamMetadata
  ) {
    if (!paramRegistry.has(controller)) {
      paramRegistry.set(controller, new Map());
    }
    const methodParams = paramRegistry.get(controller)!;
    const list = methodParams.get(methodName) || [];
    list[param.index] = param; // index-safe
    methodParams.set(methodName, list);
  },

  // 🟥 Interceptor Metadata
  getClassInterceptors(controller: Constructor): Constructor<Interceptor>[] {
    return classInterceptors.get(controller) || [];
  },

  getMethodInterceptors(
    controller: Constructor,
    method: string
  ): Constructor<Interceptor>[] {
    return methodInterceptors.get(controller)?.get(method) || [];
  },

  registerClassInterceptor(
    controller: Constructor,
    interceptor: Constructor<Interceptor>
  ) {
    const list = classInterceptors.get(controller) || [];
    list.push(interceptor);
    classInterceptors.set(controller, list);
  },

  registerMethodInterceptor(
    controller: Constructor,
    method: string,
    interceptor: Constructor<Interceptor>
  ) {
    if (!methodInterceptors.has(controller)) {
      methodInterceptors.set(controller, new Map());
    }
    const methodMap = methodInterceptors.get(controller)!;
    const list = methodMap.get(method) || [];
    list.push(interceptor);
    methodMap.set(method, list);
  },

  // 🧹 Optional Cleanup
  clearAll() {
    routeRegistry.clear();
    paramRegistry.clear();
    classInterceptors.clear();
    methodInterceptors.clear();
  },
};