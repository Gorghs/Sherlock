import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { AppCacheModule } from './cache/cache.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';

import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { DbModule } from './db/db.module';
import { ApiKeyGuard } from './auth/api-key.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
  imports: [
    // Global config (loads .env)
    AppConfigModule,

    // Rate limiting (configurable via env vars)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: (config.get<number>('rateLimit.timeframeSec', 3600)) * 1000,
            limit: config.get<number>('rateLimit.maxRequests', 100),
          },
        ],
        // Skip throttling when disabled
        skipIf: () => !config.get<boolean>('rateLimit.enabled', false),
      }),
    }),

    // GraphQL API (alongside REST)
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        autoSchemaFile: true,
        sortSchema: true,
        playground: config.get<boolean>('graphql.playground', true),
        path: config.get<string>('graphql.path', 'graphql'),
        introspection: true,
        // Disable GraphQL module entirely if env var is set
        ...(config.get<boolean>('graphql.enabled', true) ? {} : { autoSchemaFile: false }),
      }),
    }),

    // Global cache (Redis or in-memory)
    AppCacheModule,

    // Health endpoints
    HealthModule,

    // Job scraping
    JobsModule,

    // Job scheduler & notifications
    SchedulerModule,
    NotificationsModule,
    AiModule,
    DbModule,

    // Metrics tracking
    MetricsModule,


  ],
  providers: [
    // Global API key guard
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
    // Global rate limit guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global metrics tracking
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    // Global request logging
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
