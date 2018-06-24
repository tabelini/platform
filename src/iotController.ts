import {Roles} from './webutils/Guards';
import {Body, Controller, Delete, Get, Logger, Param, Post} from '@nestjs/common';
import {ApiBearerAuth, ApiModelProperty, ApiOperation, ApiResponse, ApiUseTags} from '@nestjs/swagger';
import {IoTState, AuthenticationCredentials, IoTSensor, TimeCondition, SensorCondition, IoTData, IoTOperator, EndPoint} from 'platform-domain';
import {Auth} from './webutils/RouteParamDecorators';
import {v4 as uuid} from 'uuid';
import {RestForbiddenException, RestNotFoundException} from './RestExceptions';
import {isNullOrUndefined} from 'util';

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
    actualEndPoints = new Map<string, EndPoint>();
    actualTimeCondition: TimeCondition[] = [];
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
            const requestedSensorCondition = this.actualSensorCondition
                .find((condition) => {
                    return (condition.endPointId === state.endPointId
                        && condition.actuatorId === state.actuatorId
                        && (condition.lastTimeOn + condition.latchTime * 1000) > now);
                });
            if (requestedSensorCondition) {
                state.value = requestedSensorCondition.value;
            } else {
                const requestedTimeCondition = this.actualTimeCondition
                    .find((condition) => {
                        return (condition.endPointId === state.endPointId
                            && condition.actuatorId === state.actuatorId
                            && this.isInTimeRange(condition, new Date()));
                    });
                if (requestedTimeCondition) {
                    state.value = requestedTimeCondition.value;
                } else {
                    state.value = state.defaultValue;
                }
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

    @ApiOperation({title: 'Set the sensor condition', description: 'Returns the posted sensor conditions'})
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

    @ApiOperation({title: 'Gets all the time conditions', description: 'Returns all the TimeConditions for the endPoint'})
    @Get('/time_condition/endpoint/:endPointId')
    @Roles('ROLE_ENDPOINT', 'ROLE_ADMIN')
    getTimeCondition(@Auth() auth: AuthenticationCredentials, @Param('endPointId') endPointId: string): TimeCondition[] {
        return this.actualTimeCondition.filter((value) => value.endPointId === endPointId);
    }

    @ApiOperation({title: 'Set the time condition', description: 'Returns the posted sensor conditions'})
    @Post('/time_condition/endpoint/:endPointId')
    @Roles('ROLE_ADMIN')
    postTimeCondition(@Auth() auth: AuthenticationCredentials, @Body() conditions: TimeCondition[],
                      @Param('endPointId') endPointId: string): TimeCondition[] {
        conditions.forEach((value) => {
            value.endPointId = endPointId;
            value.customerId = auth.customerId;
            value.id = uuid();
            value.timestamp = Date.now();
        });
        this.actualTimeCondition = this.actualTimeCondition
            .filter(condition => {
                return (condition.endPointId !== condition.endPointId);
            });
        this.actualTimeCondition = this.actualTimeCondition.concat(conditions);
        return this.actualTimeCondition;
    }

    @ApiOperation({title: 'Gets all the EndPoints', description: 'Returns all the EndPoints'})
    @Get('/endpoint')
    @Roles('ROLE_ADMIN')
    getEndPoints(@Auth() auth: AuthenticationCredentials): EndPoint[] {
        const customerEndPoints: EndPoint[] = [];
        this.actualEndPoints.forEach((endPoint, key) => {
            if (endPoint.customerId === auth.customerId) customerEndPoints.push(endPoint);
        });
        return customerEndPoints;
    }

    @ApiOperation({title: 'Gets and EndPoint', description: 'Returns the endpoint with the given id'})
    @Get('/endpoint/:endPointId')
    @Roles('ROLE_ADMIN')
    getEndPoint(@Auth() auth: AuthenticationCredentials, @Param('endPointId') endPointId: string): EndPoint {
        const endPoint = this.actualEndPoints.get(endPointId);
        if (endPoint) {
            if (endPoint.customerId !== auth.customerId) {
                throw  new RestForbiddenException('WRONG_CUSTOMER_ID');
            }
            return endPoint;
        } else {
            throw new RestNotFoundException('NOT_FOUND');
        }
    }

    @ApiOperation({title: 'Post an EndPoint', description: 'Creates a new endPoint'})
    @Post('/endpoint')
    @Roles('ROLE_ADMIN')
    createEndPoint(@Auth() auth: AuthenticationCredentials, @Body() endPoint: EndPoint): EndPoint {
        endPoint.timestamp = Date.now();
        endPoint.customerId = auth.customerId;
        endPoint.id = uuid();
        this.actualEndPoints.set(endPoint.id, endPoint);
        return endPoint;
    }

    @ApiOperation({title: 'Deletes an EndPoint', description: 'Deletes and EndPoint with the given Id'})
    @Delete('/endpoint/:endPointId')
    @Roles('ROLE_ADMIN')
    deleteEndPoint(@Auth() auth: AuthenticationCredentials, @Param('endPointId') endPointId: string): EndPoint {
        const endPoint = this.actualEndPoints.get(endPointId);
        if (endPoint) {
            if (endPoint.customerId !== auth.customerId) {
                throw  new RestForbiddenException('WRONG_CUSTOMER_ID');
            }
            this.actualEndPoints.delete(endPointId);
            return endPoint;
        } else {
            throw new RestNotFoundException('NOT_FOUND');
        }
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

    isInTimeRange(condition: TimeCondition, date: Date): boolean {
        return this.isHourInRange(date, condition.timeRange) && this.isWeekDayInRange(date, condition.weekDays)
            && this.isMonthInRange(date, condition.months) && this.isDayInRange(date, condition.days);
    }

    isHourInRange(date: Date, timeRange: string): boolean {
        const times = timeRange.split('-');
        const startTime = times[0].split(':');
        const endTime = times[1].split(':');
        const startDate = new Date(date.getTime());
        startDate.setHours(parseInt(startTime[0], 10), parseInt(startTime[1], 10), 0, 0);
        const endDate = new Date(date.getTime());
        endDate.setHours(parseInt(endTime[0], 10), parseInt(endTime[1], 10));
        return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
    }

    isWeekDayInRange(date: Date, weekDays: number[]): boolean {
        if (isNullOrUndefined(weekDays)) {
            return true;
        }
        const weekDay = date.getDay();
        const found = weekDays.find((day) => day === weekDay);
        return !isNullOrUndefined(found);
    }

    isMonthInRange(date: Date, months: number[]): boolean {
        if (isNullOrUndefined(months)) {
            return true;
        }
        const month = date.getMonth();
        const found = months.find((day) => day === month);
        return !isNullOrUndefined(found);
    }

    isDayInRange(date: Date, days: number[]): boolean {
        if (isNullOrUndefined(days)) {
            return true;
        }
        const dayNumber = date.getDate();
        const found = days.find((day) => day === dayNumber);
        return !isNullOrUndefined(found);
    }
}
