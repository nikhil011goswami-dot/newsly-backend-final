import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiTagService {
  private readonly logger = new Logger(AiTagService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('openai.apiKey') });
  }

  async generateTags(title: string, content: string): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model:    this.configService.get<string>('openai.model', 'gpt-4-turbo-preview'),
      messages: [
        { role: 'system', content: 'You are a news categorization expert. Generate 5-10 relevant tags for the news article. Return a JSON object with key "tags" containing an array of lowercase strings.' },
        { role: 'user',   content: `Generate tags for:\n\nTitle: ${title}\n\nContent: ${content.substring(0, 1000)}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });
    const result = JSON.parse(response.choices[0].message.content || '{"tags":[]}');
    return Array.isArray(result.tags) ? result.tags : [];
  }
}
