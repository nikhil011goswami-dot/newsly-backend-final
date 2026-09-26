import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FcmTokenDto {
  @ApiProperty({
    example: 'fcm-device-token',
    description: 'Firebase Cloud Messaging device token',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token: string;
}
