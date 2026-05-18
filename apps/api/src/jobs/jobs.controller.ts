import {
  Controller,
  Post,
  Body,
  Logger,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  ScraperInputDto,
  JobPostDto,
  JobAnalysisDto,
} from '@sherlock/models';
import { JobsService } from './jobs.service';
import { AnalyticsService } from '@sherlock/analytics';
import { CacheService } from '../cache/cache.service';

@ApiTags('Jobs')
@Controller('api/jobs')
export class JobsController {
  private readonly logger = new Logger(JobsController.name);

  constructor(
    private readonly jobsService: JobsService,
    private readonly analyticsService: AnalyticsService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * POST /api/jobs/search
   *
   * Primary job search endpoint. Accepts a JSON body with search criteria
   * and returns results with caching, CSV export, and pagination support.
   *
   * Output format and pagination are controlled via query parameters:
   *   ?format=csv    → returns CSV file download
   *   ?paginate=true&page=1&page_size=10 → paginated JSON
   */
  @Post('search')
  @ApiOperation({
    summary: 'Search for jobs across multiple sources',
    description:
      'Searches selected job boards concurrently and returns a merged, sorted list of job postings. ' +
      'Supports caching, CSV export (via ?format=csv), and pagination (via ?paginate=true).',
  })
  @ApiQuery({ name: 'format', required: false, description: 'Output format: json (default) or csv', example: 'json' })
  @ApiQuery({ name: 'paginate', required: false, type: Boolean, description: 'Enable pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (when paginate=true)' })
  @ApiQuery({ name: 'page_size', required: false, type: Number, description: 'Results per page (1-100, default 10)' })
  @ApiResponse({ status: 200, description: 'Job search results' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async searchJobs(
    @Body() input: ScraperInputDto,
    @Query('format') format?: string,
    @Query('paginate') paginateRaw?: string,
    @Query('page') pageRaw?: string,
    @Query('page_size') pageSizeRaw?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    this.logger.log(
      `Search request: sites=${input.siteType?.join(',') ?? 'all'}, term="${input.searchTerm}", location="${input.location}"`,
    );

    // ── Helper parsers ────────────────────
    const parseBool = (v?: string): boolean =>
      v !== undefined && ['true', '1', 'yes'].includes(v.toLowerCase());
    const parseNum = (v?: string): number | undefined =>
      v === undefined ? undefined : Number(v) || undefined;

    // ── Cache check ───────────────────────
    const cacheParams = { ...input, endpoint: 'search' };
    const cached = await this.cacheService.get<JobPostDto[]>(cacheParams);
    let jobs: JobPostDto[];
    let fromCache = false;

    if (cached) {
      jobs = cached;
      fromCache = true;
      this.logger.log(`Cache hit — returning ${jobs.length} cached results`);
    } else {
      jobs = await this.jobsService.searchJobs(input);
      await this.cacheService.set(cacheParams, jobs);
    }

    this.logger.log(`Returning ${jobs.length} jobs (cached=${fromCache})`);

    // ── CSV output ────────────────────────
    if (format?.toLowerCase() === 'csv') {
      const csvLines = this.jobsToCsv(jobs);
      res!.setHeader('Content-Type', 'text/csv');
      res!.setHeader('Content-Disposition', 'attachment; filename=jobs.csv');
      return new StreamableFile(Buffer.from(csvLines, 'utf-8'));
    }

    // ── Pagination ────────────────────────
    const paginate = parseBool(paginateRaw);
    if (paginate) {
      const page = Math.max(1, parseNum(pageRaw) ?? 1);
      const pageSize = Math.min(100, Math.max(1, parseNum(pageSizeRaw) ?? 10));
      const totalPages = Math.ceil(jobs.length / pageSize);
      const start = (page - 1) * pageSize;
      const pageJobs = jobs.slice(start, start + pageSize);

      return {
        count: jobs.length,
        total_pages: totalPages,
        current_page: page,
        page_size: pageSize,
        jobs: pageJobs,
        cached: fromCache,
        next_page: page < totalPages ? page + 1 : null,
        previous_page: page > 1 ? page - 1 : null,
      };
    }

    // ── Standard JSON ─────────────────────
    return {
      count: jobs.length,
      jobs,
      cached: fromCache,
    };
  }

  /**
   * POST /api/jobs/analyze
   *
   * Searches jobs then returns summary statistics, company intelligence,
   * and per-site comparison — a different response shape from /search.
   */
  @Post('analyze')
  @ApiOperation({
    summary: 'Search and analyze jobs',
    description:
      'Searches jobs from selected sites, then returns summary statistics, company intelligence, and per-site comparison.',
  })
  @ApiResponse({
    status: 200,
    description: 'Full analysis including summary, company insights, and site comparison.',
  })
  async analyzeJobs(@Body() input: ScraperInputDto): Promise<JobAnalysisDto> {
    this.logger.log(
      `Analyze request: sites=${input.siteType?.join(',') ?? 'all'}, term="${input.searchTerm}", location="${input.location}"`,
    );
    const jobs = await this.jobsService.searchJobs(input);
    const analysis = this.analyticsService.analyze(jobs);
    this.logger.log(`Analysis complete: ${analysis.summary.totalJobs} jobs, ${analysis.companies.length} companies`);
    return analysis;
  }

  // ── CSV helper ──────────────────────────

  /** Convert jobs array to CSV string. */
  private jobsToCsv(jobs: JobPostDto[]): string {
    if (jobs.length === 0) return 'No results\n';

    // Flatten nested objects for CSV
    const flatJobs = jobs.map((job) => {
      const flat: Record<string, string> = {};
      for (const [key, value] of Object.entries(job)) {
        if (value === null || value === undefined) {
          flat[key] = '';
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          for (const [subKey, subVal] of Object.entries(value as Record<string, any>)) {
            flat[`${key}.${subKey}`] = String(subVal ?? '');
          }
        } else if (Array.isArray(value)) {
          flat[key] = value.join('; ');
        } else {
          flat[key] = String(value);
        }
      }
      return flat;
    });

    // Collect all unique headers
    const headers = new Set<string>();
    for (const row of flatJobs) {
      for (const key of Object.keys(row)) {
        headers.add(key);
      }
    }
    const headerArr = [...headers];

    const escape = (v: string) => {
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };

    const lines = [headerArr.map(escape).join(',')];
    for (const row of flatJobs) {
      lines.push(headerArr.map((h) => escape(row[h] ?? '')).join(','));
    }
    return lines.join('\n') + '\n';
  }
}
