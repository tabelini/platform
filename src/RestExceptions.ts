import {HttpException, HttpStatus} from '@nestjs/common';

export class RestForbiddenException extends HttpException{
    constructor(){
        super('Forbidden', HttpStatus.FORBIDDEN);
    }
}