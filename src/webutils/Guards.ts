import {CanActivate, ExecutionContext, Guard, ReflectMetadata} from '@nestjs/common';
import {Observable} from 'rxjs/Observable';
import {Reflector} from '@nestjs/core';
import {User} from 'platform-domain';
import {isNullOrUndefined} from 'util';

export const Roles = (...roles: string[]) => ReflectMetadata('roles', roles);

@Guard()
export class RolesGuard implements CanActivate {

    constructor(private readonly reflector: Reflector) {
    }

    canActivate(req, context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.handler);
        if (!roles) {
            return true;
        }
        const user: User = req.user;
        return !isNullOrUndefined(user) && user.hasAnyRole(roles);
    }
}