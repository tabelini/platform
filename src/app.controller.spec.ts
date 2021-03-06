import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {AppController} from './app.controller';
import {AuthenticationCredentials, AuthenticationType} from 'platform-domain';
import {AppModule} from './app.module';
import request from 'supertest';

describe('AppController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [AppController],
        }).compile();
    });

    describe('root', () => {
        const defaultAuth = new AuthenticationCredentials('id', 'customerId', ['ROLE_ROOT', 'ROLE_ADMIN'],
            AuthenticationType.TOKEN);
        it('should return the name and version of the Api"', () => {
            const appController = app.get<AppController>(AppController);
            expect(appController.apiInformation(defaultAuth).name).toEqual('Platform API');
            expect(appController.apiInformation(defaultAuth).version).toEqual(process.env.npm_package_version);
        });
    });
});

describe('AppController E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            modules: [AppModule],
            controllers: [AppController],
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
