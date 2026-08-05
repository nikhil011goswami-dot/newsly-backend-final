import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host:                 this.configService.get<string>('redis.host', 'localhost'),
      port:                 this.configService.get<number>('redis.port', 6379),
      password:             this.configService.get<string>('redis.password') || undefined,
      db:                   this.configService.get<number>('redis.db', 0),
      retryStrategy:        (times) => Math.min(times * 50, 2000),
      enableReadyCheck:     true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect',     () => this.logger.log('Redis connected'));
    this.client.on('error',       (err) => this.logger.error('Redis error', err));
    this.client.on('reconnecting',() => this.logger.warn('Redis reconnecting'));
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try   { return JSON.parse(value) as T; }
    catch { return value as unknown as T;  }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(key: string): Promise<void>              { await this.client.del(key); }
  async exists(key: string): Promise<boolean>        { return (await this.client.exists(key)) === 1; }
  async expire(key: string, ttl: number): Promise<void> { await this.client.expire(key, ttl); }
  async incr(key: string): Promise<number>           { return this.client.incr(key); }
  async incrBy(key: string, n: number): Promise<number> { return this.client.incrby(key, n); }
  async ttl(key: string): Promise<number>            { return this.client.ttl(key); }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(...keys);
  }

  async hset(key: string, field: string, value: string): Promise<void> { await this.client.hset(key, field, value); }
  async hget(key: string, field: string): Promise<string | null>       { return this.client.hget(key, field); }
  async hdel(key: string, field: string): Promise<void>                { await this.client.hdel(key, field); }

  async sadd(key: string, ...members: string[]): Promise<void>  { await this.client.sadd(key, ...members); }
  async srem(key: string, ...members: string[]): Promise<void>  { await this.client.srem(key, ...members); }
  async smembers(key: string): Promise<string[]>                { return this.client.smembers(key); }

  async ping(): Promise<string>           { return this.client.ping(); }
  async onModuleDestroy(): Promise<void> { await this.client.quit(); }
  getClient(): Redis                     { return this.client; }
}
