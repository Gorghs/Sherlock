import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

interface SourceStats {
  source: string;
  runs: number;
  rawFoundTotal: number;
  qualifiedFoundTotal: number;
  newFoundTotal: number;
  deliveredRuns: number;
  noJobRuns: number;
  scoreEma: number;
  lastRunDate?: string;
}

interface SourceMemoryStore {
  version: number;
  updatedAt: string;
  stats: SourceStats[];
}

export interface SourceDailyMetric {
  source: string;
  rawFound: number;
  qualifiedFound: number;
  newFound: number;
}

export interface SourcePlan {
  ranked: string[];
  primary: string[];
  recrawl: string[];
}

@Injectable()
export class SourceReliabilityService {
  private readonly logger = new Logger(SourceReliabilityService.name);
  private readonly memoryPath: string;
  private readonly primaryLaneSize: number;
  private readonly recrawlLaneSize: number;
  private readonly staleAfterDays: number;

  constructor() {
    const dataDir = process.env.DATA_DIR || join(process.cwd(), 'data');
    this.memoryPath = join(dataDir, 'source-reliability.json');
    this.primaryLaneSize = Math.max(4, Number(process.env.SOURCE_PRIMARY_LANE_SIZE || '14'));
    this.recrawlLaneSize = Math.max(2, Number(process.env.SOURCE_RECRAWL_LANE_SIZE || '8'));
    this.staleAfterDays = Math.max(1, Number(process.env.SOURCE_STALE_AFTER_DAYS || '3'));
    this.ensureStoreExists();
  }

  getSourcePlan(defaultSources: string[], dateIso: string): SourcePlan {
    const normalized = [...new Set(defaultSources.map((s) => String(s || '').trim().toLowerCase()))].filter(Boolean);
    const store = this.readStore();
    const statMap = new Map(store.stats.map((s) => [s.source, s]));

    for (const source of normalized) {
      if (!statMap.has(source)) {
        statMap.set(source, {
          source,
          runs: 0,
          rawFoundTotal: 0,
          qualifiedFoundTotal: 0,
          newFoundTotal: 0,
          deliveredRuns: 0,
          noJobRuns: 0,
          scoreEma: 0,
        });
      }
    }

    const daySeed = Number(dateIso.replace(/-/g, '')) || 0;
    const rankedEntries = normalized
      .map((source, idx) => {
        const stat = statMap.get(source)!;
        return {
          source,
          score: stat.scoreEma,
          runs: stat.runs,
          lastRunDate: stat.lastRunDate,
          offset: (daySeed + idx * 31) % 1000,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.runs !== b.runs) return a.runs - b.runs;
        return a.offset - b.offset;
      });

    const ranked = rankedEntries.map((entry) => entry.source);
    const primary = ranked.slice(0, Math.min(this.primaryLaneSize, ranked.length));

    const staleCutoff = this.computeStaleCutoffIso(dateIso);
    const stale = rankedEntries
      .filter((entry) => !entry.lastRunDate || entry.lastRunDate < staleCutoff)
      .map((entry) => entry.source)
      .filter((source) => !primary.includes(source));

    const lowScoreTail = [...rankedEntries]
      .reverse()
      .map((entry) => entry.source)
      .filter((source) => !primary.includes(source));

    const recrawlCandidates = [...new Set([...stale, ...lowScoreTail])];
    const recrawl = recrawlCandidates.slice(0, Math.min(this.recrawlLaneSize, recrawlCandidates.length));

    return { ranked, primary, recrawl };
  }

  recordDailyOutcome(metrics: SourceDailyMetric[], dateIso: string, delivered: boolean, noJobs: boolean): void {
    if (!metrics.length) {
      return;
    }

    const store = this.readStore();
    const statMap = new Map(store.stats.map((s) => [s.source, s]));

    for (const metric of metrics) {
      const source = String(metric.source || '').trim().toLowerCase();
      if (!source) {
        continue;
      }

      const existing = statMap.get(source) || {
        source,
        runs: 0,
        rawFoundTotal: 0,
        qualifiedFoundTotal: 0,
        newFoundTotal: 0,
        deliveredRuns: 0,
        noJobRuns: 0,
        scoreEma: 0,
      };

      existing.runs += 1;
      existing.rawFoundTotal += metric.rawFound;
      existing.qualifiedFoundTotal += metric.qualifiedFound;
      existing.newFoundTotal += metric.newFound;
      existing.deliveredRuns += delivered ? 1 : 0;
      existing.noJobRuns += noJobs ? 1 : 0;
      existing.lastRunDate = dateIso;

      const runScore =
        metric.qualifiedFound * 2 +
        metric.newFound * 4 +
        (delivered ? 2 : 0) -
        (metric.rawFound === 0 ? 2 : 0) -
        (noJobs ? 1 : 0);

      const alpha = 0.25;
      existing.scoreEma = existing.runs === 1 ? runScore : existing.scoreEma * (1 - alpha) + runScore * alpha;

      statMap.set(source, existing);
    }

    const next: SourceMemoryStore = {
      version: 1,
      updatedAt: new Date().toISOString(),
      stats: [...statMap.values()].sort((a, b) => b.scoreEma - a.scoreEma),
    };

    this.writeStore(next);
  }

  getSnapshot(): SourceMemoryStore {
    return this.readStore();
  }

  private computeStaleCutoffIso(dateIso: string): string {
    const date = new Date(`${dateIso}T00:00:00.000Z`);
    const cutoff = new Date(date.getTime() - this.staleAfterDays * 24 * 60 * 60 * 1000);
    return cutoff.toISOString().slice(0, 10);
  }

  private ensureStoreExists(): void {
    const folder = dirname(this.memoryPath);
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
    }

    if (!existsSync(this.memoryPath)) {
      this.writeStore({
        version: 1,
        updatedAt: new Date().toISOString(),
        stats: [],
      });
    }
  }

  private readStore(): SourceMemoryStore {
    try {
      const raw = readFileSync(this.memoryPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.stats)) {
        return {
          version: 1,
          updatedAt: String(parsed.updatedAt || ''),
          stats: parsed.stats,
        };
      }
    } catch (error: any) {
      this.logger.warn(`Failed to read source reliability store, recreating: ${error.message}`);
    }

    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      stats: [],
    };
  }

  private writeStore(store: SourceMemoryStore): void {
    const folder = dirname(this.memoryPath);
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
    }

    writeFileSync(this.memoryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf-8');
  }
}
