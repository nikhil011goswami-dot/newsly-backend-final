import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { BookmarkService } from '../../application/services/bookmark.service';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post(':articleId')
  addBookmark(@Req() req: any, @Param('articleId') articleId: string) {
    return this.bookmarkService.addBookmark(req.user.id, articleId);
  }

  @Delete(':articleId')
  removeBookmark(@Req() req: any, @Param('articleId') articleId: string) {
    return this.bookmarkService.removeBookmark(req.user.id, articleId);
  }

  @Get()
  getMyBookmarks(@Req() req: any) {
    return this.bookmarkService.getMyBookmarks(req.user.id);
  }

  @Get(':articleId/status')
  isBookmarked(@Req() req: any, @Param('articleId') articleId: string) {
    return this.bookmarkService.isBookmarked(req.user.id, articleId);
  }
}
