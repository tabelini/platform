import {MiddlewaresConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {AppController} from './app.controller';
import {AuthenticationMiddleware} from './AuthenticationMiddleware';
import {HealthController} from './health.controller';
import {RolesGuard} from './webutils/Guards';

@Module({
    imports: [],
    controllers: [AppController, HealthController],
    components: [RolesGuard],
})
export class AppModule implements NestModule {

    public configure(consumer: MiddlewaresConsumer): void {
        consumer
            .apply(AuthenticationMiddleware)
            .forRoutes({path: '/api/*', method: RequestMethod.ALL});
    }
}
