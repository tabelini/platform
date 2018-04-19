import {ExpressMiddleware, NestMiddleware} from '@nestjs/common';
import {RestForbidenException} from './RestExceptions';
import {User} from 'platform-domain';

export class AuthenticationMiddleware implements NestMiddleware {
    defaultRootUser = new User('userId', 'customerId', 'root', 'root@email.com',
        '', ['ROLE_ROOT']);

    resolve(...args: any[]): ExpressMiddleware {
        return ((req, res, next) => {
            req.user = this.defaultRootUser;
            // throw new RestForbidenException();
            next();
        });
    }
}