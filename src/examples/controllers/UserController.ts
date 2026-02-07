// src/examples/controllers/UserController.ts
import { Controller } from "../../controller";
import { ExecutionContext } from "../../request/core/ExecutionContext";
import { Get, Post } from "../../request/createMethodDecorator";
import { Body, Header, Param, Query } from "../../request/createParamDecorator";
import { rule } from "../../request/validation/rule";
import { OnBeforeHandle, OnAfterHandle, OnHandleError } from "../../lifecycle";
import { UserService } from "../services/UserService";

@Controller('/users')
export class UserController implements OnBeforeHandle, OnAfterHandle, OnHandleError {
    constructor(private userService: UserService) { }

    onBeforeHandle(ctx: ExecutionContext) {
        console.log(`[UserController] onBeforeHandle: ${ctx.getRequest().method} ${ctx.getRequest().path}`);
    }

    onAfterHandle(ctx: ExecutionContext, result: unknown) {
        console.log(`[UserController] onAfterHandle: result =`, result);
    }

    onHandleError(ctx: ExecutionContext, error: Error) {
        console.log(`[UserController] onHandleError: ${error.message}`);
    }

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
        @Body({
            key: 'name',
            validator: rule().required().minLength(3).maxLength(50)
        }) name: string,
        @Header('authorization') token: string
    ) {
        return this.userService.createUser(id, name, expand, token);
    }

    @Get('/error')
    throwError() {
        throw new Error('Test error from handler');
    }
}