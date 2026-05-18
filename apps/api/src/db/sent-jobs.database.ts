import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SentJob {
  jobId: string; // Unique identifier (hash of title + company + source)
  jobTitle: string;
  company: string;
  source: string;
  sentAt: string; // ISO timestamp
  url: string;
}

/**
 * Simple file-based database to track which jobs have been sent
 * Stores data in a JSON file for persistence even if the server restarts
 */
@Injectable()
export class SentJobsDatabase {
  private readonly logger = new Logger(SentJobsDatabase.name);
  private dataFile: string;
  private jobs: Map<string, SentJob> = new Map();
  private readonly resendAfterDays: number;

  constructor() {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    this.dataFile = path.join(dataDir, 'sent-jobs.json');
    const configuredDays = Number(process.env.SENT_JOB_RESEND_AFTER_DAYS ?? '3');
    this.resendAfterDays = Number.isFinite(configuredDays) && configuredDays > 0 ? configuredDays : 3;
    this.initialize();
  }

  /**
   * Initialize database on startup
   */
  private async initialize() {
    try {
      // Create data folder if it doesn't exist
      const dataDir = path.dirname(this.dataFile);
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch {
        // Folder might already exist
      }

      // Load existing jobs
      try {
        const content = await fs.readFile(this.dataFile, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          for (const job of parsed) {
            this.jobs.set(job.jobId, job);
          }
        }
        this.logger.log(`Loaded ${this.jobs.size} previously sent jobs`);
      } catch {
        // File doesn't exist yet, that's ok
        this.logger.log('Starting with empty sent jobs database');
      }
    } catch (error: any) {
      this.logger.error(`Failed to initialize database: ${error.message}`);
    }
  }

  /**
   * Check if a job was already sent
   */
  isJobSent(jobTitle: string, company: string, source: string, url: string = ''): boolean {
    const now = new Date();

    const urlAwareId = this.generateJobId(jobTitle, company, source, url);
    const urlAwareJob = this.jobs.get(urlAwareId);
    if (urlAwareJob && this.isWithinCooldown(urlAwareJob.sentAt, now)) {
      return true;
    }

    const legacyId = this.generateJobId(jobTitle, company, source);
    const legacyJob = this.jobs.get(legacyId);
    if (legacyJob && this.isWithinCooldown(legacyJob.sentAt, now)) {
      return true;
    }

    // Some records use URL-aware ids; fall back to scanning by normalized fields.
    const normalizedTitle = String(jobTitle || '').trim().toLowerCase();
    const normalizedCompany = String(company || '').trim().toLowerCase();
    const normalizedSource = String(source || '').trim().toLowerCase();
    const normalizedUrl = String(url || '').trim().toLowerCase();
    for (const job of this.jobs.values()) {
      const sentRecently = this.isWithinCooldown(job.sentAt, now);
      if (!sentRecently) {
        continue;
      }

      const jobUrl = String(job.url || '').trim().toLowerCase();
      if (normalizedUrl && jobUrl && normalizedUrl === jobUrl) {
        return true;
      }

      if (
        String(job.jobTitle || '').trim().toLowerCase() === normalizedTitle &&
        String(job.company || '').trim().toLowerCase() === normalizedCompany &&
        String(job.source || '').trim().toLowerCase() === normalizedSource
      ) {
        return true;
      }
    }

    return false;
  }

  private isWithinCooldown(sentAtIso: string, now: Date): boolean {
    const sentAt = new Date(sentAtIso);
    if (Number.isNaN(sentAt.getTime())) {
      return false;
    }

    const ageMs = now.getTime() - sentAt.getTime();
    const maxAgeMs = this.resendAfterDays * 24 * 60 * 60 * 1000;
    return ageMs < maxAgeMs;
  }

  /**
   * Mark a job as sent
   */
  async markJobSent(
    jobTitle: string,
    company: string,
    source: string,
    url: string,
  ): Promise<void> {
    const jobId = this.generateJobId(jobTitle, company, source, url);

    const sentJob: SentJob = {
      jobId,
      jobTitle,
      company,
      source,
      sentAt: new Date().toISOString(),
      url,
    };

    this.jobs.set(jobId, sentJob);
    await this.persist();
  }

  /**
   * Get all sent jobs
   */
  getAllSentJobs(): SentJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get sent jobs count
   */
  getCount(): number {
    return this.jobs.size;
  }

  /**
   * Clear jobs older than X days
   */
  async cleanupOldJobs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removed = 0;
    for (const [jobId, job] of this.jobs.entries()) {
      const sentDate = new Date(job.sentAt);
      if (sentDate < cutoffDate) {
        this.jobs.delete(jobId);
        removed++;
      }
    }

    if (removed > 0) {
      await this.persist();
      this.logger.log(
        `Cleaned up ${removed} jobs older than ${daysToKeep} days`,
      );
    }

    return removed;
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(jobTitle: string, company: string, source: string, url: string = ''): string {
    // Simple hash function
    const combined = `${jobTitle}|${company}|${source}|${url}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${source}_${Math.abs(hash)}`;
  }

  /**
   * Persist data to file
   */
  private async persist(): Promise<void> {
    try {
      const data = Array.from(this.jobs.values());
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(this.dataFile, content, 'utf-8');
    } catch (error: any) {
      this.logger.error(`Failed to persist database: ${error.message}`);
    }
  }
}
