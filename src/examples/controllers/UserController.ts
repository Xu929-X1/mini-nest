import { Controller } from "../../controller";
import { Get } from "../../createMethodDecorator";
import { Param, Query } from "../../createParamDecorator";
import { UserService } from "../services/UserService";


@Controller('/users')
export class UserController {
    constructor(private userService: UserService) { }

    @Get('/')
    getAll() {
        return this.userService.getUsers();
    }

    @Get('/:id')
    getUser(@Param('id') id: string, @Query('verbose') v: string) {
        if (v === 'true') {
            return this.userService.getVerboseUser(id);
        } else {
            return this.userService.getUserById(id);
        }
    }
}