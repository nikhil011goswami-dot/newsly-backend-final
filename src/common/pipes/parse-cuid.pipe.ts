import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^c[a-z0-9]{24}$/.test(value)) {
      throw new BadRequestException(`${value} is not a valid CUID`);
    }
    return value;
  }
}
