import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { _ } from 'lodash';
@Injectable()
export class IdMissing implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata) {
    const ObjectId = require('mongoose').Types.ObjectId;
    if (!_.isUndefined(value)) {
      if (ObjectId.isValid(value)) {
        if (String(new ObjectId(value)) === value) {
          return value;
        }
      }
    }
    throw new HttpException(
      {
        status: HttpStatus.ACCEPTED,
        error: `Missing or invalid parameter ${metadata.data}.`,
      },
      HttpStatus.ACCEPTED,
    );
  }
}
