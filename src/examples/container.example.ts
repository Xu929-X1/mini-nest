// This file is an example of how the DI container works. 
import "reflect-metadata";
import { container } from "../container";
function Injectable() {
    return function (target: any) {
        const dependencies = Reflect.getMetadata('design:paramtypes', target);
        console.log('Dependencies for', target.name, ':', dependencies);
        container.register(target, dependencies || []);
    };
}
@Injectable()
class Logger {
    log(msg: string) {
        console.log('[Logger]', msg);
    }
}
@Injectable()
class UserService {
    constructor(private logger: Logger) {

    }

    hello() {
        this.logger.log('Hello from UserService');
    }
}

const c = container;
const service = c.resolve(UserService);
service.hello();

