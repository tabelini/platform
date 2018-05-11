import {Logger, MiddlewaresConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {AppController} from './app.controller';
import {AuthenticationMiddleware} from './AuthenticationMiddleware';
import {HealthController} from './health.controller';
import {RolesGuard} from './webutils/Guards';
import {IoTController} from './iotController';
import {UserService} from './UserService';
import {AuthController} from './auth.Controller';

@Module({
    imports: [],
    controllers: [AppController, HealthController, IoTController, AuthController],
    components: [RolesGuard, UserService],
})
export class AppModule implements NestModule {

    public configure(consumer: MiddlewaresConsumer): void {
        consumer
            .apply(AuthenticationMiddleware)
            .forRoutes({path: '/api/*', method: RequestMethod.ALL});
    }
}
