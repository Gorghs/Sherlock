import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobSchedulerService } from './job-scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { JobFilterService } from './job-filter.service';
import { RuntimeConfigService } from './runtime-config.service';
import { SubagentMemoryService } from './subagent-memory.service';
import { ActivityLogService } from './activity-log.service';
import { SourceReliabilityService } from './source-reliability.service';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiModule } from '../ai/ai.module';
import { DbModule } from '../db/db.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    JobsModule,
    NotificationsModule,
    AiModule,
    DbModule,
  ],
  controllers: [SchedulerController],
  providers: [
    JobSchedulerService,
    JobFilterService,
    RuntimeConfigService,
    SubagentMemoryService,
    ActivityLogService,
    SourceReliabilityService,
  ],
  exports: [JobSchedulerService, RuntimeConfigService],
})
export class SchedulerModule {}
