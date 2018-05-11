import {ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {Controller, Get, Param} from '@nestjs/common';
import {TimeResponse} from './iotController';
import {Roles} from './webutils/Guards';
import {RestNotFoundException} from './RestExceptions';

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
}