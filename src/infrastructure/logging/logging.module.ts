import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@config/winston.config';

@Global()
@Module({
  imports:  [WinstonModule.forRoot(winstonConfig)],
  exports:  [WinstonModule],
})
export class LoggingModule {}
