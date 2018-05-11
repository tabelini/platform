import {HttpException, HttpStatus} from '@nestjs/common';

export class RestForbiddenException extends HttpException{
    constructor(msg = 'Forbidden'){
        super(msg, HttpStatus.FORBIDDEN);
    }
}

export class RestNotFoundException extends HttpException{
    constructor(msg = 'Not Found'){
        super(msg, HttpStatus.NOT_FOUND);
    }
}