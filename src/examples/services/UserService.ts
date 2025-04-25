import { Injectable } from '../../injectable';
import { LoggerService } from './LoggerService';

@Injectable()
export class UserService {
    constructor(private logger: LoggerService) { }

    getUsers() {
        this.logger.log('Fetching users...');
        return ['Alice', 'Bob', 'Charlie'];
    }

    getUserById(id: string) {
        this.logger.log(`Fetching user with id: ${id}`);
        return { id, name: 'Alice' };
    }

    getVerboseUser(id: string) {
        this.logger.log(`Fetching verbose user with id: ${id}`);
        return { id, name: 'Alice', age: 30, email: 'example@example.com' };
    }

}