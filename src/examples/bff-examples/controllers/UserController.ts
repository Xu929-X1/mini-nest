import { Controller } from "../../../decorators/Controller";
import { Get, Post } from "../../../decorators/CreateMethodDecorator";
import { Body, Param } from "../../../decorators/CreateParamDecorator";
import { UserService } from "../services/UserService";

@Controller('/api/users')
export class UserController {
    constructor(private userService: UserService) { }

    @Get('/:id')
    async getUser(@Param('id') id: string) {
        return this.userService.getUser(id);
    }

    @Get('/:id/profile')
    async getProfile(@Param('id') id: string) {
        return this.userService.getUserProfile(id);
    }

    @Post('/')
    async createUser(@Body() body: any) {
        return this.userService.createUser(body);
    }
}