import { Get, Controller } from '@nestjs/common';

@Controller('/api/v1/')
export class AppController {
  @Get()
  root(): string {
    return 'Hello World!';
  }
}
