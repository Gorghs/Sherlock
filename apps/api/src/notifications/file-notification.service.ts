import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TelegramJobMessage } from './telegram.service';

export interface SavedJobRecord extends TelegramJobMessage {
  savedAt: string;
  expiresAt: string;
}

@Injectable()
export class FileNotificationService {
  private readonly logger = new Logger(FileNotificationService.name);
  private readonly dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  private readonly jobsFile = path.join(this.dataDir, 'jobs-found.json');
  private readonly retentionMs = 24 * 60 * 60 * 1000;

  constructor(private configService: ConfigService) {
    this.ensureDataDir();
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create data directory: ${error}`);
    }
  }

  /**
   * Save a job to file (fallback when Telegram is unavailable)
   */
  async saveJob(job: TelegramJobMessage): Promise<boolean> {
    try {
      const jobs = await this.loadJobs();
      const savedAt = new Date().toISOString();
      jobs.push({
        ...job,
        savedAt,
        expiresAt: new Date(Date.parse(savedAt) + this.retentionMs).toISOString(),
      });

      await fs.writeFile(this.jobsFile, JSON.stringify(jobs, null, 2));
      this.logger.log(`✓ Job saved to file: ${job.jobTitle} at ${job.company}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to save job to file: ${error.message}`);
      return false;
    }
  }

  /**
   * Save multiple jobs
   */
  async saveBatch(jobs: TelegramJobMessage[]): Promise<number> {
    let savedCount = 0;
    for (const job of jobs) {
      const saved = await this.saveJob(job);
      if (saved) savedCount++;
    }
    return savedCount;
  }

  /**
   * Load all saved jobs
   */
  async loadJobs(): Promise<SavedJobRecord[]> {
    try {
      const content = await fs.readFile(this.jobsFile, 'utf-8');
      const parsed = JSON.parse(content);
      const jobs = Array.isArray(parsed) ? parsed : [];
      const now = Date.now();
      const activeJobs = jobs.filter((job) => this.isJobWithinRetention(job, now));

      if (activeJobs.length !== jobs.length) {
        await fs.writeFile(this.jobsFile, JSON.stringify(activeJobs, null, 2));
      }

      return activeJobs;
    } catch {
      return [];
    }
  }

  /**
   * Get jobs found in the last 24 hours
   */
  async getJobsFoundToday(): Promise<SavedJobRecord[]> {
    const jobs = await this.loadJobs();
    const now = Date.now();
    return jobs.filter((job) => this.isJobWithinRetention(job, now));
  }

  private isJobWithinRetention(job: Partial<SavedJobRecord>, nowMs: number): job is SavedJobRecord {
    const savedAt = job?.savedAt ? Date.parse(job.savedAt) : Number.NaN;
    if (!Number.isFinite(savedAt)) {
      return false;
    }

    return nowMs - savedAt < this.retentionMs;
  }

  /**
   * Send status to file
   */
  async sendStatus(message: string): Promise<void> {
    const statusFile = path.join(this.dataDir, 'status.log');
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      await fs.appendFile(statusFile, logEntry);
      this.logger.log(`Status logged: ${message}`);
    } catch (error: any) {
      this.logger.error(`Failed to log status: ${error.message}`);
    }
  }
}
