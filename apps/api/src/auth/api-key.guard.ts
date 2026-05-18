import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard that validates the `x-api-key` header against a configured allow-list.
 *
 * Behaviour:
 *  - If auth is disabled (`ENABLE_API_KEY_AUTH=false`) → allow all
 *  - If no API keys are configured → allow all
 *  - Otherwise require a valid key
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const enabled: boolean = this.config.get<boolean>('auth.enabled', false);
    const apiKeys: string[] = this.config.get<string[]>('auth.apiKeys', []);
    const headerName: string = this.config.get<string>(
      'auth.headerName',
      'x-api-key',
    );

    // Skip auth when disabled or no keys configured
    if (!enabled || apiKeys.length === 0) {
      this.logger.debug(
        'API key validation skipped — auth disabled or no keys configured',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers[headerName.toLowerCase()] as
      | string
      | undefined;

    if (!providedKey) {
      this.logger.warn('Missing API key in request');
      throw new ForbiddenException('Missing API Key');
    }

    if (!apiKeys.includes(providedKey)) {
      this.logger.warn('Invalid API key provided');
      throw new ForbiddenException('Invalid API Key');
    }

    this.logger.debug('Valid API key provided');
    return true;
  }
}
