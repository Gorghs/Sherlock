import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { FileNotificationService } from './file-notification.service';
import { EmailService } from './email.service';

@Module({
  providers: [TelegramService, FileNotificationService, EmailService],
  exports: [TelegramService, FileNotificationService, EmailService],
})
export class NotificationsModule {}
