import { Module } from '@nestjs/common';
import { AiTranslationService } from './translation/translation.service';
import { AiSummaryService } from './summarization/summary.service';
import { AiTagService } from './tagging/tag.service';
import { AiHeadlineService } from './headline/headline.service';

@Module({
  providers: [AiTranslationService, AiSummaryService, AiTagService, AiHeadlineService],
  exports:   [AiTranslationService, AiSummaryService, AiTagService, AiHeadlineService],
})
export class AiModule {}
