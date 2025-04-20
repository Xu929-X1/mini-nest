import { Injectable } from "../../injectable";

@Injectable()
class LoggerService {
    log(msg: string) {
        console.log('[LoggerService]', msg);
    }
}

export { LoggerService };