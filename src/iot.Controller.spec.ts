import {Test, TestingModule} from '@nestjs/testing';
import {IoTController} from './iotController';
import {INestApplication} from '@nestjs/common';
import {AppModule} from './app.module';
import request from 'supertest';
import {AuthenticationCredentials, AuthenticationType, IoTState, TimeCondition} from 'platform-domain';
import {IoTData, IoTSensor} from '../../platform-domain';

const defaultAuthentication = new AuthenticationCredentials('id', 'customerId',
    ['ROLE_ROOT'], AuthenticationType.TOKEN);

const anotherAuthentication = new AuthenticationCredentials('id', 'customerId2',
    ['ROLE_ROOT'], AuthenticationType.TOKEN);

const defaultIoTState0 = new IoTState('endpointID', 0, 10, 0);
const defaultIoTState1 = new IoTState('endpointID', 1, 11, 0);
const defaultIoTState2 = new IoTState('endpointID', 2, 12, 0);
const defaultIoTState3 = new IoTState('endpointID', 3, 13, 0);

const defaultIoTState0_anotherId = new IoTState('endpointID', 0, 10, 0,
    'id', 'customerId2');
const defaultIoTState1_anotherId = new IoTState('endpointID', 1, 11, 0,
    'id', 'customerId2');
const defaultIoTState2_anotherId = new IoTState('endpointID', 2, 12, 0,
    'id', 'customerId2');
const defaultIoTState3_anotherId = new IoTState('endpointID', 3, 13, 0,
    'id', 'customerId2');

const defaultIoTStates = [defaultIoTState0, defaultIoTState1, defaultIoTState2, defaultIoTState3];

const defaultIoTStatesAnotherId = [defaultIoTState0_anotherId,
    defaultIoTState1_anotherId, defaultIoTState2_anotherId, defaultIoTState3_anotherId];

const defaultIoTState1_new = new IoTState('endpointID', 1, 11, 0);
const defaultIoTState2_new = new IoTState('endpointID', 2, 12, 0);
const defaultIoTState3_new = new IoTState('endpointID', 3, 13, 0);

const updatedIoTStates = [defaultIoTState1_new, defaultIoTState2_new, defaultIoTState3_new];

const defaultIoTData0 = new IoTData('endpointID', Date.now() - 10, 0, 10);
const defaultIoTData1 = new IoTData('endpointID', Date.now() - 9, 1, 9);
const defaultIoTData2 = new IoTData('endpointID', Date.now() - 8, 0, 8);
const defaultIoTData3 = new IoTData('endpointID', Date.now() - 7, 1, 7);

const defaultIoTData4 = new IoTData('endpointID', Date.now() - 6, 0, 6);
const defaultIoTData5 = new IoTData('endpointID', Date.now() - 5, 1, 5);
const defaultIoTData6 = new IoTData('endpointID', Date.now() - 4, 0, 4);
const defaultIoTData7 = new IoTData('endpointID', Date.now() - 3, 1, 3);

const defaultIoTData = [defaultIoTData0, defaultIoTData1, defaultIoTData2, defaultIoTData3];
const defaultIoTDataNew = [defaultIoTData4, defaultIoTData5, defaultIoTData6, defaultIoTData7];

describe('IoTController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [IoTController],
        }).compile();
    });

    let controller: IoTController;

    beforeEach(() => {
        controller = app.get<IoTController>(IoTController);
        controller.actualState = [];
        controller.actualData = new Map<string, Map<number, IoTData[]>>();
    });

    describe('getServerTime', () => {
        it('should return the current server time', () => {
            expect(controller.getServerTime().timeStamp).toBeLessThanOrEqual(Date.now() + 100);
            expect(controller.getServerTime().timeStamp).toBeGreaterThanOrEqual(Date.now() - 100);
        });
    });

    describe('getEndpointState', () => {
        it('should return only the states for the endpoint id related to the token', () => {
            controller.actualState = defaultIoTStates.concat(defaultIoTStatesAnotherId);
            const result = controller.getEndPointState(anotherAuthentication);
            expect(result.length).toBe(4);
            expect(result).toEqual(defaultIoTStatesAnotherId);
        });
    });

    describe('postEndPointState', () => {
        it('should return the received IoTState with the fields filled', () => {
            const result = controller.postEndPointState(defaultAuthentication, defaultIoTStates);
            expect(result.length).toBe(4);
            result.forEach((value, index) => {
                expect(value.endPointId).toBe(defaultIoTStates[index].endPointId);
                expect(value.actuatorId).toBe(defaultIoTStates[index].actuatorId);
                expect(value.value).toBe(defaultIoTStates[index].value);
                expect(value.customerId).toBe(defaultAuthentication.customerId);
                expect(value.id).not.toBeUndefined();
                expect(value.timestamp).toBeGreaterThanOrEqual(Date.now() - 100);
            });
        });

        it('should set the current IoTStates', () => {
            const postResult = controller.postEndPointState(defaultAuthentication, defaultIoTStates);
            const getResult = controller.getEndPointState(defaultAuthentication);
            expect(getResult).toEqual(postResult);
        });

        it('should only update the received IoTStates keeping the others', () => {
            controller.postEndPointState(defaultAuthentication, defaultIoTStates);
            const updatedResult = controller.postEndPointState(defaultAuthentication, updatedIoTStates);
            const getResult = controller.getEndPointState(defaultAuthentication);
            expect(getResult).toEqual([defaultIoTState0].concat(updatedResult));
        });

        it('should not overwrite the same actuators from another endpoints', () => {
            const postResult = controller.postEndPointState(defaultAuthentication, defaultIoTStates);
            const anotherEndpointStates = defaultIoTStates
                .map((value) => Object.assign({}, value))
                .map((value) => {
                    value.endPointId = 'anotherEndpointID';
                    return value;
                });
            const anotherEndpointResult = controller.postEndPointState(anotherAuthentication, anotherEndpointStates);
            expect(controller.actualState.length).toBe(8);
            expect(controller.actualState).toEqual(postResult.concat(anotherEndpointResult));
        });
    });

    describe('PostEndPointData', () => {
        it('should return the received data with the fields filled', () => {
            const result = controller.postEndpointData(defaultAuthentication, defaultIoTData);
            expect(result.length).toBe(4);
            result.forEach((value, index) => {
                expect(value.endPointId).toBe(defaultIoTData[index].endPointId);
                expect(value.sensorId).toBe(defaultIoTData[index].sensorId);
                expect(value.timestamp).toBe(defaultIoTData[index].timestamp);
                expect(value.value).toBe(defaultIoTData[index].value);
                expect(value.customerId).toBe(defaultAuthentication.customerId);
                expect(value.id).not.toBeUndefined();
            });
        });

        it('should persist the received data ordered by timestamp desc', () => {
            controller.postEndpointData(defaultAuthentication, defaultIoTData);
            expect(controller.actualData.get(defaultIoTData0.endPointId).get(defaultIoTData0.sensorId))
                .toEqual([defaultIoTData2, defaultIoTData0]);
            expect(controller.actualData.get(defaultIoTData1.endPointId).get(defaultIoTData1.sensorId))
                .toEqual([defaultIoTData3, defaultIoTData1]);
        });

        it('should not overwrite the old data', () => {
            controller.postEndpointData(defaultAuthentication, defaultIoTData);
            controller.postEndpointData(defaultAuthentication, defaultIoTDataNew);
            expect(controller.actualData.get(defaultIoTData0.endPointId).get(defaultIoTData0.sensorId))
                .toEqual([defaultIoTData6, defaultIoTData4, defaultIoTData2, defaultIoTData0]);
            expect(controller.actualData.get(defaultIoTData1.endPointId).get(defaultIoTData1.sensorId))
                .toEqual([defaultIoTData7, defaultIoTData5, defaultIoTData3, defaultIoTData1]);
        });
    });
});

describe('IotController E2E', () => {
    let app: INestApplication;
    let controller: IoTController;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            modules: [AppModule],
            controllers: [IoTController],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    beforeEach(() => {
        controller = app.get<IoTController>(IoTController);
        controller.actualState = [];
        controller.actualData = new Map<string, Map<number, IoTData[]>>();
    });

    describe('getServerTime', () => {
        it('GET /api/iot/v1/server should not be allowed unauthenticated', (done) => {
            return request(app.getHttpServer())
                .get('/api/v1/iot/server')
                // .expect(403)
                .expect(403, (err, res) => {
                    expect(res.body.message).toBe('Forbidden');
                    expect(res.body.statusCode).toBe(403);
                    done();
                });
        });

        it('GET /api/v1/iot/server should return the timestamp', (done) => {
            return request(app.getHttpServer())
                .get('/api/iot/v1/server')
                .set('x-api_key', 'token')
                .expect(200)
                .end((err, res) => {
                    expect(res.body.timeStamp).toBeLessThanOrEqual(Date.now() + 100);
                    expect(res.body.timeStamp).toBeGreaterThanOrEqual(Date.now() - 100);
                    done();
                });
        });
    });

    describe('getEndPointState', () => {
        it('GET /api/iot/v1/state should return [] if the EndPoints does not have anything', (done) => {
            return request(app.getHttpServer())
                .get('/api/iot/v1/state')
                .set('x-api_key', 'token')
                .expect(200)
                .end((err, res) => {
                    expect(res.body).toEqual([]);
                    done();
                });
        });
    });

    describe('getEndPointData', () => {
        it('GET /api/iot/v1/data/:endPointId/sensor/:sensorId should return [] if there is no data for the endpoint', (done) => {
            return request(app.getHttpServer())
                .get('/api/iot/v1/data/some_id/sensor/1')
                .set('x-api_key', 'token')
                .expect(200)
                .end((err, res) => {
                    expect(res.body).toEqual([]);
                    done();
                });
        });

        it('GET /api/iot/v1/data/:endPointId/sensor/:sensorId should return [] if there is no data for the endpoint', (done) => {
            controller.actualData.set('some_id', new Map<number, IoTData[]>());
            return request(app.getHttpServer())
                .get('/api/iot/v1/data/some_id/sensor/1')
                .set('x-api_key', 'token')
                .expect(200)
                .end((err, res) => {
                    expect(res.body).toEqual([]);
                    done();
                });
        });

        it('GET /api/iot/v1/data/:endPointId/sensor/:sensorId should return the correct data', (done) => {
            const result = controller.postEndpointData(defaultAuthentication, defaultIoTData);
            return request(app.getHttpServer())
                .get('/api/iot/v1/data/endpointID/sensor/1')
                .set('x-api_key', 'token')
                .expect(200)
                .end((err, res) => {
                    expect(res.body).toEqual([result[3], result[1]]);
                    expect(result[3].timestamp > result[1].timestamp).toBeTruthy();
                    done();
                });
        });
    });

    describe('getEndPointSensors', () => {
        it('GET /api/iot/v1/sensors/:endPointId should return [] if the customer does not exists', (done) => {
            return request(app.getHttpServer())
                .get('/api/iot/v1/sensors/endpoint')
                .set('x-api_key', 'token')
                .expect(404)
                .end((err, res) => {
                    expect(res.body.message).toEqual('CUSTOMER_NOT_FOUND');
                    done();
                });
        });

        it('GET /api/iot/v1/sensors/:endPointId should return [] if the endpoint does not exists', (done) => {
            controller.actualSensor.set('customerId', new Map<string, IoTSensor[]>());
            return request(app.getHttpServer())
                .get('/api/iot/v1/sensors/endpoint')
                .set('x-api_key', 'token')
                .expect(404)
                .end((err, res) => {
                    expect(res.body.message).toEqual('ENDPOINT_NOT_FOUND');
                    done();
                });
        });
    });

    describe('isInTimeRange', () => {

        const defaultCondition = new TimeCondition('endPointId', 1, 0,
            '08:00-17:00');

        const weekDayCondition = new TimeCondition('endPointId', 1, 0,
            '08:00-17:00', [1, 2, 3, 4, 5]);

        const monthCondition = new TimeCondition('endPointId', 1, 0,
            '08:00-17:00', undefined, [1, 2, 3, 4, 5, 6]);

        const dayCondition = new TimeCondition('endPointId', 1, 0,
            '08:00-17:00', undefined, undefined, [1, 2, 3, 4, 5, 24]);

        it('should return true when in the hour is in range', () => {
            const date = new Date('2018-06-24T15:24:00');
            const result = controller.isInTimeRange(defaultCondition, date);
            expect(result).toBeTruthy();
        });

        it('should return false when in the hour is out of range', () => {
            const date = new Date('2018-06-24T05:24:00');
            const result = controller.isInTimeRange(defaultCondition, date);
            expect(result).toBeFalsy();
        });

        it('should return true when in the week day is in range', () => {
            const date = new Date('2018-06-25T15:24:00');
            const result = controller.isInTimeRange(weekDayCondition, date);
            expect(result).toBeTruthy();
        });

        it('should return false when in the week day is out of range', () => {
            const date = new Date('2018-06-24T15:24:00');
            const result = controller.isInTimeRange(weekDayCondition, date);
            expect(result).toBeFalsy();
        });

        it('should return true when in the month is in range', () => {
            const date = new Date('2018-06-24T15:24:00');
            const result = controller.isInTimeRange(monthCondition, date);
            expect(result).toBeTruthy();
        });

        it('should return false when in the month is out of range', () => {
            const date = new Date('2018-08-24T15:24:00');
            const result = controller.isInTimeRange(monthCondition, date);
            expect(result).toBeFalsy();
        });

        it('should return true when in the day is in range', () => {
            const date = new Date('2018-06-24T15:24:00');
            const result = controller.isInTimeRange(dayCondition, date);
            expect(result).toBeTruthy();
        });

        it('should return false when in the day is out of range', () => {
            const date = new Date('2018-08-25T15:24:00');
            const result = controller.isInTimeRange(dayCondition, date);
            expect(result).toBeFalsy();
        });
    });
});