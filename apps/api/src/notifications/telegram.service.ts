import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TelegramJobMessage {
  jobTitle: string;
  company: string;
  location: string;
  jobType: string; // 'Remote', 'Office', 'Hybrid'
  link: string;
  salary?: string;
  keywords: string[];
  source: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly enabled: boolean;
  private botToken: string;
  private chatId: string;
  private baseUrl: string;
  private readonly TIMEOUT_MS = 5000; // 5 second timeout
  private readonly MAX_RETRIES = 3; // Retry up to 2 times

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('telegram.enabled', true);
    this.botToken = this.configService.get<string>('telegram.botToken', '');
    this.chatId = this.configService.get<string>('telegram.chatId', '');
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;

    if (!this.enabled) {
      this.logger.warn('Telegram notifications are disabled by NOTIFY_TELEGRAM_ENABLED=false');
      return;
    }

    if (!this.botToken || !this.chatId) {
      this.logger.warn(
        'Telegram credentials missing. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars',
      );
    } else {
      this.logger.log('✓ Telegram credentials loaded');
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
  ): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === retries) throw error;
        const delay = Math.pow(2, i) * 500; // 500ms, 1s, 2s...
        this.logger.warn(
          `Telegram request failed (attempt ${i + 1}/${retries + 1}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Send a single job to Telegram with nice formatting
   */
  async sendJob(job: TelegramJobMessage): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('Skipping Telegram job send because notifications are disabled');
      return false;
    }

    if (!this.botToken || !this.chatId) {
      this.logger.warn('Telegram not configured');
      return false;
    }

    try {
      const message = this.formatJobMessage(job);
      await this.retryWithBackoff(async () => {
        await axios.post(`${this.baseUrl}/sendMessage`, {
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }, {
          timeout: this.TIMEOUT_MS,
        });
      });

      this.logger.log(`✓ Sent to Telegram: ${job.jobTitle} at ${job.company}`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send Telegram message after retries: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Send multiple jobs in a batch
   * Groups them nicely for readability
   */
  async sendBatch(jobs: TelegramJobMessage[]): Promise<number> {
    if (!this.enabled) {
      this.logger.debug('Skipping Telegram batch send because notifications are disabled');
      return 0;
    }

    let sentCount = 0;

    if (jobs.length === 0) {
      this.logger.log('No jobs to send');
      return 0;
    }

    // Send header
    const headerMsg = `
📋 <b>Daily Job Search Results</b>
━━━━━━━━━━━━━━━━━━━
🔍 Found <b>${jobs.length} jobs</b> matching your criteria
⏰ Generated at: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━
    `;

    await this.sendRawMessage(headerMsg);

    // Send each job
    for (const job of jobs) {
      const sent = await this.sendJob(job);
      if (sent) sentCount++;
      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Send footer
    const footerMsg = `
━━━━━━━━━━━━━━━━━━━
✅ Sent ${sentCount}/${jobs.length} job postings
🔔 Next search: Tomorrow at ${this.configService.get<string>('scheduler.time', '09:00')}
    `;

    await this.sendRawMessage(footerMsg);
    return sentCount;
  }

  /**
   * Send raw message
   */
  private async sendRawMessage(text: string): Promise<void> {
    if (!this.enabled) return;
    if (!this.botToken || !this.chatId) return;

    try {
      await this.retryWithBackoff(async () => {
        await axios.post(`${this.baseUrl}/sendMessage`, {
          chat_id: this.chatId,
          text: text.trim(),
          parse_mode: 'HTML',
        }, {
          timeout: this.TIMEOUT_MS,
        });
      });
    } catch (error: any) {
      this.logger.error(`Failed to send raw message after retries: ${error.message}`);
    }
  }

  /**
   * Format job as nice HTML message
   */
  private formatJobMessage(job: TelegramJobMessage): string {
    const safeTitle = this.escapeHtml(job.jobTitle);
    const safeCompany = this.escapeHtml(job.company || 'Unknown');
    const safeLocation = this.escapeHtml(job.location || 'Remote');
    const safeType = this.escapeHtml(job.jobType || 'Full-time');
    const safeSalary = job.salary ? this.escapeHtml(job.salary) : '';
    const safeSource = this.escapeHtml(job.source || 'Unknown');
    const safeKeywords = (job.keywords || []).map((kw) => this.escapeHtml(kw));
    const salary = safeSalary ? `\n💰 Salary: <b>${safeSalary}</b>` : '';
    const keywords =
      safeKeywords.length > 0
        ? `\n🏷️ Skills: ${safeKeywords.join(', ')}`
        : '';

    return `
<b>💼 ${safeTitle}</b>
📍 <b>${safeCompany}</b>
📌 Location: ${safeLocation}
🕐 Type: <b>${safeType}</b>${salary}${keywords}
📰 Source: ${safeSource}

<a href="${job.link}">🔗 Apply Now</a>
━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Send error/status messages
   */
  async sendStatus(message: string): Promise<void> {
    if (!this.enabled) {
      this.logger.debug('Skipping Telegram status send because notifications are disabled');
      return;
    }

    if (!this.botToken || !this.chatId) return;

    try {
      await this.retryWithBackoff(async () => {
        await axios.post(`${this.baseUrl}/sendMessage`, {
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }, {
          timeout: this.TIMEOUT_MS,
        });
      });
    } catch (error: any) {
      this.logger.error(`Failed to send status message after retries: ${error.message}`);
    }
  }
}
