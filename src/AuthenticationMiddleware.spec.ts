import {AuthenticationMiddleware} from './AuthenticationMiddleware';
import {RestForbiddenException} from './RestExceptions';

describe('AuthenticationMiddleware', () => {

    let service: AuthenticationMiddleware;

    beforeEach(() => {
        service = new AuthenticationMiddleware();
    });

    test('should throw an exception if not authenticated', () => {
        const nextMock = jest.fn();
        expect(() => {
            service.resolve()({}, {}, nextMock);
        }).toThrow(RestForbiddenException);
        expect(nextMock.mock.calls.length).toBe(0);
    });

    test('should set the request with the default authentication if there is the token header', () => {
        const nextMock = jest.fn();
        const request = {headers: {'x-api_key': 'some value'}, auth: undefined};
        service.resolve()(request, {}, nextMock);
        expect(nextMock.mock.calls.length).toBe(1);
        expect(request.auth).toBe(AuthenticationMiddleware.defaultTokenAuth);
    });
});