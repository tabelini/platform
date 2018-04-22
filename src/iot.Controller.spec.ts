import {Test, TestingModule} from '@nestjs/testing';
import {IoTController} from './iotController';
import {INestApplication} from '@nestjs/common';
import {AppModule} from './app.module';
import request from 'supertest';

describe('IoTController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [IoTController],
        }).compile();
    });

    describe('getServerTime', () => {
        // const defaultAuth = new AuthenticationCredentials('id', 'customerId', ['ROLE_ROOT', 'ROLE_ADMIN'],
        //     AuthenticationType.TOKEN);
        it('should return the current server time', () => {
            const controller = app.get<IoTController>(IoTController);
            expect(controller.getServerTime().timeStamp).toBeLessThanOrEqual(Date.now() + 100);
            expect(controller.getServerTime().timeStamp).toBeGreaterThanOrEqual(Date.now() - 100);
        });
    });
});

describe('IotController E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            modules: [AppModule],
            controllers: [IoTController],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('GET /api/v1/ should not be allowed unauthenticated', (done) => {
        return request(app.getHttpServer())
            .get('/api/v1')
            // .expect(403)
            .expect(403, (err, res) => {
                expect(res.body.message).toBe('Forbidden');
                expect(res.body.statusCode).toBe(403);
                done();
            });
    });

    it('GET /api/v1/ should return the Api version', (done) => {
        return request(app.getHttpServer())
            .get('/api/v1')
            .set('x-api_key', 'token')
            .expect(200)
            .end((err, res) => {
                expect(res.body.name).toBe('Platform API');
                expect(res.body.version).toBe(process.env.npm_package_version);
                done();
            });
    });
});