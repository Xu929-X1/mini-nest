import { Controller } from "../../controller";
import { Get } from "../../createMethodDecorator";
import { Param } from "../../createParamDecorator";
import { UserService } from "../services/UserService";


@Controller('/users')
export class UserController {
    constructor(private userService: UserService) { }

    @Get('/')
    getAll() {
        return this.userService.getUsers();
    }

    @Get('/:id')
    getById(@Param('id') id: string) {
        return this.userService.getUserById(id);
    }
}