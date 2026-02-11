import { Constructor, Container } from "../core/container/container";
import { ExecutionContext } from "../core/pipeline/ExecutionContext";
import { ForbiddenException } from "../exceptions";
import { Guard } from "./guard";

export async function applyGuards(
    guards: Constructor<Guard>[],
    ctx: ExecutionContext
): Promise<void> {
    for (const guardClass of guards) {
        const instance = Container.instance.resolve<Guard>(guardClass);
        const result = await instance.canActivate(ctx);
        if (!result) {
            throw new ForbiddenException('Access denied');
        }
    }
}