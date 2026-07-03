import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ValidatePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (Number.isNaN(parseInt(value))){
      throw new BadRequestException(`accept only number>>>> ${metadata.data}`)
    }
    return typeof value === 'number' ? value * 2 : parseInt(value) * 2;
  }
}


