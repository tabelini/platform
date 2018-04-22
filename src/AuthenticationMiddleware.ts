import {ExpressMiddleware, Logger, NestMiddleware} from '@nestjs/common';
import {AuthenticationCredentials, AuthenticationType} from 'platform-domain';
import {isNullOrUndefined} from 'util';
import {RestForbiddenException} from './RestExceptions';

export class AuthenticationMiddleware implements NestMiddleware {

    static readonly apiKeyHeader = 'x-api_key';

    static readonly defaultTokenAuth = new AuthenticationCredentials('id', 'customerId',
        ['ROLE_ROOT'], AuthenticationType.TOKEN);
    static readonly limitedTokenAuth = new AuthenticationCredentials('id2', 'customerId2',
        ['ROLE_USER'], AuthenticationType.TOKEN);

    readonly logger = new Logger('AuthenticationMiddleware');

    resolve(...args: any[]): ExpressMiddleware {
        return ((req, res, next) => {
            if (!isNullOrUndefined(req.headers)) {
                const apiKey = req.headers[AuthenticationMiddleware.apiKeyHeader];
                if (!isNullOrUndefined(apiKey)) req.auth = AuthenticationMiddleware.defaultTokenAuth;
            }
            if (isNullOrUndefined(req.auth)) throw new RestForbiddenException();
            next();
        });
    }
}