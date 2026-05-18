import { Controller, Get, Logger, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { TelegramService } from '../notifications/telegram.service';
import { EmailService } from '../notifications/email.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly config: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly emailService: EmailService,
  ) {}

  @Get('/')
  @ApiExcludeEndpoint()
  root(@Res() res: Response) {
    const candidates = [
      join(process.cwd(), 'apps', 'web', 'index.html'),
      join(process.cwd(), 'dist', 'apps', 'web', 'index.html'),
      join(__dirname, '../../../web/index.html'),
    ];
    const indexFile = candidates.find((file) => existsSync(file));

    if (indexFile) {
      return res.sendFile(indexFile);
    }

    return res.status(404).json({
      error: 'Not Found',
      detail: 'Frontend index.html was not found',
      statusCode: 404,
      path: '/',
      timestamp: new Date().toISOString(),
    });
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns the health status of the API including uptime, version, memory usage.',
  })
  health() {
    const mem = process.memoryUsage();
    return {
      status: 'healthy',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.config.get<string>('npm_package_version', '0.1.0'),
      environment: this.config.get<string>('environment', 'development'),
      timestamp: new Date().toISOString(),
      memoryUsage: {
        rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
        heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
        heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
      },
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping', description: 'Simple ping endpoint for monitoring.' })
  ping() {
    return { status: 'pong', timestamp: new Date().toISOString() };
  }

  @Get('config-check')
  @ApiOperation({
    summary: 'Config Check',
    description: 'Check if environment variables are loaded (shows masked credentials).',
  })
  configCheck() {
    const telegramBotToken = this.config.get<string>('telegram.botToken', '');
    const telegramChatId = this.config.get<string>('telegram.chatId', '');
    const geminiApiKey = this.config.get<string>('gemini.apiKey', '');
    const emailGmailUser = this.config.get<string>('email.gmailUser', '');
    const emailRecipient = this.config.get<string>('email.recipientEmail', '');

    return {
      telegramBotToken: telegramBotToken ? `✓ Loaded (${telegramBotToken.substring(0, 10)}...)` : '✗ Missing',
      telegramChatId: telegramChatId ? `✓ Loaded: ${telegramChatId}` : '✗ Missing',
      geminiApiKey: geminiApiKey ? `✓ Loaded (${geminiApiKey.substring(0, 10)}...)` : '✗ Missing',
      emailGmailUser: emailGmailUser ? `✓ Loaded (${emailGmailUser.substring(0, 10)}...)` : '✗ Missing',
      emailRecipientEmail: emailRecipient ? `✓ Loaded (${emailRecipient.substring(0, 10)}...)` : '✗ Missing',
      scheduler: {
        enabled: this.config.get<boolean>('scheduler.enabled', true),
        time: this.config.get<string>('scheduler.time', '09:00'),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-telegram')
  @ApiOperation({
    summary: 'Test Telegram',
    description: 'Send a test message to Telegram to verify credentials.',
  })
  async testTelegram() {
    this.logger.log('Testing Telegram credentials...');
    await this.telegramService.sendStatus(
      '✅ <b>Telegram Integration Test Successful!</b>\n\n' +
      'Your job search automation system is working correctly.\n' +
      'You will receive daily job alerts at configured time.',
    );

    return {
      success: true,
      message: 'Test message sent to Telegram! Check your Telegram for the message.',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test-email')
  @ApiOperation({
    summary: 'Test Email',
    description: 'Send a test email to verify email credentials.',
  })
  async testEmail() {
    this.logger.log('Testing Email credentials...');
    const recipientEmail = this.config.get<string>('email.recipientEmail', '');
    
    if (!recipientEmail) {
      return {
        success: false,
        message: 'Email recipient not configured. Set EMAIL_RECIPIENT_EMAIL env var.',
        timestamp: new Date().toISOString(),
      };
    }

    const success = await this.emailService.sendTestEmail(recipientEmail);
    
    // Count recipients for display
    const recipients = recipientEmail.split(',').filter(e => e.trim()).length;
    const recipientsDisplay = recipientEmail.split(',').map(e => e.trim()).join(', ');

    return {
      success,
      message: success 
        ? `✅ Test email sent to ${recipients} recipient(s): ${recipientsDisplay}! Check your inbox.`
        : `❌ Failed to send test email to ${recipientsDisplay}. Check logs for details.`,
      timestamp: new Date().toISOString(),
    };
  }
}
