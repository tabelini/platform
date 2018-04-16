import {ExpressMiddleware, NestMiddleware} from '@nestjs/common';

export class AuthenticationMiddleware implements NestMiddleware {
    resolve(...args: any[]): ExpressMiddleware {
        return ((req: Request, res, next) => {
            next();
        });
    }
}