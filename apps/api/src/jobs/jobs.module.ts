import { Module } from '@nestjs/common';
import { PluginModule } from '@sherlock/plugin';
import { ALL_SOURCE_MODULES } from '@sherlock/plugin-sources';
import { AnalyticsModule } from '@sherlock/analytics';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsResolver } from './jobs.resolver';

@Module({
  imports: [
    PluginModule,
    ...ALL_SOURCE_MODULES,
    AnalyticsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsResolver],
  exports: [JobsService],
})
export class JobsModule {}
