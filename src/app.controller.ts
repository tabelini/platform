import {Get, Controller, Req} from '@nestjs/common';
import {User} from 'platform-domain';
import {CurrentUser} from './webutils/RouteParamDecorators';
import {Roles} from './webutils/Guards';

@Controller('/api/v1/')
export class AppController {

    @Roles('ROLE_ADMIN')
    @Get()
    root(@CurrentUser() currentUser: User): any {
        return {
            name: 'Platform API',
            version: process.env.npm_package_version,
            user: currentUser,
        };
    }
}