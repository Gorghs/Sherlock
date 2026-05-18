import { Module } from '@nestjs/common';
import { SentJobsDatabase } from './sent-jobs.database';

@Module({
  providers: [SentJobsDatabase],
  exports: [SentJobsDatabase],
})
export class DbModule {}
