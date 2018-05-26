import {ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {Controller, Get, Param} from '@nestjs/common';
import {TimeResponse} from './iotController';
import {RestNotFoundException} from './RestExceptions';
import uuid = require('uuid');
import {Auth} from './webutils/RouteParamDecorators';
import {AuthenticationCredentials} from 'platform-domain';

@ApiUseTags('Auth')
@Controller('/api/auth/v1')
export class AuthController {

    @ApiOperation({title: 'Gateway API KEY', description: 'Returns the gateway API key according to the Id'})
    @ApiResponse({status: 200, type: TimeResponse})
    @Get('/gateway_key/:gatewayId')
    getGatewayKey(@Param('gatewayId') gatewayId): any {
        if (gatewayId === 'aabbccddeeff') return {key: 'gateway_key'};
        else throw new RestNotFoundException('GATEWAY_NOT_FOUND');
    }

    @ApiOperation({title: 'Gets the Authentication TOKEN', description: 'Returns the authentication token'})
    @ApiResponse({status: 200})
    @Get('/token')
    getToken(@Auth() auth: AuthenticationCredentials): any {
        return {token: `${auth.id}:${uuid.v4()}`};
    }
}