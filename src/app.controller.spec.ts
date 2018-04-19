import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppController } from './app.controller';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
  });

  describe('root', () => {
    it('should return the name and version of the Api"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.root().name).toEqual('Platform API');
      expect(appController.root().version).toEqual(process.env.npm_package_version);
    });
  });
});
