import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiTranslationService {
  private readonly logger = new Logger(AiTranslationService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('openai.apiKey') });
    this.model  = this.configService.get<string>('openai.model', 'gpt-4-turbo-preview');
  }

  async translateArticle(
    title: string,
    content: string,
    targetLanguage: string,
    sourceLanguage = 'English',
  ): Promise<{ title: string; content: string; summary: string }> {
    const prompt = `You are a professional news translator. Translate the following news article from ${sourceLanguage} to ${targetLanguage}.

Maintain the journalistic tone, preserve named entities (people, places, organizations), and keep all factual information accurate.

Return a JSON object with keys: "title", "content", "summary" (a 2-3 sentence summary in the target language).

Title: ${title}

Content: ${content}`;

    const response = await this.openai.chat.completions.create({
      model:    this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: this.configService.get<number>('openai.maxTokens', 2048),
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      title:   result.title   || title,
      content: result.content || content,
      summary: result.summary || '',
    };
  }
}
