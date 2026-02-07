import { Injectable } from "../../injectable";
import { Log } from "../../log/log";

@Injectable()
class LoggerService {
    log(msg: string) {
        Log.info(`[LoggerService] ${msg}`);
    }
}

export { LoggerService };