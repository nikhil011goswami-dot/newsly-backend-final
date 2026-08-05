import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'rahul@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MyPassword@123' })
  @IsString()
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({ example: 'android' })
  @IsOptional()
  @IsString()
  platform?: string;
}
