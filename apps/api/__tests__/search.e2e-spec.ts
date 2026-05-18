/**
 * E2E tests for POST /api/jobs/search.
 *
 * Tests the full aggregated search flow through the API layer including
 * JSON response, pagination, CSV export, and multi-source aggregation.
 *
 * Uses "google" as the test source — free, no API key, fast.
 */
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-app';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');

describe('POST /api/jobs/search (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return jobs in standard {count, jobs, cached} shape', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        searchTerm: 'software engineer',
        siteType: ['google'],
        resultsWanted: 3,
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('jobs');
    expect(res.body).toHaveProperty('cached');
    expect(typeof res.body.count).toBe('number');
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(typeof res.body.cached).toBe('boolean');

    if (res.body.jobs.length > 0) {
      const job = res.body.jobs[0];
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('jobUrl');
      expect(typeof job.title).toBe('string');
      expect(typeof job.jobUrl).toBe('string');
    }
  });

  it('should return paginated response when ?paginate=true', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search?paginate=true&page=1&page_size=2')
      .send({
        searchTerm: 'software engineer',
        siteType: ['google'],
        resultsWanted: 5,
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('total_pages');
    expect(res.body).toHaveProperty('current_page', 1);
    expect(res.body).toHaveProperty('page_size', 2);
    expect(res.body).toHaveProperty('jobs');
    expect(res.body.jobs.length).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('next_page');
    expect(res.body).toHaveProperty('previous_page');
  });

  it('should return CSV when ?format=csv', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search?format=csv')
      .send({
        searchTerm: 'software engineer',
        siteType: ['google'],
        resultsWanted: 3,
      })
      .expect(201);

    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('jobs.csv');
    const csvText = Buffer.isBuffer(res.body)
      ? res.body.toString('utf-8')
      : res.text;
    // CSV contains either comma-separated data rows or "No results" when empty
    expect(typeof csvText).toBe('string');
    expect(csvText.length).toBeGreaterThan(0);
  });

  it('should handle search with no results gracefully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        searchTerm: 'xyznonexistentjob999qqq',
        siteType: ['google'],
        resultsWanted: 1,
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('jobs');
    expect(Array.isArray(res.body.jobs)).toBe(true);
  });

  it('should aggregate results from multiple sources', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs/search')
      .send({
        searchTerm: 'devops',
        siteType: ['google', 'indeed'],
        resultsWanted: 3,
      })
      .expect(201);

    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(0);
  });
});
