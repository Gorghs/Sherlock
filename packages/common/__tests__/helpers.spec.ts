import { extractSalary, convertToAnnual } from '@sherlock/common';

describe('extractSalary', () => {
  it('should return nulls for null input', () => {
    const result = extractSalary(null);
    expect(result.minAmount).toBeNull();
    expect(result.maxAmount).toBeNull();
    expect(result.interval).toBeNull();
    expect(result.currency).toBeNull();
  });

  it('should return nulls for empty string', () => {
    const result = extractSalary('');
    expect(result.minAmount).toBeNull();
  });

  it('should parse a standard annual salary range', () => {
    const result = extractSalary('$100,000 - $150,000');
    expect(result.minAmount).toBe(100000);
    expect(result.maxAmount).toBe(150000);
    expect(result.interval).toBe('yearly');
    expect(result.currency).toBe('USD');
  });

  it('should parse salary with K suffix', () => {
    const result = extractSalary('$100K - $150K');
    expect(result.minAmount).toBe(100000);
    expect(result.maxAmount).toBe(150000);
    expect(result.interval).toBe('yearly');
  });

  it('should detect hourly rates below threshold', () => {
    const result = extractSalary('$25 - $45');
    expect(result.interval).toBe('hourly');
    expect(result.minAmount).toBe(25);
    expect(result.maxAmount).toBe(45);
  });

  it('should detect monthly rates', () => {
    const result = extractSalary('$5000 - $8000');
    expect(result.interval).toBe('monthly');
    expect(result.minAmount).toBe(5000);
    expect(result.maxAmount).toBe(8000);
  });

  it('should enforce annual salary when option is set', () => {
    const result = extractSalary('$25 - $45', { enforceAnnualSalary: true });
    expect(result.interval).toBe('hourly');
    // Should be annualized (25 * 2080 = 52000, 45 * 2080 = 93600)
    expect(result.minAmount).toBe(52000);
    expect(result.maxAmount).toBe(93600);
  });

  it('should return nulls for salary above upper limit', () => {
    const result = extractSalary('$1,000,000 - $2,000,000');
    expect(result.minAmount).toBeNull();
  });

  it('should return nulls for non-salary text', () => {
    const result = extractSalary('Looking for a software engineer');
    expect(result.minAmount).toBeNull();
  });

  it('should handle en-dash separator', () => {
    const result = extractSalary('$120,000–$180,000');
    expect(result.minAmount).toBe(120000);
    expect(result.maxAmount).toBe(180000);
  });

  it('should handle em-dash separator', () => {
    const result = extractSalary('$120,000—$180,000');
    expect(result.minAmount).toBe(120000);
    expect(result.maxAmount).toBe(180000);
  });
});

describe('convertToAnnual', () => {
  it('should convert hourly to annual', () => {
    const data = { interval: 'hourly', minAmount: 25, maxAmount: 50 };
    convertToAnnual(data);
    expect(data.interval).toBe('yearly');
    expect(data.minAmount).toBe(25 * 2080);
    expect(data.maxAmount).toBe(50 * 2080);
  });

  it('should convert monthly to annual', () => {
    const data = { interval: 'monthly', minAmount: 5000, maxAmount: 8000 };
    convertToAnnual(data);
    expect(data.interval).toBe('yearly');
    expect(data.minAmount).toBe(60000);
    expect(data.maxAmount).toBe(96000);
  });

  it('should convert weekly to annual', () => {
    const data = { interval: 'weekly', minAmount: 1000, maxAmount: 2000 };
    convertToAnnual(data);
    expect(data.interval).toBe('yearly');
    expect(data.minAmount).toBe(52000);
    expect(data.maxAmount).toBe(104000);
  });

  it('should convert daily to annual', () => {
    const data = { interval: 'daily', minAmount: 200, maxAmount: 400 };
    convertToAnnual(data);
    expect(data.interval).toBe('yearly');
    expect(data.minAmount).toBe(200 * 260);
    expect(data.maxAmount).toBe(400 * 260);
  });

  it('should not modify yearly data', () => {
    const data = { interval: 'yearly', minAmount: 100000, maxAmount: 150000 };
    convertToAnnual(data);
    expect(data.interval).toBe('yearly');
    expect(data.minAmount).toBe(100000);
    expect(data.maxAmount).toBe(150000);
  });
});
