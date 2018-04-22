import {Get, Controller, Logger} from '@nestjs/common';
import {AuthenticationCredentials} from 'platform-domain';
import {Auth} from './webutils/RouteParamDecorators';
import {ApiBearerAuth, ApiOperation, ApiUseTags} from '@nestjs/swagger';
import {Roles} from './webutils/Guards';

@ApiUseTags('Root')
@ApiBearerAuth()
@Controller('/api/v1/')
export class AppController {

    readonly log = new Logger('RootController');

    @ApiOperation({title: 'Api Information', description: 'Returns the api information'})
    @Roles('ROLE_ADMIN')
    @Get()
    apiInformation(@Auth() authentication: AuthenticationCredentials): any {
        return {
            name: 'Platform API',
            version: process.env.npm_package_version,
            auth: authentication,
        };
    }
}