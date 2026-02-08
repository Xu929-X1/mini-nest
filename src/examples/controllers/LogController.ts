import { Controller } from '../../controller';
import { Injectable } from '../../injectable';
import { OnAppBootstrap, OnAppShutdown } from '../../lifecycle';
import { Log } from '../../log/log';
import { Get } from '../../request/createMethodDecorator';
import { UseInterceptor } from '../../request/interceptor';
import { LoggerInterceptor } from '../interceptors/LoggerInterceptor';
@Injectable()
@Controller('/log')
@UseInterceptor(LoggerInterceptor)
export class LogController implements OnAppBootstrap, OnAppShutdown {
    onAppBootstrap() {
        Log.info('[LogController] Log controller has been initialized');
    }


    @Get('/test')
    test() {
        Log.info('[Handler] Executing');
        return { ok: true };
    }

    onAppShutdown() {
        Log.info('[LogController] Log controller is shutting down');
    }
}