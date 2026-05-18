import { CompensationInterval, JobType, getJobTypeFromString } from '@sherlock/models';

/**
 * Extract email addresses from text.
 * Replaces Python's extract_emails_from_text().
 */
export function extractEmails(text: string | null): string[] | null {
  if (!text) return null;
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(regex);
  return matches && matches.length > 0 ? matches : null;
}

/**
 * Extract salary information from a description string.
 * Returns [interval, minAmount, maxAmount, currency] or nulls.
 * Replaces Python's extract_salary().
 */
export function extractSalary(
  salaryStr: string | null,
  options?: {
    lowerLimit?: number;
    upperLimit?: number;
    hourlyThreshold?: number;
    monthlyThreshold?: number;
    enforceAnnualSalary?: boolean;
  },
): { interval: string | null; minAmount: number | null; maxAmount: number | null; currency: string | null } {
  const result = { interval: null as string | null, minAmount: null as number | null, maxAmount: null as number | null, currency: null as string | null };

  if (!salaryStr) return result;

  const lowerLimit = options?.lowerLimit ?? 1000;
  const upperLimit = options?.upperLimit ?? 700000;
  const hourlyThreshold = options?.hourlyThreshold ?? 350;
  const monthlyThreshold = options?.monthlyThreshold ?? 30000;
  const enforceAnnualSalary = options?.enforceAnnualSalary ?? false;

  const pattern = /\$(\d+(?:,\d+)?(?:\.\d+)?)([kK]?)\s*[-—–]\s*(?:\$)?(\d+(?:,\d+)?(?:\.\d+)?)([kK]?)/;
  const match = salaryStr.match(pattern);

  if (!match) return result;

  let minSalary = parseFloat(match[1].replace(/,/g, ''));
  let maxSalary = parseFloat(match[3].replace(/,/g, ''));

  if (match[2].toLowerCase() === 'k' || match[4].toLowerCase() === 'k') {
    minSalary *= 1000;
    maxSalary *= 1000;
  }

  let interval: string;
  let annualMinSalary: number;
  let annualMaxSalary: number | null = null;

  if (minSalary < hourlyThreshold) {
    interval = CompensationInterval.HOURLY;
    annualMinSalary = minSalary * 2080;
    annualMaxSalary = maxSalary < hourlyThreshold ? maxSalary * 2080 : null;
  } else if (minSalary < monthlyThreshold) {
    interval = CompensationInterval.MONTHLY;
    annualMinSalary = minSalary * 12;
    annualMaxSalary = maxSalary < monthlyThreshold ? maxSalary * 12 : null;
  } else {
    interval = CompensationInterval.YEARLY;
    annualMinSalary = minSalary;
    annualMaxSalary = maxSalary;
  }

  if (annualMaxSalary === null) return result;

  if (
    annualMinSalary >= lowerLimit &&
    annualMinSalary <= upperLimit &&
    annualMaxSalary >= lowerLimit &&
    annualMaxSalary <= upperLimit &&
    annualMinSalary < annualMaxSalary
  ) {
    return {
      interval,
      minAmount: enforceAnnualSalary ? annualMinSalary : minSalary,
      maxAmount: enforceAnnualSalary ? annualMaxSalary : maxSalary,
      currency: 'USD',
    };
  }

  return result;
}

/**
 * Extract job types from a description using keyword matching.
 * Replaces Python's extract_job_type().
 */
export function extractJobType(description: string | null): JobType[] | null {
  if (!description) return null;

  const keywords: Record<string, RegExp> = {
    [JobType.FULL_TIME]: /full\s?time/i,
    [JobType.PART_TIME]: /part\s?time/i,
    [JobType.INTERNSHIP]: /internship/i,
    [JobType.CONTRACT]: /contract/i,
  };

  const types: JobType[] = [];
  for (const [jobType, pattern] of Object.entries(keywords)) {
    if (pattern.test(description)) {
      types.push(jobType as JobType);
    }
  }

  return types.length > 0 ? types : null;
}

/**
 * Resolve a raw job type string to a JobType enum value.
 * Replaces Python's get_enum_from_job_type().
 */
export function getEnumFromJobType(jobTypeStr: string): JobType | null {
  return getJobTypeFromString(jobTypeStr);
}

/**
 * Parse a currency string removing non-numeric characters.
 * Replaces Python's currency_parser().
 */
export function parseCurrency(curStr: string): number {
  let cleaned = curStr.replace(/[^-0-9.,]/g, '');
  // Remove thousands separators
  const last3 = cleaned.slice(-3);
  const before = cleaned.slice(0, -3);
  cleaned = before.replace(/[.,]/g, '') + last3;

  if (last3.includes('.')) {
    return Math.round(parseFloat(cleaned) * 100) / 100;
  } else if (last3.includes(',')) {
    return Math.round(parseFloat(cleaned.replace(',', '.')) * 100) / 100;
  }
  return Math.round(parseFloat(cleaned) * 100) / 100;
}

/**
 * Convert a job's salary to annual equivalent.
 * Mutates the input object. Replaces Python's convert_to_annual().
 */
export function convertToAnnual(jobData: {
  interval: string;
  minAmount: number;
  maxAmount: number;
}): void {
  const multipliers: Record<string, number> = {
    hourly: 2080,
    monthly: 12,
    weekly: 52,
    daily: 260,
  };
  const multiplier = multipliers[jobData.interval];
  if (multiplier) {
    jobData.minAmount *= multiplier;
    jobData.maxAmount *= multiplier;
    jobData.interval = 'yearly';
  }
}

/**
 * Desired column order for output (matches Python desired_order list).
 */
export const DESIRED_ORDER: string[] = [
  'id', 'site', 'jobUrl', 'jobUrlDirect', 'title', 'company', 'location',
  'datePosted', 'jobType', 'salarySource', 'interval', 'minAmount', 'maxAmount',
  'currency', 'isRemote', 'jobLevel', 'jobFunction', 'listingType', 'emails',
  'description', 'companyIndustry', 'companyUrl', 'companyLogo', 'companyUrlDirect',
  'companyAddresses', 'companyNumEmployees', 'companyRevenue', 'companyDescription',
  'skills', 'experienceRange', 'companyRating', 'companyReviewsCount',
  'vacancyCount', 'workFromHomeType',
];

/**
 * Sleep utility for adding delays between requests.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sleep for a random duration between min and max milliseconds.
 */
export function randomSleep(minMs: number, maxMs: number): Promise<void> {
  const duration = Math.random() * (maxMs - minMs) + minMs;
  return sleep(duration);
}
