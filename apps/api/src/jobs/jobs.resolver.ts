import { Resolver, Query, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { Site } from '@sherlock/models';
import { JobsService } from './jobs.service';
import { CacheService } from '../cache/cache.service';
import {
  SearchJobsInput,
  SearchJobsResult,
  SourceListResult,
} from './gql-types';

/**
 * GraphQL resolver exposing the same job search functionality as the REST API.
 *
 * Endpoint: POST /graphql
 *
 * Example query:
 *   query {
 *     searchJobs(input: { searchTerm: "engineer", location: "New York" }) {
 *       count
 *       jobs { title companyName jobUrl location { city state } }
 *     }
 *   }
 */
@Resolver()
export class JobsResolver {
  private readonly logger = new Logger(JobsResolver.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly cacheService: CacheService,
  ) {}

  @Query(() => SearchJobsResult, {
    name: 'searchJobs',
    description: 'Search for jobs across multiple sources',
  })
  async searchJobs(
    @Args('input') input: SearchJobsInput,
  ): Promise<SearchJobsResult> {
    this.logger.log(
      `GraphQL searchJobs: term="${input.searchTerm}", location="${input.location ?? ''}"`,
    );

    // ── Cache check ───────────────────────
    const cacheParams = { ...input, endpoint: 'graphql-search' };
    const cached = await this.cacheService.get<any[]>(cacheParams);

    if (cached) {
      this.logger.log(`Cache hit — returning ${cached.length} cached results`);
      return { count: cached.length, jobs: cached, cached: true };
    }

    // Map GraphQL input to the service DTO shape
    const scraperInput: any = {
      searchTerm: input.searchTerm,
      location: input.location,
      resultsWanted: input.resultsWanted ?? 20,
      country: input.country,
      distance: input.distance,
      companySlug: input.companySlug,
      descriptionFormat: input.descriptionFormat ?? 'markdown',
      siteType: input.siteType,
    };

    const jobs = await this.jobsService.searchJobs(scraperInput);
    await this.cacheService.set(cacheParams, jobs);

    this.logger.log(`GraphQL searchJobs: returning ${jobs.length} results`);
    return { count: jobs.length, jobs: jobs as any[], cached: false };
  }

  @Query(() => SourceListResult, {
    name: 'listSources',
    description: 'List all available job sources',
  })
  listSources(): SourceListResult {
    const sources = Object.entries(Site).map(([name, value]) => ({
      name,
      value,
    }));
    return { total: sources.length, sources };
  }
}
