import { Constructor } from '../core/container/container';
import { RouteMetadataType, routeRegistryTrie } from './routeRegistry';
import { ParamMetadata, paramRegistry } from './paramRegistry';
import {
  Interceptor,
  classInterceptors,
  methodInterceptors,
} from '../decorators/interceptor';
import { HttpMethod } from '../http/httpRequest';
const routeMetaData = new Map<Constructor, RouteMetadataType[]>();
export const metadata = {
  // 🟦 Route Metadata
  getRoute(method: HttpMethod, url: string): RouteMetadataType | undefined {
    return routeRegistryTrie.findRoute(method, url)?.route;
  },

  registerRoute(route: RouteMetadataType) {
    routeRegistryTrie.addRoute(route.method as HttpMethod, route);
  },

  registerRouteOnMethodDecoratorLoad(controller: Constructor, url: string, method: HttpMethod, handlerName: string) {
    const route = routeMetaData.get(controller) || [];
    const newRoute: RouteMetadataType = {
      method,
      url,
      handlerName,
      controllerClass: controller,
    };
    route.push(newRoute);
    routeMetaData.set(controller, route);
  },

  finalizeRouteOnControllerLoad(
    controller: Constructor,
    baseUrl: string
  ) {
    const routes = routeMetaData.get(controller);
    if (!routes) {
      throw new Error(`No routes found for controller ${controller.name}`);
    }
    for (const route of routes) {
      if (route.url.startsWith('/')) {
        route.fullUrl = baseUrl + route.url;
      } else {
        route.fullUrl = baseUrl + '/' + route.url;
      }
      this.registerRoute(route);
    }
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
    routeRegistryTrie.clear();
    paramRegistry.clear();
    classInterceptors.clear();
    methodInterceptors.clear();
  },
};
