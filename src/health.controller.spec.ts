import {Test, TestingModule} from '@nestjs/testing';
import {HealthController} from './health.controller';

describe('AppController', () => {
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