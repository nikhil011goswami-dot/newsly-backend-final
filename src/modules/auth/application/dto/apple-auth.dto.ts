import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class AppleAuthDto {
  @ApiProperty({ description: 'Apple Identity Token from Flutter / mobile client' })
  @IsString()
  identityToken: string;

  @ApiPropertyOptional({ description: 'Full name — only provided on first sign-in by Apple' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;
}
