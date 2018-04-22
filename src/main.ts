import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {RolesGuard} from './webutils/Guards';
import * as expressStatusMonitor from 'express-status-monitor';
import {Logger} from '@nestjs/common';

const logger = new Logger('ROOT');

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const rolesGuard = app.select(AppModule).get(RolesGuard);
    app.useGlobalGuards(rolesGuard);
    const options = new DocumentBuilder()
        .setTitle('Platform API')
        .setDescription('Platform API description')
        .setVersion('1.0')
        .addTag('platform')
        .addBearerAuth('X-API_KEY')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/api-docs', app, document);
    app.use(expressStatusMonitor());
    await app.listen(3000);
}

bootstrap().then(() => logger.log('---------------- Application Booted! ----------------'));
