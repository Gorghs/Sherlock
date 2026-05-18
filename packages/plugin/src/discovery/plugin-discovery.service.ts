import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { IScraper } from '@sherlock/models';
import { SOURCE_PLUGIN_METADATA } from '../decorators/source-plugin.decorator';
import { IPluginMetadata } from '../interfaces/plugin-metadata.interface';
import { PluginRegistry } from '../registry/plugin-registry.service';

/**
 * Automatically discovers all NestJS providers decorated with @SourcePlugin()
 * and registers them into the PluginRegistry.
 *
 * This runs at bootstrap (OnModuleInit) after all modules are loaded,
 * ensuring every source plugin is available before the first request.
 */
@Injectable()
export class PluginDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(PluginDiscoveryService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly registry: PluginRegistry,
  ) {}

  onModuleInit() {
    this.discoverPlugins();
  }

  private discoverPlugins(): void {
    const providers = this.discovery.getProviders();
    let discovered = 0;

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || !wrapper.metatype) continue;

      const metadata = this.reflector.get<IPluginMetadata>(
        SOURCE_PLUGIN_METADATA,
        wrapper.metatype,
      );

      if (!metadata) continue;

      // Validate that the instance implements IScraper
      const scraper = instance as IScraper;
      if (typeof scraper.scrape !== 'function') {
        this.logger.warn(
          `Plugin ${metadata.name} (${metadata.site}) is decorated with @SourcePlugin() but does not implement IScraper.scrape()`,
        );
        continue;
      }

      this.registry.register(metadata, scraper);
      discovered++;
    }

    this.logger.log(
      `Discovered and registered ${discovered} source plugins`,
    );
  }
}
