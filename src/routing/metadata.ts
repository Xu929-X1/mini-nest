import { Constructor } from '../core/container/container';
import { RouteMetadataType, routeRegistryTrie } from './routeRegistry';
import { ParamMetadata } from './paramTypes';
import {
  Interceptor,
} from '../interceptor/applyInterceptor';
import { HttpMethod } from '../http/httpRequest';
import { ClassOrPrototype } from '../interceptor/UseInterceptor';
import { GUARDS, INTERCEPTORS, PARAMS } from './metadataKeys';
import { Guard } from '../guards/guard';
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
    return PARAMS.getOrDefault(controller, [], methodName);
  },

  // 🟥 Interceptor Metadata
  getClassInterceptors(controller: Constructor): Constructor<Interceptor>[] {
    return INTERCEPTORS.get(controller) ?? [];
  },

  getMethodInterceptors(
    controller: Constructor,
    method: string
  ): Constructor<Interceptor>[] {
    return INTERCEPTORS.get(controller, method) ?? [];
  },

  getClassGuards(controller: Constructor): Constructor<Guard>[] {
    return GUARDS.getOrDefault(controller, []);
  },

  getMethodGuards(controller: Constructor, method: string): Constructor<Guard>[] {
    return GUARDS.getOrDefault(controller.prototype, [], method);
  },

  // 🧹 Optional Cleanup
  clearAll() {
    routeRegistryTrie.clear();
  },

};
