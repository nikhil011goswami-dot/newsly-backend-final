import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class RefreshTokenDto {
  @ApiProperty()
  @Transform(({ obj, key }) => obj[key], { toClassOnly: true })
  @IsString()
  refreshToken: string;
}
