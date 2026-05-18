import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

interface SubagentStats {
  query: string;
  runs: number;
  rawFoundTotal: number;
  qualifiedFoundTotal: number;
  newFoundTotal: number;
  deliveredRuns: number;
  noJobRuns: number;
  scoreEma: number;
  lastRunDate?: string;
}

interface MemoryStore {
  version: number;
  updatedAt: string;
  stats: SubagentStats[];
}

export interface SubagentMemorySnapshot {
  version: number;
  updatedAt: string;
  stats: Array<{
    query: string;
    runs: number;
    rawFoundTotal: number;
    qualifiedFoundTotal: number;
    newFoundTotal: number;
    deliveredRuns: number;
    noJobRuns: number;
    scoreEma: number;
    lastRunDate?: string;
  }>;
}

export interface SubagentDailyMetric {
  query: string;
  rawFound: number;
  qualifiedFound: number;
  newFound: number;
}

@Injectable()
export class SubagentMemoryService {
  private readonly logger = new Logger(SubagentMemoryService.name);
  private readonly memoryPath: string;

  constructor() {
    const dataDir = process.env.DATA_DIR || join(process.cwd(), 'data');
    this.memoryPath = join(dataDir, 'subagent-memory.json');
    this.ensureStoreExists();
  }

  getRankedQueries(defaultQueries: string[], dateIso: string): string[] {
    const store = this.readStore();
    const statMap = new Map(store.stats.map((s) => [s.query, s]));

    for (const query of defaultQueries) {
      if (!statMap.has(query)) {
        statMap.set(query, {
          query,
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
    const scored = defaultQueries
      .map((query, idx) => {
        const s = statMap.get(query)!;
        const exploreOffset = (daySeed + idx * 17) % 1000;
        return {
          query,
          score: s.scoreEma,
          runs: s.runs,
          exploreOffset,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.runs !== b.runs) {
          return a.runs - b.runs;
        }
        return a.exploreOffset - b.exploreOffset;
      });

    // Light exploration: rotate by day so low-run queries still get top slots over time.
    const rotation = defaultQueries.length > 0 ? daySeed % defaultQueries.length : 0;
    const rotated = [...scored.slice(rotation), ...scored.slice(0, rotation)];
    const ranked = rotated.map((item) => item.query);

    this.logger.log(`Adaptive subagent query order: ${ranked.join(' | ')}`);
    return ranked;
  }

  recordDailyOutcome(metrics: SubagentDailyMetric[], dateIso: string, delivered: boolean, noJobs: boolean): void {
    if (!metrics.length) {
      return;
    }

    const store = this.readStore();
    const statMap = new Map(store.stats.map((s) => [s.query, s]));

    for (const metric of metrics) {
      const existing = statMap.get(metric.query) || {
        query: metric.query,
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
        (metric.rawFound === 0 ? 1 : 0) -
        (noJobs ? 1 : 0);

      const alpha = 0.25;
      existing.scoreEma = existing.runs === 1 ? runScore : existing.scoreEma * (1 - alpha) + runScore * alpha;

      statMap.set(metric.query, existing);
    }

    const next: MemoryStore = {
      version: 1,
      updatedAt: new Date().toISOString(),
      stats: [...statMap.values()].sort((a, b) => b.scoreEma - a.scoreEma),
    };

    this.writeStore(next);
  }

  getSnapshot(): SubagentMemorySnapshot {
    const store = this.readStore();
    return {
      version: store.version,
      updatedAt: store.updatedAt,
      stats: [...store.stats],
    };
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

  private readStore(): MemoryStore {
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
      this.logger.warn(`Failed to read subagent memory, recreating: ${error.message}`);
    }

    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      stats: [],
    };
  }

  private writeStore(store: MemoryStore): void {
    const folder = dirname(this.memoryPath);
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
    }

    writeFileSync(this.memoryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf-8');
  }
}
