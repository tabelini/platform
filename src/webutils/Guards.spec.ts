import {Reflector} from '@nestjs/core';
import {RolesGuard} from './Guards';
import {AuthenticationMiddleware} from '../AuthenticationMiddleware';
import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from '../app.module';
import {ExecutionContext} from '@nestjs/common';

describe('RolesGuard', () => {

    let app: TestingModule;

    const reflector = {
        get: (metadataKey, target) => [],
    };
    let guard: RolesGuard;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            modules: [AppModule],
            components: [RolesGuard],
        })
            .overrideComponent(Reflector).useValue(reflector)
            .compile();
    });

    beforeEach(() => {
        guard = app.select(AppModule).get(RolesGuard);
    });

    describe('canActivate', () => {
        const defaultRequest = {auth: AuthenticationMiddleware.defaultTokenAuth};
        const limitedRequest = {auth: AuthenticationMiddleware.limitedTokenAuth};
        const context: ExecutionContext = {parent: null, handler: null};

        it('should return true if there are no roles associated', () => {
            jest.spyOn(reflector, 'get').mockReturnValue(undefined);
            const result = guard.canActivate(null, context);
            expect(result).toBeTruthy();
        });

        it('should return true if authentication has the expected roles', () => {
            jest.spyOn(reflector, 'get').mockReturnValue(['ROLE_USER']);
            const result = guard.canActivate(limitedRequest, context);
            expect(result).toBeTruthy();
        });

        it('should return false if authentication do not have the expected roles', () => {
            jest.spyOn(reflector, 'get').mockReturnValue(['ROLE_NON_EXISTENT']);
            const result = guard.canActivate(limitedRequest, context);
            expect(result).toBeFalsy();
        });

        it('should return true if the authentication has the ROOT role', () => {
            jest.spyOn(reflector, 'get').mockReturnValue(['ROLE_NON_EXISTENT']);
            const result = guard.canActivate(defaultRequest, context);
            expect(result).toBeTruthy();
        });
    });
});