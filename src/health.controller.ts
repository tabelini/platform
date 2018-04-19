import {Controller, Get} from '@nestjs/common';
import {ApiOperation} from '@nestjs/swagger';

@Controller('/health')
export class HealthController {

    @ApiOperation({title: 'Returns App Health'})
    @Get()
    root(): any {
        return {status: 'UP'};
    }
}