import {HttpException, HttpStatus} from '@nestjs/common';

export class RestForbiddenException extends HttpException{
    constructor(msg = 'Forbidden'){
        super(msg, HttpStatus.FORBIDDEN);
    }
}