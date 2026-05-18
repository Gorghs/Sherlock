import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobPostDto } from '@sherlock/models';
import { GeminiService } from '../ai/gemini.service';

export interface JobFilterConfig {
  techKeywords: string[];
  freshersOnly: boolean;
  minRelevanceScore: number; // 0-100
  indiaOfficeOnly: boolean;
  allowRemote: boolean;
  allowHybrid: boolean;
  requireApplyLink: boolean;
  maxResultsPerDay: number;
  companySiteNames: string[];
  companyCareerDomains: string[];
}

@Injectable()
export class JobFilterService {
  private readonly logger = new Logger(JobFilterService.name);
  private config: JobFilterConfig;
  private readonly indiaHighSignalSites = new Set([
    'naukri',
    'internshala',
    'linkedin',
    'indeed',
    'wellfound',
    'himalayas',
    'google',
    'exa',
    'greenhouse',
    'lever',
    'workday',
    'smartrecruiters',
    'ashby',
    'recruitee',
    'teamtailor',
    'jobicy',
    'remoteok',
    'remotive',
    'weworkremotely',
    'workingnomads',
    'startupjobs',
  ]);

  // Tech & computer-related keywords
  private readonly techKeywords = [
    // Languages
    'python',
    'javascript',
    'typescript',
    'java',
    'c++',
    'golang',
    'go',
    'rust',
    'php',
    'ruby',
    'swift',
    'kotlin',
    'scala',
    'r programming',
    // Frontend
    'react',
    'angular',
    'vue.js',
    'vue',
    'next.js',
    'svelte',
    'html',
    'css',
    'sass',
    // Backend
    'node.js',
    'nodejs',
    'django',
    'fastapi',
    'flask',
    'spring',
    'express',
    'nest',
    'nestjs',
    '.net',
    'dotnet',
    'rails',
    // Databases
    'sql',
    'mysql',
    'postgresql',
    'mongodb',
    'redis',
    'dynamodb',
    'firebase',
    'cassandra',
    'elasticsearch',
    // Cloud & DevOps
    'aws',
    'azure',
    'gcp',
    'google cloud',
    'docker',
    'kubernetes',
    'jenkins',
    'gitlab ci',
    'github actions',
    'terraform',
    'linux',
    // APIs & Tools
    'rest api',
    'graphql',
    'microservices',
    'grpc',
    'kafka',
    'rabbitmq',
    'git',
    'github',
    'gitlab',
    'tensorflow',
    'pytorch',
    // Roles
    'software engineer',
    'developer',
    'backend engineer',
    'frontend engineer',
    'full stack',
    'fullstack',
    'devops',
    'data engineer',
    'machine learning',
    'ai engineer',
    'cloud engineer',
    'systems engineer',
    'qa engineer',
    'test engineer',
    'web developer',
    'mobile developer',
    'android developer',
    'ios developer',
    'data scientist',
    // Entry level keywords
    'fresher',
    'entry level',
    'entry-level',
    'junior',
    'internship',
    'intern',
    'trainee',
    'graduate',
    'recent graduate',
    'no experience',
    'beginner',
  ];

  constructor(
    private configService: ConfigService,
    private geminiService: GeminiService,
  ) {
    this.config = this.initializeConfig();
  }

  /**
   * Load filter configuration from env
   */
  private initializeConfig(): JobFilterConfig {
    const techKeywordStr = this.configService.get<string>(
      'filter.techKeywords',
      this.techKeywords.join(','),
    );

    return {
      techKeywords: techKeywordStr
        .split(',')
        .map((kw) => kw.trim().toLowerCase())
        .filter(Boolean),
      freshersOnly: this.configService.get<boolean>('filter.freshersOnly', true),
      minRelevanceScore: this.configService.get<number>(
        'filter.minRelevanceScore',
        40,
      ),
      indiaOfficeOnly: this.configService.get<boolean>(
        'filter.indiaOfficeOnly',
        true,
      ),
      allowRemote: this.configService.get<boolean>('filter.allowRemote', true),
      allowHybrid: this.configService.get<boolean>('filter.allowHybrid', true),
      requireApplyLink: this.configService.get<boolean>('filter.requireApplyLink', true),
      maxResultsPerDay: this.configService.get<number>(
        'filter.maxResultsPerDay',
        50,
      ),
      companySiteNames: this.configService
        .get<string[]>('priority.companySiteNames', [])
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      companyCareerDomains: this.configService
        .get<string[]>('priority.companyCareerDomains', [])
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean),
    };
  }

  /**
   * Filter and rank jobs based on criteria
   */
  async filterJobs(jobs: JobPostDto[]): Promise<JobPostDto[]> {
    const originalJobs = jobs;
    let filtered = jobs;

    // 1. Basic sanity check
    filtered = filtered.filter(job => job.title && job.title.length > 0);

    // 2. Apply-link quality check
    if (this.config.requireApplyLink) {
      filtered = this.filterByApplyLink(filtered);
    }

    // 3. Location rule
    // - Remote jobs: anywhere
    // - Non-remote jobs: India only
    filtered = this.filterByLocation(filtered);
    const locationFiltered = [...filtered];

    // 4. Optional tech relevance (lightweight)
    filtered = this.filterByTechKeywords(filtered);

    // 5. Strict fresher rule
    // Keep only internships or jobs that clearly indicate no/entry-level experience.
    filtered = this.filterForFreshersNoExperience(filtered);

    // 6. Gemini-assisted ranking for fresher relevance when enabled.
    if (this.geminiService.isEnabled() && filtered.length > 0) {
      filtered = await this.filterWithGemini(filtered);
    }

    // Safety fallback: if keyword filtering becomes over-restrictive,
    // switch to adaptive recall scoring so we keep quality while avoiding zero-result days.
    if (filtered.length === 0) {
      const recallBase = locationFiltered.length > 0 ? locationFiltered : originalJobs;
      const adaptive = this.adaptiveRecallSelection(recallBase, this.config.maxResultsPerDay * 3);
      if (adaptive.length > 0) {
        this.logger.warn(
          `Strict filters returned 0 jobs; adaptive recall selected ${adaptive.length} candidates`,
        );
        filtered = adaptive;
      }
    }

    // 7. Rank by India-first fresher quality.
    filtered = this.rankByIndiaFresherQuality(filtered);

    // 8. Boost company career pages and company-specific sources.
    filtered = this.prioritizeCompanyCareerJobs(filtered);

    // 9. Remove duplicates (same title + company)
    filtered = this.removeDuplicates(filtered);

    // 10. Return configured maximum per day
    filtered = filtered.slice(0, this.config.maxResultsPerDay);

    this.logger.log(
      `Filtered ${jobs.length} jobs → ${filtered.length} jobs after location and relevance rules`,
    );
    return filtered;
  }

  private adaptiveRecallSelection(jobs: JobPostDto[], limit: number): JobPostDto[] {
    const scored = jobs
      .map((job) => ({ job, score: this.computeAdaptiveRecallScore(job) }))
      .filter((entry) => entry.score >= 35)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, limit))
      .map((entry) => entry.job);

    return scored;
  }

  private computeAdaptiveRecallScore(job: JobPostDto): number {
    let score = 0;
    const title = String(job.title || '').toLowerCase();
    const description = String(job.description || '').toLowerCase();
    const text = `${title} ${description}`;

    if (title.trim().length > 0) {
      score += 10;
    }

    if (/^https?:\/\//i.test(String(job.jobUrl || '').trim())) {
      score += 20;
    }

    const host = this.extractHost(String(job.jobUrl || '').toLowerCase());
    if (host && this.matchesPriorityDomain(host)) {
      score += 20;
    }

    const site = String(job.site || '').toLowerCase();
    if (site && this.indiaHighSignalSites.has(site)) {
      score += 15;
    }

    if (this.filterByTechKeywords([job]).length > 0) {
      score += 15;
    }

    if (this.isPotentialFresherJob(job)) {
      score += 20;
    }

    const looksSenior = ['senior', 'staff', 'principal', 'lead', 'manager', 'architect']
      .some((kw) => text.includes(kw));
    if (looksSenior) {
      score -= 15;
    }

    const location = job.location
      ? `${job.location.city || ''} ${job.location.state || ''} ${job.location.country || ''}`.toLowerCase()
      : '';
    if (this.isIndiaLocation(location)) {
      score += 10;
    } else if (text.includes('remote') || location.includes('remote') || location.includes('anywhere')) {
      score += 8;
    }

    return score;
  }

  /**
   * Fallback selection used only when strict criteria finds no jobs.
   * Keeps location + tech relevance but relaxes fresher/no-experience constraint.
   */
  fallbackOutsideCriteria(jobs: JobPostDto[], limit: number = 20): JobPostDto[] {
    let filtered = jobs;

    // Keep basic quality and geography rules.
    filtered = filtered.filter((job) => job.title && job.title.length > 0);
    if (this.config.requireApplyLink) {
      filtered = this.filterByApplyLink(filtered);
    }
    filtered = this.filterByLocation(filtered);

    // Keep tech relevance so jobs remain useful.
    filtered = this.filterByTechKeywords(filtered);

    // Still keep only jobs where freshers have a realistic chance.
    const fresherLikely = filtered.filter((job) => this.isPotentialFresherJob(job));
    filtered = fresherLikely.length > 0 ? fresherLikely : filtered;

    // Rank and deduplicate before taking top N.
    filtered = this.sortBySalary(filtered);
    filtered = this.prioritizeCompanyCareerJobs(filtered);
    filtered = this.removeDuplicates(filtered);

    const top = filtered.slice(0, Math.max(1, limit));
    this.logger.warn(
      `Strict criteria returned 0 jobs; fallback selected ${top.length} relaxed fresher jobs`,
    );
    return top;
  }

  /**
   * Sort jobs by salary (highest first)
   * Jobs without salary data go to the bottom
   */
  private sortBySalary(jobs: JobPostDto[]): JobPostDto[] {
    return jobs.sort((a, b) => {
      const salaryA = a.compensation?.maxAmount || a.compensation?.minAmount || 0;
      const salaryB = b.compensation?.maxAmount || b.compensation?.minAmount || 0;
      
      // If both have no salary, maintain original order
      if (salaryA === 0 && salaryB === 0) return 0;
      
      // Jobs with salary first (highest first), no-salary jobs last
      if (salaryA === 0) return 1;
      if (salaryB === 0) return -1;
      
      return salaryB - salaryA; // Highest salary first
    });
  }

  private rankByIndiaFresherQuality(jobs: JobPostDto[]): JobPostDto[] {
    return [...jobs]
      .map((job) => ({ job, score: this.computeIndiaQualityScore(job) }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        const dateA = a.job.datePosted ? new Date(String(a.job.datePosted)).getTime() : 0;
        const dateB = b.job.datePosted ? new Date(String(b.job.datePosted)).getTime() : 0;
        if (dateA !== dateB) {
          return dateB - dateA;
        }

        const salaryA = a.job.compensation?.maxAmount || a.job.compensation?.minAmount || 0;
        const salaryB = b.job.compensation?.maxAmount || b.job.compensation?.minAmount || 0;
        return salaryB - salaryA;
      })
      .map((entry) => ({
        ...entry.job,
        relevanceScore: entry.score,
      })) as JobPostDto[];
  }

  private computeIndiaQualityScore(job: JobPostDto): number {
    let score = 0;
    const title = String(job.title || '').toLowerCase();
    const description = String(job.description || '').toLowerCase();
    const text = `${title} ${description}`;
    const location = job.location
      ? `${job.location.city || ''} ${job.location.state || ''} ${job.location.country || ''}`.toLowerCase()
      : '';
    const site = String(job.site || '').toLowerCase();
    const url = String(job.jobUrl || '').trim().toLowerCase();

    if (/^https?:\/\//i.test(url)) score += 20;
    if (this.indiaHighSignalSites.has(site)) score += 15;
    if (this.isIndiaLocation(location)) score += 30;

    const isRemote =
      text.includes('remote') ||
      text.includes('work from home') ||
      text.includes('wfh') ||
      location.includes('remote') ||
      location.includes('anywhere');
    if (isRemote) score += 20;

    if (text.includes('intern') || text.includes('internship')) score += 35;
    if (text.includes('fresher') || text.includes('entry level') || text.includes('entry-level')) score += 30;
    if (this.hasEntryLevelRoleSignals(text)) score += 20;
    if (this.hasLowExperienceRange(text)) score += 15;
    if (this.requiresNonZeroExperience(text)) score -= 60;

    const roleSignals = [
      'software engineer',
      'developer',
      'frontend',
      'backend',
      'full stack',
      'fullstack',
      'data engineer',
      'data analyst',
      'qa engineer',
      'sdet',
      'cloud',
      'devops',
      'machine learning',
      'ai',
    ];
    score += roleSignals.reduce((acc, keyword) => acc + (text.includes(keyword) ? 6 : 0), 0);

    if (job.compensation?.minAmount || job.compensation?.maxAmount) score += 5;

    const postedAt = job.datePosted ? new Date(String(job.datePosted)).getTime() : 0;
    if (postedAt > 0) {
      const ageHours = Math.max(0, (Date.now() - postedAt) / 3600000);
      if (ageHours <= 24) score += 25;
      else if (ageHours <= 72) score += 15;
      else if (ageHours <= 168) score += 8;
      else if (ageHours > 720) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Prioritize company-specific career pages and company-source modules.
   * Higher score jobs are moved to the top while preserving salary/date as tie-breakers.
   */
  prioritizeCompanyCareerJobs(jobs: JobPostDto[]): JobPostDto[] {
    return [...jobs].sort((a, b) => {
      const priorityA = this.getCompanyPriorityScore(a);
      const priorityB = this.getCompanyPriorityScore(b);
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      const salaryA = a.compensation?.maxAmount || a.compensation?.minAmount || 0;
      const salaryB = b.compensation?.maxAmount || b.compensation?.minAmount || 0;
      if (salaryA !== salaryB) {
        return salaryB - salaryA;
      }

      const dateA = a.datePosted ? new Date(String(a.datePosted)).getTime() : 0;
      const dateB = b.datePosted ? new Date(String(b.datePosted)).getTime() : 0;
      return dateB - dateA;
    });
  }

  private getCompanyPriorityScore(job: JobPostDto): number {
    let score = 0;

    const site = (job.site || '').toLowerCase();
    if (this.config.companySiteNames.includes(site)) {
      score += 60;
    }

    const url = (job.jobUrl || '').toLowerCase();
    const host = this.extractHost(url);
    if (host && this.matchesPriorityDomain(host)) {
      score += 45;
    }

    const company = (job.companyName || '').toLowerCase();
    if (company && this.config.companyCareerDomains.some((domain) => domain.includes(company))) {
      score += 20;
    }

    if (url.includes('/careers') || url.includes('/jobs') || url.includes('career')) {
      score += 10;
    }

    return score;
  }

  private extractHost(url: string): string {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  private matchesPriorityDomain(host: string): boolean {
    return this.config.companyCareerDomains.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );
  }

  /**
   * Filter by job type (office/remote/hybrid)
   */
  private filterByJobType(jobs: JobPostDto[]): JobPostDto[] {
    return jobs.filter((job) => {
      const typeArray = job.jobType || [];
      const type = (Array.isArray(typeArray) ? typeArray.join(' ') : '').toLowerCase();

      if (type.includes('remote')) return this.config.allowRemote;
      if (type.includes('hybrid')) return this.config.allowHybrid;
      if (type.includes('office') || type.includes('on-site'))
        return !this.config.indiaOfficeOnly; // Office jobs need location check

      // Default: allow if not explicitly office
      return true;
    });
  }

  /**
   * Filter by location
   * - Office jobs: India only
   * - Remote jobs: Anywhere
   */
  private filterByLocation(jobs: JobPostDto[]): JobPostDto[] {
    return jobs.filter((job) => {
      const location = job.location
        ? `${job.location.city || ''} ${job.location.state || ''} ${job.location.country || ''}`.toLowerCase()
        : '';
      const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
      const typeArray = job.jobType || [];
      const jobType = (Array.isArray(typeArray) ? typeArray.join(' ') : String(typeArray || '')).toLowerCase();

      const isRemote =
        jobType.includes('remote') ||
        jobType.includes('work from home') ||
        jobType.includes('wfh') ||
        text.includes('remote') ||
        text.includes('work from home') ||
        text.includes('wfh') ||
        location.includes('remote') ||
        location.includes('anywhere');

      // Remote jobs: accept from anywhere
      if (isRemote) return this.config.allowRemote;

      // Office/on-site jobs: only India
      if (jobType.includes('office') || jobType.includes('on-site')) {
        return this.isIndiaLocation(location);
      }

      // Hybrid: treat as office, so India only
      if (jobType.includes('hybrid')) {
        return this.isIndiaLocation(location);
      }

      // Unknown type: try to infer from location
      if (this.isIndiaLocation(location)) return true;

      // Many sources omit explicit location. Keep candidate jobs from trusted
      // India-first sources or known company career domains so later ranking can decide.
      if (!location.trim() && this.isLikelyIndiaSource(job)) {
        return true;
      }

      return false; // Default: reject non-India office jobs
    });
  }

  private isLikelyIndiaSource(job: JobPostDto): boolean {
    const site = String(job.site || '').trim().toLowerCase();
    if (site && this.indiaHighSignalSites.has(site)) {
      return true;
    }

    const host = this.extractHost(String(job.jobUrl || '').toLowerCase());
    if (host && this.matchesPriorityDomain(host)) {
      return true;
    }

    return false;
  }

  /**
   * Check if location is in India
   */
  private isIndiaLocation(location: string): boolean {
    const indiaKeywords = [
      'india',
      'bengaluru',
      'bangalore',
      'mumbai',
      'delhi',
      'hyderabad',
      'pune',
      'gurgaon',
      'kolkata',
      'chennai',
      'ahmedabad',
      'jaipur',
      'chandigarh',
      'noida',
      'indirapuram',
    ];

    return indiaKeywords.some((kw) => location.includes(kw));
  }

  /**
   * Filter by tech keywords
   */
  private filterByTechKeywords(jobs: JobPostDto[]): JobPostDto[] {
    return jobs.filter((job) => {
      const text =
        `${job.title} ${job.description || ''}`.toLowerCase();

      // Count how many tech keywords are mentioned
      let keywordMatchCount = 0;
      for (const keyword of this.config.techKeywords) {
        if (text.includes(keyword)) {
          keywordMatchCount++;
        }
      }

      // Need at least 1-2 matches for tech jobs
      return keywordMatchCount >= 1;
    });
  }

  private filterByApplyLink(jobs: JobPostDto[]): JobPostDto[] {
    return jobs.filter((job) => {
      const url = String(job.jobUrl || '').trim();
      return /^https?:\/\//i.test(url);
    });
  }

  /**
   * Strict fresher/internship filtering.
   * Allows only:
   * - internships
   * - explicitly fresher/entry-level/no-experience jobs
   * Rejects senior or explicit non-zero experience requirements.
   */
  private filterForFreshersNoExperience(jobs: JobPostDto[]): JobPostDto[] {
    const internshipKeywords = [
      'intern',
      'internship',
      'summer intern',
      'graduate intern',
    ];

    const fresherPositiveKeywords = [
      'fresher',
      'freshers',
      'entry level',
      'entry-level',
      'junior',
      'trainee',
      'graduate role',
      'new grad',
      'recent graduate',
      'no experience',
      'no prior experience',
      'no previous experience',
      '0 experience',
      '0 year',
      'zero experience',
      'apprentice',
    ];

    const seniorNegativeKeywords = [
      'senior',
      'staff engineer',
      'principal',
      'lead',
      'manager',
      'architect',
      'director',
      'head of',
      'specialist ii',
      'specialist iii',
    ];

    return jobs.filter((job) => {
      const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();

      const hasInternship = internshipKeywords.some((kw) => text.includes(kw));
      if (hasInternship) {
        return true;
      }

      const hasSeniorSignals = seniorNegativeKeywords.some((kw) => text.includes(kw));
      if (hasSeniorSignals) {
        return false;
      }

      const requiresExperience = this.requiresNonZeroExperience(text);
      if (requiresExperience) {
        return false;
      }

      const hasFresherPositive = fresherPositiveKeywords.some((kw) => text.includes(kw));
      if (hasFresherPositive) {
        return true;
      }

      // Accept likely entry-level roles if there are no strong non-fresher signals.
      return this.hasEntryLevelRoleSignals(text) || this.hasLowExperienceRange(text);
    });
  }

  private hasEntryLevelRoleSignals(text: string): boolean {
    const entryRoleSignals = [
      'software engineer i',
      'software engineer 1',
      'sde i',
      'sde 1',
      'associate software engineer',
      'associate engineer',
      'junior software engineer',
      'graduate engineer',
      'campus hire',
      'fresher',
      'intern',
      'internship',
      'trainee',
      'apprentice',
    ];

    return entryRoleSignals.some((signal) => text.includes(signal));
  }

  private hasLowExperienceRange(text: string): boolean {
    const lowRangePatterns = [
      /\b0\s*(?:-|to)\s*1\s*(?:\+)?\s*(?:years?|yrs?)\b/g,
      /\b0\s*(?:-|to)\s*2\s*(?:\+)?\s*(?:years?|yrs?)\b/g,
      /\b1\s*(?:-|to)\s*2\s*(?:\+)?\s*(?:years?|yrs?)\b/g,
      /\b(?:up to|max(?:imum)?)\s*1\s*(?:year|yr)\b/g,
    ];

    return lowRangePatterns.some((pattern) => pattern.test(text));
  }

  private isPotentialFresherJob(job: JobPostDto): boolean {
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    if (this.requiresNonZeroExperience(text)) {
      return false;
    }

    return this.hasEntryLevelRoleSignals(text) || this.hasLowExperienceRange(text);
  }

  /**
   * Detect explicit non-zero prior experience requirements.
   */
  private requiresNonZeroExperience(text: string): boolean {
    const noExperiencePhrases = [
      'no experience',
      'no prior experience',
      'no previous experience',
      'fresher',
      'freshers',
      'entry level',
      'entry-level',
      'new grad',
      'recent graduate',
      '0-1 year',
      '0 to 1 year',
      '0 year',
    ];

    if (noExperiencePhrases.some((phrase) => text.includes(phrase))) {
      return false;
    }

    const ranges = [...text.matchAll(/\b(\d+)\s*(?:-|to)\s*(\d+)\s*(?:\+)?\s*(?:years?|yrs?)\b/g)];
    for (const m of ranges) {
      const min = Number(m[1]);
      if (!Number.isNaN(min) && min > 0) {
        return true;
      }
    }

    const singles = [...text.matchAll(/\b(\d+)\s*(?:\+|plus)?\s*(?:years?|yrs?)\b/g)];
    for (const m of singles) {
      const years = Number(m[1]);
      if (!Number.isNaN(years) && years > 0) {
        return true;
      }
    }

    const minReq = [...text.matchAll(/\b(?:minimum|min\.?|at least)\s*(\d+)\s*(?:\+)?\s*(?:years?|yrs?)\b/g)];
    for (const m of minReq) {
      const years = Number(m[1]);
      if (!Number.isNaN(years) && years > 0) {
        return true;
      }
    }

    if (
      (text.includes('experience required') || text.includes('previous experience') || text.includes('prior experience')) &&
      !text.includes('no experience')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Use Gemini to smart-filter and rank jobs
   */
  private async filterWithGemini(jobs: JobPostDto[]): Promise<JobPostDto[]> {
    const toEvaluate = jobs.slice(0, 120);
    const scoredJobs: Array<{ job: JobPostDto; score: number }> = [];

    for (const job of toEvaluate) {
      try {
        // Check if it's for freshers
        const freshersOk = this.config.freshersOnly
          ? await this.geminiService.isForFreshers(job)
          : true;

        if (!freshersOk) continue;

        // Get relevance score
        const score = await this.geminiService.evaluateJobRelevance(job);

        if (score >= this.config.minRelevanceScore) {
          scoredJobs.push({ job, score });
        }
      } catch (error: any) {
        this.logger.warn(
          `Failed to evaluate ${job.title}: ${error.message}`,
        );
        // Keep job in fallback
        if (!this.config.freshersOnly) {
          scoredJobs.push({ job, score: 50 });
        }
      }
    }

    // Sort by score (highest first)
    scoredJobs.sort((a, b) => b.score - a.score);

    // Extract jobs and add relevance score
    return scoredJobs.map(({ job, score }) => ({
      ...job,
      relevanceScore: score,
    })) as JobPostDto[];
  }

  /**
   * Remove duplicate jobs (same title + company)
   */
  private removeDuplicates(jobs: JobPostDto[]): JobPostDto[] {
    const seen = new Set<string>();
    const unique: JobPostDto[] = [];

    for (const job of jobs) {
      const key = `${job.title}|${job.companyName}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(job);
      }
    }

    return unique;
  }

  /**
   * Extract relevant skills from job
   */
  async extractJobSkills(job: JobPostDto): Promise<string[]> {
    if (this.geminiService.isEnabled()) {
      return await this.geminiService.extractSkills(job);
    }

    // Fallback: basic skill extraction
    return this.basicSkillExtraction(job);
  }

  /**
   * Simple fallback skill extraction
   */
  private basicSkillExtraction(job: JobPostDto): string[] {
    const text = `${job.title} ${job.description || ''}`.toLowerCase();
    const skills = [
      'Python',
      'JavaScript',
      'TypeScript',
      'Java',
      'React',
      'Node.js',
      'AWS',
      'Docker',
      'Kubernetes',
      'SQL',
      'MongoDB',
      'PostgreSQL',
      'Git',
      'REST API',
      'GraphQL',
      'Linux',
    ];

    return skills
      .filter((skill) => text.includes(skill.toLowerCase()))
      .slice(0, 5);
  }
}
