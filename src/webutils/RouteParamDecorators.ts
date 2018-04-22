import { createRouteParamDecorator } from '@nestjs/common';

export const Auth = createRouteParamDecorator((data, req) => {
    return req.auth;
});