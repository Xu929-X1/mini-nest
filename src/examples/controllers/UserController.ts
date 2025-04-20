import { Controller } from "../../controller";
import { Get } from "../../createMethodDecorator";
import { UserService } from "../services/UserService";


@Controller('/users')
export class UserController {
    constructor(private userService: UserService) { }

    @Get('/')
    getAll() {
        return this.userService.getUsers();
    }
}