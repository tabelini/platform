import {Roles} from './webutils/Guards';
import {Body, Controller, Get, Logger, Param, Post} from '@nestjs/common';
import {ApiBearerAuth, ApiModelProperty, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {IoTState, AuthenticationCredentials} from 'platform-domain';
import {Auth} from './webutils/RouteParamDecorators';
import {v4 as uuid} from 'uuid';
import {IoTData} from '../../platform-domain/src/IoT';

export class TimeResponse {
    constructor(timeStamp: number) {
        this.timeStamp = timeStamp;
    }

    @ApiModelProperty({description: 'Server time in epoch ms'})
    public timeStamp: number;
}

@ApiUseTags('IoT')
@ApiBearerAuth()
@Controller('/api/iot/v1')
export class IoTController {
    readonly log = new Logger('RootController');

    actualState: IoTState[] = [];
    actualData = new Map<string, Map<number, IoTData[]>>();

    @ApiOperation({title: 'Server Time', description: 'Returns the server time in epoch'})
    @ApiResponse({status: 200, type: TimeResponse})
    @Roles('ROLE_ENDPOINT', 'ROLE_ADMIN')
    @Get('/server')
    getServerTime(): TimeResponse {
        return new TimeResponse(Date.now());
    }

    @ApiOperation({title: 'Get the EndPoints state', description: 'Returns the required states for the endpoints'})
    @Get('/state')
    getEndPointState(@Auth() auth: AuthenticationCredentials): IoTState[] {
        return this.actualState.filter((value) => value.customerId === auth.customerId);
    }

    @ApiOperation({title: 'Set the Endpoints state', description: 'Returns the posted states'})
    @Post('/state')
    postEndPointState(@Auth() auth: AuthenticationCredentials, @Body() states: IoTState[]): IoTState[] {
        states.forEach((value) => {
            value.customerId = auth.customerId;
            value.id = uuid();
            value.timestamp = Date.now();
            this.actualState = this.actualState
                .filter(state => {
                    return (state.endPointId !== value.endPointId || state.actuatorId !== value.actuatorId);
                });
        });
        this.actualState = this.actualState.concat(states);
        return states;
    }

    @ApiOperation({title: 'Get the data for an given Endpoint', description: 'Returns the latest data for a given endpoint'})
    @Get('/data/:endPointId/sensor/:sensorId')
    getEndpointData(@Param('endPointId') endPointId: string, @Param('sensorId') sensorId: string): IoTData[] {
        const endPointData = this.actualData.get(endPointId);
        if (!endPointData) {
            this.log.warn(`No data for endpoint:'${endPointId}'`);
            return [];
        }
        const sensorData = endPointData.get(parseInt(sensorId, 10));
        if (!sensorData) {
            this.log.warn(`No data for sensor:'${endPointId}|${sensorId}'`);
            return [];
        }
        return sensorData;
    }

    @ApiOperation({title: 'Post data for an endpoint', description: 'Returns the data posted for an given endpoint'})
    @Post('/data')
    postEndpointData(@Auth() auth: AuthenticationCredentials, @Body() data: IoTData[]): IoTData[] {
        data.sort((prev, next) => prev.timestamp - next.timestamp);
        data.forEach((val) => {
            val.customerId = auth.customerId;
            val.id = uuid();
            let endpoint = this.actualData.get(val.endPointId);
            if (!endpoint) {
                endpoint = new Map<number, IoTData[]>();
                this.actualData.set(val.endPointId, endpoint);
            }
            let sensorData = endpoint.get(val.sensorId);
            if (!sensorData) {
                sensorData = [];
            }
            sensorData.unshift(val);
            endpoint.set(val.sensorId, sensorData);
        });
        return data;
    }
}
