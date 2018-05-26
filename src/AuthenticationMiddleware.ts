import {ExpressMiddleware, Logger, Middleware, NestMiddleware} from '@nestjs/common';
import {AuthenticationCredentials, AuthenticationType} from 'platform-domain';
import {RestForbiddenException} from './RestExceptions';
import * as basicAuth from 'basic-auth';
import {UserService} from './UserService';

@Middleware()
export class AuthenticationMiddleware implements NestMiddleware {

    static readonly apiKeyHeader = 'x-api_key';

    static readonly defaultTokenAuth = new AuthenticationCredentials('id', 'customerId',
        ['ROLE_ROOT'], AuthenticationType.TOKEN);
    static readonly limitedTokenAuth = new AuthenticationCredentials('id2', 'customerId2',
        ['ROLE_USER'], AuthenticationType.TOKEN);

    static readonly defaultUserAuth = new AuthenticationCredentials('id', 'customerId',
        ['ROLE_ROOT'], AuthenticationType.USER);
    static readonly limitedUserAuth = new AuthenticationCredentials('id2', 'customerId2',
        ['ROLE_USER'], AuthenticationType.USER);

    static isAuthNotRequired(url: string) {
        if (url.startsWith('/api/auth/v1/gateway_key/')) return true;
        return false;
    }

    constructor(private us: UserService) {

    }

    readonly logger = new Logger('AuthenticationMiddleware');

    resolve(...args: any[]): ExpressMiddleware {
        return (async (req, res, next) => {
            if (AuthenticationMiddleware.isAuthNotRequired(req.url)) next();
            else {
                if (req.headers) {
                    const apiKey = req.headers[AuthenticationMiddleware.apiKeyHeader];
                    if (apiKey) {
                        req.auth = AuthenticationMiddleware.defaultTokenAuth;
                    } else {
                        if (req.headers.authorization) {
                            const auth = basicAuth(req);
                            const user = await this.us.findByUsernameAndPassword(auth.name, auth.pass);
                            // console.log(`User: ${JSON.stringify(user)}`);
                            if (user) {
                                req.auth = new AuthenticationCredentials(user.id, user.customerId, user.roles, AuthenticationType.USER);
                            }
                        }
                    }
                }
                if (!req.auth) throw new RestForbiddenException();
                next();
            }
        });
    }

}