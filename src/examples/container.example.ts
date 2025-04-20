// This file is an example of how the DI container works. 
import "reflect-metadata";
import { container } from "../container";
import { Injectable } from "../injectable";
import { LoggerService } from "./services/LoggerService";


@Injectable()
class UserService {
    constructor(private logger: LoggerService) {

    }

    hello() {
        this.logger.log('Hello from UserService');
    }
}

const c = container;
const service = c.resolve(UserService);
service.hello();

