import { Injectable } from '../../injectable';
import { LoggerService } from './LoggerService';

@Injectable()
export class UserService {
    constructor(private logger: LoggerService) { }

    getUsers() {
        this.logger.log('Fetching users...');
        return ['Alice', 'Bob', 'Charlie'];
    }
}