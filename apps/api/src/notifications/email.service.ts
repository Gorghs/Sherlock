import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { TelegramJobMessage } from './telegram.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly enabled: boolean;
  private transporter?: nodemailer.Transporter;
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('email.enabled', true);

    if (!this.enabled) {
      this.logger.warn('Email notifications are disabled by NOTIFY_EMAIL_ENABLED=false');
      return;
    }

    const gmailUser = this.configService.get<string>('email.gmailUser', '');
    const gmailPassword = this.configService.get<string>('email.gmailPassword', '');

    if (!gmailUser || !gmailPassword) {
      this.logger.warn('Email credentials missing. Set EMAIL_GMAIL_USER and EMAIL_GMAIL_PASSWORD env vars');
    } else {
      // Create transporter for Gmail
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPassword, // Use App Password, not regular password
        },
      });

      this.logger.log(`✓ Email service initialized for ${gmailUser}`);
      this.verifyTransporter().catch(() => {
        // Verification failures are already logged in verifyTransporter().
      });
    }
  }

  private async verifyTransporter(): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log('✓ SMTP transporter verification successful');
    } catch (error: any) {
      this.logger.error(`SMTP transporter verification failed: ${error.message}`);
    }
  }

  /**
   * Send jobs via email to one or more recipients
   */
  async sendJobsEmail(jobs: TelegramJobMessage[], recipientEmail: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('Skipping jobs email send because notifications are disabled');
      return false;
    }

    if (!this.transporter) {
      this.logger.warn('Email service not configured');
      return false;
    }

    try {
      const htmlContent = this.generateJobsHtml(jobs);
      const recipients = this.parseRecipients(recipientEmail);

      if (recipients.length === 0) {
        this.logger.warn('No valid recipient emails provided');
        return false;
      }

      let successCount = 0;
      for (const recipient of recipients) {
        try {
          const mailOptions = {
            from: this.configService.get<string>('email.gmailUser'),
            to: recipient,
            subject: `🔍 Daily Job Search Results - ${jobs.length} Jobs Found`,
            html: htmlContent,
            text: `Daily Job Search Results: ${jobs.length} jobs found. View details in HTML version.`,
          };
          await this.transporter.sendMail(mailOptions);
          successCount += 1;
        } catch (error: any) {
          this.logger.error(`Failed to send email to ${recipient}: ${error.message}`);
        }
      }

      if (successCount === 0) {
        this.logger.error('Failed to send jobs email to all recipients');
        return false;
      }

      this.logger.log(`✓ Email sent to ${successCount}/${recipients.length} recipient(s) - ${jobs.length} jobs`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a plain status email (used for no-results/failure updates)
   */
  async sendStatusEmail(subject: string, message: string, recipientEmail: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('Skipping status email send because notifications are disabled');
      return false;
    }

    if (!this.transporter) {
      this.logger.warn('Email service not configured');
      return false;
    }

    try {
      const recipients = this.parseRecipients(recipientEmail);

      if (recipients.length === 0) {
        this.logger.warn('No valid recipient emails provided');
        return false;
      }

      let successCount = 0;
      for (const recipient of recipients) {
        try {
          const mailOptions = {
            from: this.configService.get<string>('email.gmailUser'),
            to: recipient,
            subject,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; color: #0f172a;">${this.escapeHtml(subject)}</h3>
                <p style="margin: 0 0 10px 0; color: #334155;">${this.escapeHtml(message)}</p>
                <p style="margin: 0; font-size: 12px; color: #64748b;">Timestamp: ${new Date().toLocaleString()}</p>
              </div>
            `,
            text: `${subject}\n\n${message}\n\nTimestamp: ${new Date().toLocaleString()}`,
          };
          await this.transporter.sendMail(mailOptions);
          successCount += 1;
        } catch (error: any) {
          this.logger.error(`Failed to send status email to ${recipient}: ${error.message}`);
        }
      }

      if (successCount === 0) {
        this.logger.error('Failed to send status email to all recipients');
        return false;
      }

      this.logger.log(`✓ Status email sent to ${successCount}/${recipients.length} recipient(s)`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send status email: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate HTML email with jobs
   */
  private generateJobsHtml(jobs: TelegramJobMessage[]): string {
    const jobsHtml = jobs
      .slice(0, 50) // Limit to first 50 jobs per email
      .map(
        (job, index) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 15px; text-align: center; background: #f9f9f9; font-weight: bold;">${index + 1}</td>
        <td style="padding: 15px;">
          <h3 style="margin: 0 0 5px 0; color: #1976d2;">
            <a href="${this.safeUrl(job.link)}" style="color: #1976d2; text-decoration: none;">${this.escapeHtml(job.jobTitle)}</a>
          </h3>
          <p style="margin: 5px 0; font-size: 14px;">
            <strong>${this.escapeHtml(job.company)}</strong> • ${this.escapeHtml(job.location)}
          </p>
          <p style="margin: 5px 0; font-size: 13px; color: #666;">
            <strong>Type:</strong> ${this.escapeHtml(job.jobType)} 
            ${job.salary ? `| <strong>Salary:</strong> ${this.escapeHtml(job.salary)}` : ''}
          </p>
          ${job.keywords?.length > 0 ? `<p style="margin: 5px 0; font-size: 12px;">
            <strong>Skills:</strong> ${job.keywords.map((kw) => this.escapeHtml(kw)).join(', ')}
          </p>` : ''}
          <p style="margin: 5px 0; font-size: 12px; color: #888;">
            <strong>Source:</strong> ${this.escapeHtml(job.source)}
          </p>
        </td>
      </tr>
    `,
      )
      .join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Daily Job Search Results</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          color: #1976d2;
          font-size: 28px;
        }
        .header p {
          margin: 10px 0 0 0;
          color: #666;
          font-size: 14px;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-box {
          background: #f0f7ff;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #1976d2;
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #1976d2;
          color: white;
          padding: 15px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
        }
        a {
          color: #1976d2;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .cta-button {
          display: inline-block;
          background: #1976d2;
          color: white;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          margin-right: 10px;
        }
        .cta-button:hover {
          background: #1565c0;
        }
        .footer {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 6px;
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 30px;
        }
        .next-search {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔍 Daily Job Search Results</h1>
          <p>Found ${jobs.length} jobs matching your criteria</p>
          <p style="font-size: 12px; margin-top: 10px;">${new Date().toLocaleString()}</p>
        </div>

        <div class="stats">
          <div class="stat-box">
            <div class="stat-number">${jobs.length}</div>
            <div class="stat-label">Jobs Found</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${new Set(jobs.map((j) => j.company)).size}</div>
            <div class="stat-label">Companies</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${new Set(jobs.map((j) => j.source)).size}</div>
            <div class="stat-label">Sources</div>
          </div>
        </div>

        <div class="next-search">
          <strong>⏰ Next Search:</strong> Tomorrow at 9:00 AM
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Job Details</th>
            </tr>
          </thead>
          <tbody>
            ${jobsHtml}
          </tbody>
        </table>

        <div class="footer">
          <p>
            This is an automated email from your Daily Job Search automation system.
            <br>
            Jobs are searched daily at 9:00 AM and filtered for fresher-level positions.
            <br>
            <a href="https://karthick-rnen.onrender.com">Portfolio</a>
            &nbsp;|&nbsp;
            <a href="https://www.linkedin.com/in/karthickv4/">LinkedIn</a>
            <br>
            <br>
            © 2026 Job Search Automation. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Send test email to one or more recipients
   */
  async sendTestEmail(recipient: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.debug('Skipping test email send because notifications are disabled');
      return false;
    }

    if (!this.transporter) {
      this.logger.warn('Email service not configured');
      return false;
    }

    try {
      const recipients = this.parseRecipients(recipient);

      if (recipients.length === 0) {
        this.logger.warn('No valid recipient emails provided');
        return false;
      }

      let successCount = 0;
      for (const to of recipients) {
        try {
          const mailOptions = {
            from: this.configService.get<string>('email.gmailUser'),
            to,
            subject: '✅ Test Email - Job Search Automation',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                <h2 style="color: #1976d2;">✅ Email Configuration Successful!</h2>
                <p>Your job search automation system is now configured to send daily emails.</p>
                <p><strong>What to expect:</strong></p>
                <ul>
                  <li>📧 Daily emails at 9:00 AM with job listings</li>
                  <li>🔍 Jobs filtered for fresher-level positions</li>
                  <li>🌍 Results from 160+ job sources worldwide</li>
                  <li>💾 No duplicates (tracks previously sent jobs)</li>
                </ul>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                  Email sent at: ${new Date().toLocaleString()}
                </p>
              </div>
            `,
            text: `Email configuration successful. Timestamp: ${new Date().toLocaleString()}`,
          };
          await this.transporter.sendMail(mailOptions);
          successCount += 1;
        } catch (error: any) {
          this.logger.error(`Failed to send test email to ${to}: ${error.message}`);
        }
      }

      if (successCount === 0) {
        return false;
      }

      this.logger.log(`✓ Test email sent to ${successCount}/${recipients.length} recipient(s)`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send test email: ${error.message}`);
      return false;
    }
  }

  private parseRecipients(raw: string): string[] {
    return String(raw || '')
      .split(/[;,\n\r]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => this.emailRegex.test(email));
  }

  private escapeHtml(value: string): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private safeUrl(url: string): string {
    const value = String(url || '').trim();
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    return '#';
  }
}
