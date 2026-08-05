import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID Token from Flutter / mobile client' })
  @IsString()
  idToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;
}
