import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsLanguage, NewsStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ example: 'AI is transforming the future of technology' })
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  title: string;

  @ApiProperty({ example: 'ai-transforming-future-technology' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug may only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'A brief overview of how AI is changing technology.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({ example: 'Artificial intelligence is rapidly changing...' })
  @IsString()
  @MinLength(20)
  content: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/ai.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  sourceUrl?: string;

  @ApiPropertyOptional({ example: 'Reuters' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  source?: string;

  @ApiPropertyOptional({ enum: NewsLanguage, default: NewsLanguage.EN })
  @IsOptional()
  @IsEnum(NewsLanguage)
  language?: NewsLanguage;

  @ApiPropertyOptional({ enum: NewsStatus, default: NewsStatus.DRAFT })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @ApiPropertyOptional({ example: ['AI', 'Technology', 'Innovation'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 5, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  readingTimeMinutes?: number;

  @ApiPropertyOptional({ example: '2026-09-07T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ example: '2026-09-07T20:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ example: 'cmrxhh1fy0002fxefvzzcda04' })
  @IsString()
  categoryId: string;
}
