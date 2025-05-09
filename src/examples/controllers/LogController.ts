import { Controller } from '../../controller';
import { Get } from '../../createMethodDecorator';
import { UseInterceptor } from '../../interceptor';
import { LoggerInterceptor } from '../interceptors/LoggerInterceptor';

@Controller('/log')
@UseInterceptor(LoggerInterceptor)
export class LogController {
    @Get('/test')
    test() {
        console.log('[Handler] Executing');
        return { ok: true };
    }
}