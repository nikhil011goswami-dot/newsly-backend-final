import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional, IsString, MaxLength, MinLength,
  Matches, IsArray, ArrayMaxSize, IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SUPPORTED_LANGUAGES } from '@common/constants';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane Doe', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'janedoe', minLength: 3, maxLength: 30 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, { message: 'Username may only contain lowercase letters, numbers, and underscores' })
  username?: string;

  @ApiPropertyOptional({ example: 'News enthusiast from Mumbai.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'en', enum: SUPPORTED_LANGUAGES.map((l) => l.toLowerCase()) })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES.map((l) => l.toLowerCase()))
  preferredLanguage?: string;

  @ApiPropertyOptional({ type: [String], example: ['technology', 'science'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @Transform(({ value }) => (Array.isArray(value) ? value.map(String) : []))
  preferredCategories?: string[];
}
