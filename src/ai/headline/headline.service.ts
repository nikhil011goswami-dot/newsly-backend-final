import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiHeadlineService {
  private readonly logger = new Logger(AiHeadlineService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('openai.apiKey') });
  }

  async generateHeadlines(content: string, count = 3): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model:    this.configService.get<string>('openai.model', 'gpt-4-turbo-preview'),
      messages: [
        { role: 'system', content: `You are a professional news headline writer. Generate ${count} compelling, accurate, and SEO-friendly headlines. Return a JSON object with key "headlines" containing an array of strings.` },
        { role: 'user',   content: `Generate headlines for:\n\n${content.substring(0, 1000)}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
    });
    const result = JSON.parse(response.choices[0].message.content || '{"headlines":[]}');
    return Array.isArray(result.headlines) ? result.headlines : [];
  }
}
