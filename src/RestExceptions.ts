import {HttpException, HttpStatus} from '@nestjs/common';

export class RestForbidenException extends HttpException{
    constructor(){
        super('Forbidden', HttpStatus.FORBIDDEN);
    }
}