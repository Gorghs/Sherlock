import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { JobPostDto } from '@sherlock/models';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private apiKey: string;
  private modelName = 'gemini-1.5-flash';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('gemini.apiKey', '');
  }

  isEnabled(): boolean {
    return !!this.apiKey;
  }

  /**
   * Use Gemini to evaluate job relevance for a fresher
   * Returns a score 0-100 indicating how relevant the job is
   */
  async evaluateJobRelevance(job: JobPostDto): Promise<number> {
    if (!this.isEnabled()) return 50; // Neutral score if API not configured

    try {
      const prompt = `
You are a career advisor for a fresher (student with no prior work experience) in computer science/tech.

Evaluate how relevant and suitable this job is for them on a scale of 0-100:
- Entry-level/internship positions: High score (80-100)
- Junior positions open to freshers: Medium-high score (60-79)
- Mid-level requiring experience: Low score (20-59)
- Senior/specialized roles: Very low score (0-19)

Job Title: ${job.title}
Company: ${job.companyName || 'Unknown'}
Description: ${job.description?.substring(0, 500) || 'N/A'}
Job Type: ${job.jobType?.join(', ') || 'Unknown'}

Consider:
1. Does it mention "fresher", "entry-level", "no experience required", or "internship"?
2. Are required skills reasonable for a beginner (basic programming, not 5+ years)?
3. Is the job in an in-demand field (web dev, data science, cloud, etc.)?

Reply with ONLY a number between 0 and 100.
      `.trim();

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 10,
          },
        },
        {
          params: { key: this.apiKey },
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const content =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '50';
      const score = parseInt(content.match(/\d+/)?.[0] || '50', 10);

      return Math.min(100, Math.max(0, score));
    } catch (error: any) {
      this.logger.warn(
        `Gemini evaluation failed for ${job.title}: ${error.message}`,
      );
      return 50; // Default neutral score on error
    }
  }

  /**
   * Use Gemini to extract key skills from job description
   */
  async extractSkills(job: JobPostDto): Promise<string[]> {
    if (!this.isEnabled()) {
      // Fallback: basic keyword extraction
      return this.basicSkillExtraction(job);
    }

    try {
      const prompt = `
Extract the top 5-7 required technical skills from this job posting.
Reply with ONLY a comma-separated list of skills, nothing else.

Job Title: ${job.title}
Description: ${job.description?.substring(0, 800) || 'N/A'}
      `.trim();

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          },
        },
        {
          params: { key: this.apiKey },
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const content =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return content
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .slice(0, 7);
    } catch (error: any) {
      this.logger.warn(`Gemini skill extraction failed: ${error.message}`);
      return this.basicSkillExtraction(job);
    }
  }

  /**
   * Simple fallback skill extraction
   */
  private basicSkillExtraction(job: JobPostDto): string[] {
    const text = `${job.title} ${job.description}`.toLowerCase();
    const skills = [
      'Python',
      'JavaScript',
      'TypeScript',
      'Java',
      'React',
      'Node.js',
      'AWS',
      'Docker',
      'Kubernetes',
      'SQL',
      'MongoDB',
      'Git',
      'REST API',
      'GraphQL',
      'C++',
      'Go',
      'Rust',
      'Vue.js',
      'Angular',
      'Django',
      'FastAPI',
      'PostgreSQL',
      'Redis',
      'Linux',
    ];

    return skills
      .filter((skill) => text.includes(skill.toLowerCase()))
      .slice(0, 7);
  }

  /**
   * Check if job is genuinely for freshers/interns
   */
  async isForFreshers(job: JobPostDto): Promise<boolean> {
    if (!this.isEnabled()) {
      return this.basicFresherCheck(job);
    }

    try {
      const score = await this.evaluateJobRelevance(job);
      return score >= 60; // Consider relevant if score >= 60
    } catch {
      return this.basicFresherCheck(job);
    }
  }

  /**
   * Simple fallback fresher check
   */
  private basicFresherCheck(job: JobPostDto): boolean {
    const text = `${job.title} ${job.description}`.toLowerCase();
    const fresherKeywords = [
      'fresher',
      'entry level',
      'internship',
      'intern',
      'no experience',
      'recent graduate',
      'junior',
      'graduate',
      'beginner',
      'trainee',
    ];

    return fresherKeywords.some((kw) => text.includes(kw));
  }
}
