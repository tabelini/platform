import {Test, TestingModule} from '@nestjs/testing';
import {HealthController} from './health.controller';
import {INestApplication} from '@nestjs/common';
import {AppModule} from './app.module';
import request from 'supertest';

describe('HealthController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [HealthController],
        }).compile();
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            const healthController = app.get<HealthController>(HealthController);
            expect(healthController.root()).toEqual({status: 'UP'});
        });
    });
});

describe('HealthController E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('GET /health should be allowed un authenticated and return UP', (done) => {
        return request(app.getHttpServer())
            .get('/health')
            // .expect(403)
            .expect(200, (err, res) => {
                expect(res.body.status).toBe('UP');
                done();
            });
    });
});