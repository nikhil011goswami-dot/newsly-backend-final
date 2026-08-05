import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('openai.apiKey') });
  }

  async generateSummary(title: string, content: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model:    this.configService.get<string>('openai.model', 'gpt-4-turbo-preview'),
      messages: [
        { role: 'system', content: 'You are a professional news editor. Generate concise, accurate summaries of news articles in 2-3 sentences. Focus on the most important facts: who, what, when, where, why.' },
        { role: 'user',   content: `Summarize this article:\n\nTitle: ${title}\n\nContent: ${content}` },
      ],
      max_tokens: 200,
    });
    return response.choices[0].message.content?.trim() || '';
  }
}
