import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

// Invalid ids / values and duplicates are client errors (400 / 409), not server errors
@Catch()
export class DatabaseExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception?.name === 'CastError') {
      return super.catch(new BadRequestException(`Invalid ${exception.path || 'value'}`), host);
    }
    if (exception?.name === 'ValidationError') {
      return super.catch(new BadRequestException(exception.message), host);
    }
    if (exception?.code === 11000) {
      return super.catch(new ConflictException('A record with this value already exists'), host);
    }
    return super.catch(exception, host);
  }
}
