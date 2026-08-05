import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Global PrismaService with:
 *  - Exponential-backoff reconnect on startup (handles k8s/Docker race conditions)
 *  - Clean disconnect on module destroy (graceful shutdown)
 *  - Query slow-log via Prisma event
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /** Slow-query threshold in ms — log warn if exceeded */
  private static readonly SLOW_QUERY_MS = 2000;

  constructor() {
    super({
      log: [
        { level: 'warn',  emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'query', emit: 'event' },
      ],
    });

    // Warn on slow queries
    (this as any).$on('query', (e: { duration: number; query: string }) => {
      if (e.duration >= PrismaService.SLOW_QUERY_MS) {
        this.logger.warn(
          `Slow query (${e.duration} ms): ${e.query.slice(0, 200)}`,
        );
      }
    });

    // Surface DB-level errors/warnings
    (this as any).$on('warn',  (e: { message: string }) => this.logger.warn(e.message));
    (this as any).$on('error', (e: { message: string }) => this.logger.error(e.message));
  }

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected (graceful shutdown)');
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Retry with exponential back-off.
   * Handles the window where the DB container is still starting (Docker Compose,
   * Kubernetes init containers, Railway cold starts, etc.).
   */
  private async connectWithRetry(
    retries = 6,
    baseDelayMs = 1500,
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('✅  Database connected');
        return;
      } catch (err: any) {
        const isLast = attempt === retries;
        const delay  = baseDelayMs * Math.pow(2, attempt - 1); // 1.5 s, 3 s, 6 s …

        if (isLast) {
          this.logger.error(
            `❌  Database connection failed after ${retries} attempts`,
            err?.message,
          );
          throw err;
        }

        this.logger.warn(
          `Database connection attempt ${attempt}/${retries} failed — retrying in ${delay} ms`,
        );
        await this.sleep(delay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
