import { createRouteParamDecorator } from '@nestjs/common';

export const CurrentUser = createRouteParamDecorator((data, req) => {
    return req.user;
});