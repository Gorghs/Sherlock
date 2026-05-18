import 'reflect-metadata';
import {
  ScraperInputDto,
  JobPostDto,
  JobResponseDto,
  Site,
  IScraper,
  Country,
  SalarySource,
  CompensationDto,
  CompensationInterval,
} from '@sherlock/models';

// ---------------------------------------------------------------------------
// Mock ALL source packages before importing JobsService.
// jest.mock() calls are hoisted, but can reference variables prefixed with `mock`.
//
// We auto-mock every source package with a simple class containing a scrape stub.
// This prevents TypeScript compilation of the real source files, avoiding
// cascading TS errors from dice.service.ts etc.
// ---------------------------------------------------------------------------
const mockSourceFactory = () => {
  const handler: ProxyHandler<object> = {
    get: (_target, prop) => {
      if (prop === '__esModule') return true;
      // Return a class with a scrape method for any named export
      return class { scrape = jest.fn(); };
    },
  };
  return new Proxy({}, handler);
};

jest.mock('@sherlock/source-linkedin', () => mockSourceFactory());
jest.mock('@sherlock/source-indeed', () => mockSourceFactory());
jest.mock('@sherlock/source-glassdoor', () => mockSourceFactory());
jest.mock('@sherlock/source-ziprecruiter', () => mockSourceFactory());
jest.mock('@sherlock/source-google', () => mockSourceFactory());
jest.mock('@sherlock/source-bayt', () => mockSourceFactory());
jest.mock('@sherlock/source-naukri', () => mockSourceFactory());
jest.mock('@sherlock/source-bdjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-internshala', () => mockSourceFactory());
jest.mock('@sherlock/source-exa', () => mockSourceFactory());
jest.mock('@sherlock/source-upwork', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-ashby', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-greenhouse', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-lever', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-workable', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-smartrecruiters', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-rippling', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-workday', () => mockSourceFactory());
jest.mock('@sherlock/source-company-amazon', () => mockSourceFactory());
jest.mock('@sherlock/source-company-apple', () => mockSourceFactory());
jest.mock('@sherlock/source-company-microsoft', () => mockSourceFactory());
jest.mock('@sherlock/source-company-nvidia', () => mockSourceFactory());
jest.mock('@sherlock/source-company-tiktok', () => mockSourceFactory());
jest.mock('@sherlock/source-company-uber', () => mockSourceFactory());
jest.mock('@sherlock/source-company-cursor', () => mockSourceFactory());
jest.mock('@sherlock/source-remoteok', () => mockSourceFactory());
jest.mock('@sherlock/source-remotive', () => mockSourceFactory());
jest.mock('@sherlock/source-jobicy', () => mockSourceFactory());
jest.mock('@sherlock/source-himalayas', () => mockSourceFactory());
jest.mock('@sherlock/source-arbeitnow', () => mockSourceFactory());
jest.mock('@sherlock/source-weworkremotely', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-recruitee', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-teamtailor', () => mockSourceFactory());
jest.mock('@sherlock/source-usajobs', () => mockSourceFactory());
jest.mock('@sherlock/source-adzuna', () => mockSourceFactory());
jest.mock('@sherlock/source-reed', () => mockSourceFactory());
jest.mock('@sherlock/source-jooble', () => mockSourceFactory());
jest.mock('@sherlock/source-careerjet', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-bamboohr', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-personio', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-jazzhr', () => mockSourceFactory());
jest.mock('@sherlock/source-dice', () => mockSourceFactory());
jest.mock('@sherlock/source-simplyhired', () => mockSourceFactory());
jest.mock('@sherlock/source-wellfound', () => mockSourceFactory());
jest.mock('@sherlock/source-stepstone', () => mockSourceFactory());
jest.mock('@sherlock/source-monster', () => mockSourceFactory());
jest.mock('@sherlock/source-careerbuilder', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-icims', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-taleo', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-successfactors', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-jobvite', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-adp', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-ukg', () => mockSourceFactory());
jest.mock('@sherlock/source-company-google', () => mockSourceFactory());
jest.mock('@sherlock/source-company-meta', () => mockSourceFactory());
jest.mock('@sherlock/source-company-netflix', () => mockSourceFactory());
jest.mock('@sherlock/source-company-stripe', () => mockSourceFactory());
jest.mock('@sherlock/source-company-openai', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-breezyhr', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-comeet', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-pinpoint', () => mockSourceFactory());
jest.mock('@sherlock/source-builtin', () => mockSourceFactory());
jest.mock('@sherlock/source-snagajob', () => mockSourceFactory());
jest.mock('@sherlock/source-dribbble', () => mockSourceFactory());
// Phase 8: ATS Expansion
jest.mock('@sherlock/source-ats-manatal', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-paylocity', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-freshteam', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-bullhorn', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-trakstar', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-hiringthing', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-loxo', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-fountain', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-deel', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-phenom', () => mockSourceFactory());
// Phase 8: Company scrapers
jest.mock('@sherlock/source-company-ibm', () => mockSourceFactory());
jest.mock('@sherlock/source-company-boeing', () => mockSourceFactory());
jest.mock('@sherlock/source-company-zoom', () => mockSourceFactory());
// Phase 9: Job board expansion
jest.mock('@sherlock/source-themuse', () => mockSourceFactory());
jest.mock('@sherlock/source-workingnomads', () => mockSourceFactory());
jest.mock('@sherlock/source-4dayweek', () => mockSourceFactory());
jest.mock('@sherlock/source-startupjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-nodesk', () => mockSourceFactory());
jest.mock('@sherlock/source-web3career', () => mockSourceFactory());
jest.mock('@sherlock/source-echojobs', () => mockSourceFactory());
jest.mock('@sherlock/source-jobstreet', () => mockSourceFactory());
// Phase 10: Government boards & ATS expansion
jest.mock('@sherlock/source-careeronestop', () => mockSourceFactory());
jest.mock('@sherlock/source-arbeitsagentur', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-jobylon', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-homerun', () => mockSourceFactory());
// Phase 11: Niche boards & developer API expansion
jest.mock('@sherlock/source-hackernews', () => mockSourceFactory());
jest.mock('@sherlock/source-landingjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-findwork', () => mockSourceFactory());
jest.mock('@sherlock/source-jobdataapi', () => mockSourceFactory());
// Phase 12: ATS & niche board expansion
jest.mock('@sherlock/source-authenticjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-jobscore', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-talentlyft', () => mockSourceFactory());
// Phase 13: RSS niche board expansion
jest.mock('@sherlock/source-cryptojobslist', () => mockSourceFactory());
jest.mock('@sherlock/source-jobspresso', () => mockSourceFactory());
jest.mock('@sherlock/source-higheredjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-fossjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-larajobs', () => mockSourceFactory());
jest.mock('@sherlock/source-pythonjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-drupaljobs', () => mockSourceFactory());
jest.mock('@sherlock/source-realworkfromanywhere', () => mockSourceFactory());
jest.mock('@sherlock/source-golangjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-wordpressjobs', () => mockSourceFactory());
// Phase 14: API-key sources & ATS expansion
jest.mock('@sherlock/source-talroo', () => mockSourceFactory());
jest.mock('@sherlock/source-infojobs', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-crelate', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-ismartrecruit', () => mockSourceFactory());
jest.mock('@sherlock/source-ats-recruiterflow', () => mockSourceFactory());
// Phase 15: European government & regional boards
jest.mock('@sherlock/source-jobtechdev', () => mockSourceFactory());
jest.mock('@sherlock/source-francetravail', () => mockSourceFactory());
jest.mock('@sherlock/source-navjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-jobsacuk', () => mockSourceFactory());
jest.mock('@sherlock/source-jobindex', () => mockSourceFactory());
// Phase 16: Global expansion (LatAm, gig, startup, Canada)
jest.mock('@sherlock/source-getonboard', () => mockSourceFactory());
jest.mock('@sherlock/source-freelancercom', () => mockSourceFactory());
jest.mock('@sherlock/source-joinrise', () => mockSourceFactory());
jest.mock('@sherlock/source-canadajobbank', () => mockSourceFactory());
// Phase 17: Niche & international expansion (NGO, UN, IT)
jest.mock('@sherlock/source-reliefweb', () => mockSourceFactory());
jest.mock('@sherlock/source-undpjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-devitjobs', () => mockSourceFactory());
// Phase 18: Niche RSS expansion (tech, design, environment, regional)
jest.mock('@sherlock/source-pyjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-vuejobs', () => mockSourceFactory());
jest.mock('@sherlock/source-conservationjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-coroflot', () => mockSourceFactory());
jest.mock('@sherlock/source-berlinstartupjobs', () => mockSourceFactory());
// Phase 19: Tech niche, crypto, regional expansion
jest.mock('@sherlock/source-railsjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-elixirjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-crunchboard', () => mockSourceFactory());
jest.mock('@sherlock/source-cryptocurrencyjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-hasjob', () => mockSourceFactory());
// Phase 20: European regional & niche expansion
jest.mock('@sherlock/source-icrunchdata', () => mockSourceFactory());
jest.mock('@sherlock/source-swissdevjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-germantechjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-virtualvocations', () => mockSourceFactory());
jest.mock('@sherlock/source-nofluffjobs', () => mockSourceFactory());
// Phase 21: Niche & academic expansion
jest.mock('@sherlock/source-greenjobsboard', () => mockSourceFactory());
jest.mock('@sherlock/source-eurojobs', () => mockSourceFactory());
jest.mock('@sherlock/source-opensourcedesignjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-academiccareers', () => mockSourceFactory());
jest.mock('@sherlock/source-remotefirstjobs', () => mockSourceFactory());
// Phase 22: Eastern European, CIS & Singapore expansion
jest.mock('@sherlock/source-djinni', () => mockSourceFactory());
jest.mock('@sherlock/source-headhunter', () => mockSourceFactory());
jest.mock('@sherlock/source-habrcareer', () => mockSourceFactory());
jest.mock('@sherlock/source-mycareersfuture', () => mockSourceFactory());
// Phase 23: Japan, Nordic & Swiss expansion
jest.mock('@sherlock/source-jobsinjapan', () => mockSourceFactory());
jest.mock('@sherlock/source-duunitori', () => mockSourceFactory());
jest.mock('@sherlock/source-jobsch', () => mockSourceFactory());
// Phase 24: UK & mobile dev expansion
jest.mock('@sherlock/source-guardianjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-androidjobs', () => mockSourceFactory());
jest.mock('@sherlock/source-iosdevjobs', () => mockSourceFactory());
// Phase 25: DevOps niche expansion
jest.mock('@sherlock/source-devopsjobs', () => mockSourceFactory());
// Phase 25: FP, diversity & niche expansion
jest.mock('@sherlock/source-functionalworks', () => mockSourceFactory());
jest.mock('@sherlock/source-powertofly', () => mockSourceFactory());
jest.mock('@sherlock/source-clojurejobs', () => mockSourceFactory());
// Phase 26: Sustainability & niche expansion
jest.mock('@sherlock/source-ecojobs', () => mockSourceFactory());

import { JobsService } from '../jobs.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a mock scraper that resolves with the given jobs */
function makeScraper(jobs: Partial<JobPostDto>[] = []): IScraper {
  return {
    scrape: jest.fn().mockResolvedValue(
      new JobResponseDto(
        jobs.map(
          (j) =>
            new JobPostDto({
              id: j.id ?? `job-${Math.random().toString(36).slice(2)}`,
              title: j.title ?? 'Software Engineer',
              companyName: j.companyName ?? 'Acme Corp',
              jobUrl: j.jobUrl ?? 'https://example.com/job/1',
              site: j.site,
              description: j.description,
              compensation: j.compensation,
              datePosted: j.datePosted,
              isRemote: j.isRemote ?? false,
            }),
        ),
      ),
    ),
  };
}

/** Create a failing mock scraper */
function failingScraper(error = 'Network timeout'): IScraper {
  return { scrape: jest.fn().mockRejectedValue(new Error(error)) };
}

/**
 * Create a JobsService instance with a custom scraperMap.
 * Bypasses the 182-arg constructor by using Object.create.
 */
function createService(scraperEntries: [Site, IScraper][]): JobsService {
  const service = Object.create(JobsService.prototype);
  service.logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  service.scraperMap = new Map<Site, IScraper>(scraperEntries);
  return service;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JobsService', () => {
  describe('searchJobs — site routing', () => {
    it('should use explicit siteType when provided', async () => {
      const linkedin = makeScraper([{ title: 'LI job' }]);
      const indeed = makeScraper([{ title: 'Indeed job' }]);
      const service = createService([
        [Site.LINKEDIN, linkedin],
        [Site.INDEED, indeed],
      ]);

      const input = new ScraperInputDto({ searchTerm: 'node', siteType: [Site.LINKEDIN] });
      const result = await service.searchJobs(input);

      expect(linkedin.scrape).toHaveBeenCalled();
      expect(indeed.scrape).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('LI job');
    });

    it('should route to ATS scrapers when companySlug is provided and no explicit sites', async () => {
      const greenhouse = makeScraper([{ title: 'GH job' }]);
      const linkedin = makeScraper([{ title: 'LI job' }]);
      const service = createService([
        [Site.GREENHOUSE, greenhouse],
        [Site.LINKEDIN, linkedin],
      ]);

      const input = new ScraperInputDto({
        searchTerm: 'node',
        companySlug: 'stripe',
        siteType: undefined,
      });
      const result = await service.searchJobs(input);

      // GREENHOUSE is ATS → called; LINKEDIN is search → skipped
      expect(greenhouse.scrape).toHaveBeenCalled();
      expect(linkedin.scrape).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('should skip ATS scrapers in default routing (no companySlug, no siteType)', async () => {
      const linkedin = makeScraper([{ title: 'LI job' }]);
      const lever = makeScraper([{ title: 'Lever job' }]);
      const amazon = makeScraper([{ title: 'Amazon job' }]);
      const service = createService([
        [Site.LINKEDIN, linkedin],
        [Site.LEVER, lever],
        [Site.AMAZON, amazon],
      ]);

      const input = new ScraperInputDto({ searchTerm: 'node', siteType: undefined });
      const result = await service.searchJobs(input);

      expect(linkedin.scrape).toHaveBeenCalled();
      expect(amazon.scrape).toHaveBeenCalled();
      expect(lever.scrape).not.toHaveBeenCalled();
      expect(result.length).toBe(2);
    });

    it('should return empty array when no valid scrapers match', async () => {
      const service = createService([]);
      const input = new ScraperInputDto({ searchTerm: 'node', siteType: [Site.LINKEDIN] });
      const result = await service.searchJobs(input);
      expect(result).toEqual([]);
    });

    it('should allow ATS scrapers via explicit siteType even without companySlug', async () => {
      const lever = makeScraper([{ title: 'Lever job' }]);
      const service = createService([[Site.LEVER, lever]]);

      const input = new ScraperInputDto({
        searchTerm: 'node',
        siteType: [Site.LEVER],
      });
      const result = await service.searchJobs(input);

      expect(lever.scrape).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });
  });

  describe('searchJobs — error handling', () => {
    it('should not crash when one scraper fails', async () => {
      const linkedin = makeScraper([{ title: 'LI job' }]);
      const service = createService([
        [Site.LINKEDIN, linkedin],
        [Site.INDEED, failingScraper()],
      ]);

      const input = new ScraperInputDto({
        searchTerm: 'node',
        siteType: [Site.LINKEDIN, Site.INDEED],
      });
      const result = await service.searchJobs(input);

      expect(result.length).toBe(1);
      expect(result[0].title).toBe('LI job');
    });

    it('should return empty array when all scrapers fail', async () => {
      const service = createService([
        [Site.LINKEDIN, failingScraper('API down')],
      ]);

      const input = new ScraperInputDto({ searchTerm: 'node', siteType: [Site.LINKEDIN] });
      const result = await service.searchJobs(input);

      expect(result).toEqual([]);
    });
  });

  describe('searchJobs — result tagging and sorting', () => {
    it('should tag each job with its source site', async () => {
      const linkedin = makeScraper([{ title: 'Job A' }]);
      const indeed = makeScraper([{ title: 'Job B' }]);
      const service = createService([
        [Site.LINKEDIN, linkedin],
        [Site.INDEED, indeed],
      ]);

      const input = new ScraperInputDto({
        searchTerm: 'node',
        siteType: [Site.LINKEDIN, Site.INDEED],
      });
      const result = await service.searchJobs(input);

      const sites = result.map((j) => j.site);
      expect(sites).toContain(Site.LINKEDIN);
      expect(sites).toContain(Site.INDEED);
    });

    it('should sort results by site name then date descending', async () => {
      const scraper = makeScraper([
        { title: 'Old', datePosted: '2024-01-01' },
        { title: 'New', datePosted: '2024-06-01' },
      ]);
      const service = createService([[Site.LINKEDIN, scraper]]);

      const input = new ScraperInputDto({ searchTerm: 'node', siteType: [Site.LINKEDIN] });
      const result = await service.searchJobs(input);

      expect(result[0].title).toBe('New');
      expect(result[1].title).toBe('Old');
    });
  });

  describe('postProcessSalary', () => {
    let service: JobsService;

    beforeEach(() => {
      service = createService([]);
    });

    it('should set salarySource to DIRECT_DATA when compensation exists', () => {
      const job = new JobPostDto({
        id: '1', title: 'SWE', companyName: 'Co', jobUrl: 'https://example.com',
        compensation: new CompensationDto({
          interval: CompensationInterval.YEARLY, minAmount: 100000, maxAmount: 150000, currency: 'USD',
        }),
      });

      (service as any).postProcessSalary(job, new ScraperInputDto({ searchTerm: 'node' }));
      expect(job.salarySource).toBe(SalarySource.DIRECT_DATA);
    });

    it('should convert hourly to annual when enforceAnnualSalary is true', () => {
      const job = new JobPostDto({
        id: '1', title: 'SWE', companyName: 'Co', jobUrl: 'https://example.com',
        compensation: new CompensationDto({
          interval: CompensationInterval.HOURLY, minAmount: 50, maxAmount: 100, currency: 'USD',
        }),
      });

      (service as any).postProcessSalary(
        job, new ScraperInputDto({ searchTerm: 'node', enforceAnnualSalary: true }),
      );

      expect(job.compensation!.minAmount).toBe(104000);
      expect(job.compensation!.maxAmount).toBe(208000);
    });

    it('should extract salary from description for USA jobs without compensation', () => {
      const job = new JobPostDto({
        id: '1', title: 'SWE', companyName: 'Co', jobUrl: 'https://example.com',
        description: 'Salary range: $120,000 - $180,000 per year',
      });

      (service as any).postProcessSalary(
        job, new ScraperInputDto({ searchTerm: 'node', country: Country.USA }),
      );

      expect(job.salarySource).toBe(SalarySource.DESCRIPTION);
      expect(job.compensation).toBeDefined();
      expect(job.compensation!.minAmount).toBe(120000);
      expect(job.compensation!.maxAmount).toBe(180000);
    });

    it('should not extract salary for non-USA countries', () => {
      const job = new JobPostDto({
        id: '1', title: 'SWE', companyName: 'Co', jobUrl: 'https://example.com',
        description: 'Salary range: $120,000 - $180,000 per year',
      });

      (service as any).postProcessSalary(
        job, new ScraperInputDto({ searchTerm: 'node', country: Country.UK }),
      );

      expect(job.compensation).toBeUndefined();
      expect(job.salarySource).toBeUndefined();
    });

    it('should clear salarySource when no salary data exists', () => {
      const job = new JobPostDto({
        id: '1', title: 'SWE', companyName: 'Co', jobUrl: 'https://example.com',
      });

      (service as any).postProcessSalary(
        job, new ScraperInputDto({ searchTerm: 'node' }),
      );

      expect(job.salarySource).toBeUndefined();
    });
  });
});
