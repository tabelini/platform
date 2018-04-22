import {Roles} from './webutils/Guards';
import {Controller, Get, Logger} from '@nestjs/common';
import {ApiBearerAuth, ApiModelProperty, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';

export class TimeResponse {
    constructor( timeStamp: number) {
        this.timeStamp = timeStamp;
    }

    @ApiModelProperty({description: 'Server time in epoch ms'})
    public timeStamp: number;
}

@ApiUseTags('IoT')
@ApiBearerAuth()
@Controller('/api/v1/iot')
export class IoTController {

    readonly log = new Logger('RootController');

    @ApiOperation({title: 'Server Time', description: 'Returns the server time in epoch'})
    @ApiResponse({status: 200, type: TimeResponse})
    @Roles('ROLE_ENDPOINT')
    @Get('/server')
    getServerTime(): TimeResponse {
        return new TimeResponse(Date.now());
    }
}
