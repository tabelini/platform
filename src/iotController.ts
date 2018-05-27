import {Roles} from './webutils/Guards';
import {Body, Controller, Get, Logger, Param, Post} from '@nestjs/common';
import {ApiBearerAuth, ApiModelProperty, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {IoTState, AuthenticationCredentials, IoTSensor, TimeCondition, SensorCondition} from 'platform-domain';
import {Auth} from './webutils/RouteParamDecorators';
import {v4 as uuid} from 'uuid';
import {IoTData, IoTOperator} from '../../platform-domain/src/IoT';
import {RestNotFoundException} from './RestExceptions';

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
    actualSensor = new Map<string, Map<string, IoTSensor[]>>();
    actualTimeCondition = new Map<string, TimeCondition[]>();
    actualSensorCondition: SensorCondition[] = [];

    @ApiOperation({title: 'Server Time', description: 'Returns the server time in epoch'})
    @ApiResponse({status: 200, type: TimeResponse})
    @Roles('ROLE_ENDPOINT', 'ROLE_ADMIN')
    @Get('/server')
    getServerTime(): TimeResponse {
        return new TimeResponse(Date.now());
    }

    @ApiOperation({title: 'Get the EndPoints state', description: 'Returns the required states for the endpoints'})
    @Get('/state')
    @Roles('ROLE_ENDPOINT', 'ROLE_ADMIN')
    getEndPointState(@Auth() auth: AuthenticationCredentials): IoTState[] {
        const now = Date.now();
        const result = this.actualState
            .filter((state) => state.customerId === auth.customerId);
        result.forEach((state) => {
            const requestedCondition = this.actualSensorCondition
                .find((condition) => {
                    // console.log(`Testing condition:${JSON.stringify(condition)}`);
                    // console.log(`Testing endPointId:${condition.endPointId === state.endPointId}`);
                    // console.log(`Testing actuatorId:${condition.actuatorId === state.actuatorId}`);
                    // console.log(`Testing time:${(condition.lastTimeOn + condition.latchTime * 1000) > now}`);
                    return (condition.endPointId === state.endPointId
                        && condition.actuatorId === state.actuatorId
                        && (condition.lastTimeOn + condition.latchTime * 1000) > now);
                });
            console.log(`Found condition:${JSON.stringify(requestedCondition)}`);
            if (requestedCondition) {
                state.value = requestedCondition.value;
            }
        });
        return result;
    }

    @ApiOperation({title: 'Set the Endpoints state', description: 'Returns the posted states'})
    @Post('/state')
    @Roles('ROLE_ADMIN')
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

    @ApiOperation({title: 'Get the expected sensors', description: 'Returns the expected sensors for the endpoints'})
    @Get('/sensors/:endPointId')
    @Roles('ROLE_ENDPOINT', 'ROLE_ADMIN')
    getEndPointSensors(@Auth() auth: AuthenticationCredentials, @Param('endPointId') endpointId: string): IoTSensor[] {
        const customerEndpoints = this.actualSensor.get(auth.customerId);
        if (!customerEndpoints) throw new RestNotFoundException('CUSTOMER_NOT_FOUND');
        const endpointSensors = customerEndpoints.get(endpointId);
        if (!endpointSensors) throw new RestNotFoundException('ENDPOINT_NOT_FOUND');
        return endpointSensors;
    }

    @ApiOperation({title: 'Set the Endpoints sensors', description: 'Returns the posted sensors'})
    @Post('/sensors/:endPointId')
    @Roles('ROLE_ADMIN')
    postEndPointSensor(@Auth() auth: AuthenticationCredentials, @Param('endPointId') endpointId: string,
                       @Body() sensors: IoTSensor[]): IoTSensor[] {
        sensors.forEach((value) => {
            value.customerId = auth.customerId;
            value.id = uuid();
        });
        let customerSensors = this.actualSensor.get(auth.customerId);
        if (!customerSensors) {
            customerSensors = new Map<string, IoTSensor[]>();
            this.actualSensor.set(auth.customerId, customerSensors);
        }
        customerSensors.set(endpointId, sensors);
        return sensors;
    }

    @ApiOperation({title: 'Get the data for an given Endpoint', description: 'Returns the latest data for a given endpoint'})
    @Get('/data/:endPointId/sensor/:sensorId')
    @Roles('ROLE_ADMIN')
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
    @Roles('ROLE_ENDPOINT', 'ROLE_ADMIN')
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
            this.processSensorCondition(val);
        });
        return data;
    }

    @ApiOperation({title: 'Gets all the sensor conditions', description: 'Returns all the SensorConditions for the customer'})
    @Get('/sensor_condition')
    @Roles('ROLE_ENDPOINT', 'ROLE_ADMIN')
    getSensorCondition(@Auth() auth: AuthenticationCredentials): SensorCondition[] {
        return this.actualSensorCondition.filter((value) => value.customerId === auth.customerId);
    }

    @ApiOperation({title: 'Set the sensor condition', description: 'Returns the posted states'})
    @Post('/sensor_condition/endpoint/:endPointId')
    @Roles('ROLE_ADMIN')
    postSensorCondition(@Auth() auth: AuthenticationCredentials, @Body() conditions: SensorCondition[],
                        @Param('endPointId') endPointId: string): SensorCondition[] {
        conditions.forEach((value) => {
            value.endPointId = endPointId;
            value.customerId = auth.customerId;
            value.id = uuid();
            value.timestamp = Date.now();
        });
        this.actualSensorCondition = this.actualSensorCondition
            .filter(condition => {
                return (condition.endPointId !== condition.endPointId);
            });
        this.actualSensorCondition = this.actualSensorCondition.concat(conditions);
        return this.actualSensorCondition;
    }

    processSensorCondition(data: IoTData) {
        this.actualSensorCondition.forEach(condition => {
            if (condition.sensorEndPointId === data.endPointId && condition.sensorId === data.sensorId) {
                if (condition.operator === IoTOperator.GREATER_THAN) {
                    if (data.value <= condition.referenceValues[0]) return;
                } else if (condition.operator === IoTOperator.LESS_THAN) {
                    if (data.value >= condition.referenceValues[0]) return;
                }
                condition.lastTimeOn = Date.now();
            }
        });
    }
}
