import { Interceptor } from '../../request/interceptor';

export class LoggerInterceptor implements Interceptor {
    async intercept(next: () => Promise<any>) {
        console.log('[Logger] Before handler');
        const result = await next();
        console.log('[Logger] After handler', result);
        return result;
    }
}       