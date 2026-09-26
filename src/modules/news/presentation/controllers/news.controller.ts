import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { NewsLanguage, NewsStatus, UserRole } from "@prisma/client";

import { S3Service } from "@infrastructure/storage/s3.service";

import { Public } from "@common/decorators/public.decorator";
import { Roles } from "@common/decorators/roles.decorator";
import { ParseCuidPipe } from "@common/pipes/parse-cuid.pipe";
import { JwtAuthGuard } from "@modules/auth/presentation/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@modules/auth/presentation/guards/optional-jwt-auth.guard";
import { RequestWithUser } from "@common/types";
import { RolesGuard } from "@modules/auth/presentation/guards/roles.guard";

import { CreateNewsDto } from "../../application/dto/create-news.dto";
import { NewsFeedDto } from "../../application/dto/news-feed.dto";
import { UpdateNewsDto } from "../../application/dto/update-news.dto";
import { NewsService } from "../../application/services/news.service";


@ApiTags('News')
@Controller({ path: 'news', version: '1' })
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get paginated news feed' })
  @ApiResponse({ status: 200, description: 'News feed returned' })
  getFeed(
    @Query() query: NewsFeedDto,
    @Req() req: RequestWithUser,
  ) {
    return this.newsService.getFeed(query, req.user?.id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get news article by slug' })
  @ApiResponse({ status: 200, description: 'News article returned' })
  @ApiResponse({ status: 404, description: 'News article not found' })
  getBySlug(@Param('slug') slug: string) {
    return this.newsService.getBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get news article by ID' })
  @ApiResponse({ status: 200, description: 'News article returned' })
  @ApiResponse({ status: 404, description: 'News article not found' })
  getById(@Param('id', ParseCuidPipe) id: string) {
    return this.newsService.getById(id);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
    required: ['file'],
  },
})
  @UseInterceptors(
  FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
  }),
)
  @ApiOperation({ summary: 'Upload news media to S3' })
  @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or missing file' })
  @ApiResponse({ status: 403, description: 'Editor or admin access required' })
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP images and MP4 videos are allowed',
      );
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException('File size must not exceed 50MB');
    }

    const folder = file.mimetype.startsWith('video/')
      ? 'news/videos/'
      : 'news/images/';

    return this.s3Service.upload(
      file.buffer,
      folder,
      file.mimetype,
      file.originalname,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a news article' })
  @ApiResponse({ status: 201, description: 'News article created' })
  @ApiResponse({ status: 403, description: 'Editor or admin access required' })
  @ApiResponse({ status: 409, description: 'News article slug already exists' })
  create(@Body() dto: CreateNewsDto, @Req() req: any) {
    return this.newsService.create({
      ...dto,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      authorId: req.user.id,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a news article' })
  @ApiResponse({ status: 200, description: 'News article updated' })
  @ApiResponse({ status: 403, description: 'Editor or admin access required' })
  @ApiResponse({ status: 404, description: 'News article not found' })
  @ApiResponse({ status: 409, description: 'News article slug already exists' })
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.newsService.update(id, {
      ...dto,
      publishedAt:
        dto.publishedAt !== undefined
          ? dto.publishedAt
            ? new Date(dto.publishedAt)
            : null
          : undefined,
      scheduledAt:
        dto.scheduledAt !== undefined
          ? dto.scheduledAt
            ? new Date(dto.scheduledAt)
            : null
          : undefined,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete a news article' })
  @ApiResponse({ status: 200, description: 'News article deleted' })
  @ApiResponse({ status: 403, description: 'Editor or admin access required' })
  @ApiResponse({ status: 404, description: 'News article not found' })
  delete(@Param('id', ParseCuidPipe) id: string) {
    return this.newsService.delete(id);
  }

  @Post(':id/view')
  @Public()
  @ApiOperation({ summary: 'Increment article view count' })
  @ApiResponse({ status: 200, description: 'View count incremented' })
  @ApiResponse({ status: 404, description: 'News article not found' })
  incrementView(@Param('id', ParseCuidPipe) id: string) {
    return this.newsService.incrementViewCount(id);
  }
}
