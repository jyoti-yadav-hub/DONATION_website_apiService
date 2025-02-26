import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { _ } from 'lodash';
@Injectable()
export class ParamMissing implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata) {
    if (!_.isUndefined(value)) {
      return value;
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
