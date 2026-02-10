import { Constructor } from '../core/container/container';
import { RouteMetadataType, routeRegistryTrie } from './routeRegistry';
import { ParamMetadata, paramRegistry } from './paramRegistry';
import {
  Interceptor,
  INTERCEPTOR_KEY,
} from '../interceptor/applyInterceptor';
import { HttpMethod } from '../http/httpRequest';
import { GUARD_KEY } from '../guards/guard';
import { ClassOrPrototype } from '../interceptor/UseInterceptor';
//temp hash map
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
    routeMetaData.delete(controller); //clear the temp hash map after load
  },

  // 🟨 Parameter Metadata
  getParams(controller: Constructor, methodName: string): ParamMetadata[] {
    return paramRegistry.get(controller)?.get(methodName) || [];
  },

  // 🟥 Interceptor Metadata
  getClassInterceptors(controller: Constructor): Constructor<Interceptor>[] {
    return Reflect.getMetadata(INTERCEPTOR_KEY, controller) || [];
  },

  getMethodInterceptors(
    controller: Constructor,
    method: string
  ): Constructor<Interceptor>[] {
    return Reflect.getMetadata(INTERCEPTOR_KEY, controller.prototype, method) || [];

  },

  registerMethodInterceptor(
    target: ClassOrPrototype,
    propertyKey: string,
    interceptor: Constructor<Interceptor>
  ) {
    const existing = Reflect.getMetadata(INTERCEPTOR_KEY, target, propertyKey) || [];
    Reflect.defineMetadata(INTERCEPTOR_KEY, [...existing, interceptor], target, propertyKey);
  },

  registerClassInterceptor(target: ClassOrPrototype, interceptor: Constructor<Interceptor>) {
    const existing = Reflect.getMetadata(INTERCEPTOR_KEY, target) || [];
    Reflect.defineMetadata(INTERCEPTOR_KEY, [...existing, interceptor], target);
  },

  registerMethodParam(target: ClassOrPrototype, propertyKey: string, params: ParamMetadata) {

  },

  registerClassParam(target: ClassOrPrototype, param: ParamMetadata) {

  },



  // 🧹 Optional Cleanup
  clearAll() {
    routeRegistryTrie.clear();
    paramRegistry.clear();
    this.deleteMetadataFromNamespace(INTERCEPTOR_KEY);
    this.deleteMetadataFromNamespace(GUARD_KEY)
  },

  deleteMetadataFromNamespace(name: string) {
  }
};
