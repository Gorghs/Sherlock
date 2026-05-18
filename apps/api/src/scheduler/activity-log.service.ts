import { Injectable } from '@nestjs/common';

export type ActivityLevel = 'info' | 'warn' | 'error';

export interface ActivityEntry {
  id: number;
  timestamp: string;
  level: ActivityLevel;
  message: string;
}

@Injectable()
export class ActivityLogService {
  private readonly entries: ActivityEntry[] = [];
  private readonly maxEntries = 300;
  private seq = 1;

  info(message: string): void {
    this.push('info', message);
  }

  warn(message: string): void {
    this.push('warn', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  getRecent(limit: number = 150): ActivityEntry[] {
    const normalizedLimit = Math.max(1, Math.min(limit, this.maxEntries));
    return this.entries.slice(-normalizedLimit);
  }

  clear(): void {
    this.entries.length = 0;
  }

  private push(level: ActivityLevel, message: string): void {
    const entry: ActivityEntry = {
      id: this.seq++,
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
  }
}
