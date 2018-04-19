import {AuthenticationMiddleware} from './AuthenticationMiddleware';
import {RestForbidenException} from './RestExceptions';

describe('AuthenticationMiddleware', () => {

    let service: AuthenticationMiddleware;

    beforeEach(() => {
        service = new AuthenticationMiddleware();
    });

    test('should throw an exception if not authenticated ', () => {
        const nextMock = jest.fn();
        expect(() => {
            service.resolve()({}, {}, nextMock);
        }).toThrow(RestForbidenException);
        expect(nextMock.mock.calls.length).toBe(0);
    });
});