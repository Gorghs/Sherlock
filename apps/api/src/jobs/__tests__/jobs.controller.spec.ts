import 'reflect-metadata';
import {
  ScraperInputDto,
  JobPostDto,
  JobAnalysisDto,
} from '@sherlock/models';
import { JobsController } from '../jobs.controller';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function makeJobsService(jobs: JobPostDto[] = []) {
  return { searchJobs: jest.fn().mockResolvedValue(jobs) };
}

function makeAnalyticsService() {
  return {
    analyze: jest.fn().mockReturnValue({
      summary: { totalJobs: 1, remoteCount: 0, remotePercentage: 0, withSalaryCount: 0, salaryStats: null, bySite: {} },
      companies: [],
      siteComparison: [],
    }),
  };
}

function makeCacheService(cachedValue: any = null) {
  return {
    get: jest.fn().mockReturnValue(cachedValue),
    set: jest.fn(),
  };
}

function createController(opts: { jobs?: JobPostDto[]; cachedValue?: any } = {}) {
  const jobsService = makeJobsService(opts.jobs ?? []);
  const analyticsService = makeAnalyticsService();
  const cacheService = makeCacheService(opts.cachedValue);
  const controller = new JobsController(
    jobsService as any,
    analyticsService as any,
    cacheService as any,
  );
  return { controller, jobsService, cacheService, analyticsService };
}

function makeJob(overrides: Partial<JobPostDto> = {}): JobPostDto {
  return new JobPostDto({
    id: overrides.id ?? 'test-1',
    title: overrides.title ?? 'Software Engineer',
    companyName: overrides.companyName ?? 'Acme Corp',
    jobUrl: overrides.jobUrl ?? 'https://example.com/job/1',
    site: overrides.site ?? 'linkedin',
    isRemote: overrides.isRemote ?? false,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JobsController', () => {
  describe('POST /search — JSON responses', () => {
    it('should return job results with count', async () => {
      const jobs = [makeJob({ title: 'SWE' }), makeJob({ title: 'PM' })];
      const { controller } = createController({ jobs });

      const result = await controller.searchJobs(
        new ScraperInputDto({ searchTerm: 'node' }),
      ) as any;

      expect(result).toEqual({
        count: 2,
        jobs,
        cached: false,
      });
    });

    it('should return cached results when available', async () => {
      const cachedJobs = [makeJob({ title: 'Cached Job' })];
      const { controller, jobsService } = createController({ cachedValue: cachedJobs });

      const result = await controller.searchJobs(
        new ScraperInputDto({ searchTerm: 'node' }),
      ) as any;

      expect(result).toEqual({
        count: 1,
        jobs: cachedJobs,
        cached: true,
      });
      // Should NOT call jobsService when cache hit
      expect(jobsService.searchJobs).not.toHaveBeenCalled();
    });

    it('should cache results on miss', async () => {
      const jobs = [makeJob()];
      const { controller, cacheService } = createController({ jobs });

      await controller.searchJobs(new ScraperInputDto({ searchTerm: 'node' }));

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(Object),
        jobs,
      );
    });
  });

  describe('POST /search — pagination', () => {
    it('should paginate results when paginate=true', async () => {
      const jobs = Array.from({ length: 25 }, (_, i) =>
        makeJob({ id: `job-${i}`, title: `Job ${i}` }),
      );
      const { controller } = createController({ jobs });

      const result = await controller.searchJobs(
        new ScraperInputDto({ searchTerm: 'node' }),
        undefined,
        'true',   // paginate
        '2',      // page
        '10',     // page_size
      ) as any;

      expect(result).toMatchObject({
        count: 25,
        total_pages: 3,
        current_page: 2,
        page_size: 10,
        next_page: 3,
        previous_page: 1,
        cached: false,
      });
      expect(result.jobs).toHaveLength(10);
    });

    it('should clamp page_size to max 100', async () => {
      const jobs = Array.from({ length: 5 }, () => makeJob());
      const { controller } = createController({ jobs });

      const result = await controller.searchJobs(
        new ScraperInputDto({ searchTerm: 'node' }),
        undefined,
        'true',
        '1',
        '999',  // exceeds max
      ) as any;

      expect(result.page_size).toBe(100);
    });

    it('should return null for next_page on last page', async () => {
      const jobs = [makeJob()];
      const { controller } = createController({ jobs });

      const result = await controller.searchJobs(
        new ScraperInputDto({ searchTerm: 'node' }),
        undefined,
        'true',
        '1',
        '10',
      ) as any;

      expect(result.next_page).toBeNull();
      expect(result.previous_page).toBeNull();
    });
  });

  describe('POST /search — CSV export', () => {
    it('should return CSV when format=csv', async () => {
      const jobs = [
        makeJob({ title: 'SWE', companyName: 'Acme' }),
      ];
      const { controller } = createController({ jobs });

      const mockRes = {
        setHeader: jest.fn(),
      };

      const result = await controller.searchJobs(
        new ScraperInputDto({ searchTerm: 'node' }),
        'csv',
        undefined,
        undefined,
        undefined,
        mockRes as any,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=jobs.csv',
      );
      // Result should be a StreamableFile
      expect(result).toBeDefined();
    });
  });

  describe('POST /analyze', () => {
    it('should search then analyze jobs', async () => {
      const jobs = [makeJob()];
      const { controller, analyticsService } = createController({ jobs });

      const result = await controller.analyzeJobs(
        new ScraperInputDto({ searchTerm: 'node' }),
      );

      expect(analyticsService.analyze).toHaveBeenCalledWith(jobs);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalJobs).toBe(1);
    });
  });
});
