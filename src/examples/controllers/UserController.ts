import { Controller } from "../../controller";
import { Get, Post } from "../../createMethodDecorator";
import { Body, Header, Param, Query } from "../../createParamDecorator";
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

    @Post('/:id')
    createUser(
        @Param('id') id: number,
        @Query('expand') expand: string,
        @Body('name') name: string,
        @Header('authorization') token: string
    ) {
        console.log('Injected parameters:', { id, expand, name, token });
        return this.userService.createUser(id, name, expand, token);
    }
}