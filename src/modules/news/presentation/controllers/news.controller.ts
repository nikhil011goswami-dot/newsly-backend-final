import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { NewsLanguage, NewsStatus, UserRole } from "@prisma/client";

import { Public } from "@common/decorators/public.decorator";
import { Roles } from "@common/decorators/roles.decorator";
import { ParseCuidPipe } from "@common/pipes/parse-cuid.pipe";
import { JwtAuthGuard } from "@modules/auth/presentation/guards/jwt-auth.guard";
import { RolesGuard } from "@modules/auth/presentation/guards/roles.guard";

import { CreateNewsDto } from "../../application/dto/create-news.dto";
import { NewsFeedDto } from "../../application/dto/news-feed.dto";
import { UpdateNewsDto } from "../../application/dto/update-news.dto";
import { NewsService } from "../../application/services/news.service";


@ApiTags('News')
@Controller({ path: 'news', version: '1' })
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get paginated news feed' })
  @ApiResponse({ status: 200, description: 'News feed returned' })
  getFeed(@Query() query: NewsFeedDto) {
    return this.newsService.getFeed(query);
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
