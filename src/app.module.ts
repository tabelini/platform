import {MiddlewaresConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import {AppController} from './app.controller';
import {AuthenticationMiddleware} from './AuthenticationMiddleware';

@Module({
    imports: [],
    controllers: [AppController],
    components: [],
})
export class AppModule implements NestModule {

    public configure(consumer: MiddlewaresConsumer): void {
        consumer
            .apply(AuthenticationMiddleware)
            .forRoutes({path: '/api/*', method: RequestMethod.ALL});
    }
}
