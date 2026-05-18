# Sherlock - The Smarter Job Hunter

> Stop browsing 160 job sites every day. Let Sherlock do it for you.



## What is Sherlock?

Sherlock is an intelligent job aggregation engine that searches 160+ job boards **simultaneously** and brings you the best results in seconds. Whether you're using the REST API, GraphQL, CLI, or email digests, you get the same powerful job discovery engine.

No logins. No captchas. No BS. Just jobs.

---

## Why Sherlock Exists

Job hunting sucks. You need to juggle LinkedIn, Indeed, Glassdoor, GitHub Jobs, Upwork, Naukri, BDJobs, and 150+ other sites. Each one has a different format, different filters, different ways to apply.

Sherlock solves this by building a **single unified interface** to all of them. Search once, get results from everywhere.

---

## What You Get

✨ **160+ Job Sources** — LinkedIn, Indeed, Glassdoor, GitHub, Upwork, Naukri, BDJobs, Wellfound, RemoteOK, Stack Overflow, and tons more  

🚀 **Fast** — All sources searched in parallel. Get results in ~3-5 seconds  

🤖 **AI-Powered Scoring** — Google Gemini rates job relevance so you see what matters  

📧 **Daily Emails** — Automatic job digests delivered every morning to multiple recipients  

🔌 **Multiple Interfaces** — REST API, GraphQL, CLI, or MCP Protocol. Use what works for you  

🎯 **No Duplicates** — Smart deduplication means you never see the same job twice  

⚙️ **Zero Setup** — Most job boards work without API keys. Just run it  

🧩 **Extensible** — Add new sources as modular packages  

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/Gorghs/Sherlock.git
cd Sherlock
npm install
npm run build
```

### 2. Run

```bash
npm run start:dev
```

The API is now at `http://localhost:3001`.

### 3. Search

**Via REST API:**

```bash
curl -X POST http://localhost:3001/api/jobs/search \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "Product Manager",
    "siteNames": ["linkedin", "indeed"],
    "resultsWanted": 50
  }'
```

**Via CLI:**

```bash
npm run cli -- search -q "Backend Engineer" --sites "github,dice,techcrunch"
```

**Via GraphQL:**

```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ searchJobs(searchTerm: \"Data Scientist\", limit: 20) { title company location } }"
  }'
```

**Via Daily Email:**

Set up your `.env` file (see below) and Sherlock will automatically email you the best matches every morning at 9 AM UTC.

---

## Configuration

Create a `.env` file:

```bash
# Email setup (optional, for daily digests)
EMAIL_GMAIL_USER=your-email@gmail.com
EMAIL_GMAIL_PASSWORD=your-app-password
EMAIL_RECIPIENT_EMAIL=you@example.com,team@company.com

# AI filtering (optional)
GEMINI_API_KEY=your-gemini-api-key

# Scheduler (optional)
SCHEDULER_ENABLED=true
SCHEDULER_TIME=0 9 * * *
```

That's it. Email recipients can be comma-separated. No databases. No complicated setup.

---

## How It Works

```
1. You search for "Product Manager"
                   ↓
2. Sherlock queries 160+ sources in parallel
   - LinkedIn, Indeed, Glassdoor, GitHub, Upwork, etc.
                   ↓
3. Results normalized into standard format
                   ↓
4. AI scores each job for relevance (0-100)
                   ↓
5. Duplicates removed
                   ↓
6. Results delivered via API, email, CLI, or GraphQL
```

---

## Example Response

```json
{
  "jobs": [
    {
      "jobTitle": "Senior Product Manager",
      "company": "TechCorp",
      "location": "San Francisco, CA",
      "jobType": "Full-time",
      "salary": "$180,000 - $220,000",
      "description": "Lead product strategy...",
      "url": "https://example.com/jobs/123",
      "source": "LinkedIn",
      "relevanceScore": 92,
      "postedDate": "2026-04-01"
    }
  ],
  "total": 342,
  "searchTime": 3240
}
```

---

## Supported Job Boards

**Popular Platforms:** LinkedIn, Indeed, Glassdoor, ZipRecruiter, CareerBuilder, SimplyHired, Monster

**Tech-Focused:** GitHub Jobs, Stack Overflow, Dice, Wellfound, Startup.jobs, Hacker News

**Remote:** RemoteOK, Remotive, FlexJobs, Working Nomads, NoDesk, We Work Remotely

**Freelance:** Upwork, Freelancer, Toptal, Fiverr, PeoplePerHour

**International:** Naukri (India), BDJobs (Bangladesh), Bayt (Middle East), JobStreet (Asia-Pacific)

**Specialized:** Dribbble (Design), CryptoJobsList (Web3), FOSS Jobs (Open Source), Behance (Creative)

**ATS Platforms:** Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Rippling, Workday, BambooHR, and 30+ more

---

## Deployment

### Local Development

```bash
npm run start:dev
```

### Docker

```bash
docker build -t sherlock .
docker run -p 3001:3001 sherlock
```

### Render.com / Heroku

1. Push code to GitHub
2. Create new Web Service on Render/Heroku
3. Add environment variables
4. Deploy

---

## Usage Examples

**Search for remote frontend jobs:**

```bash
curl -X POST http://localhost:3001/api/jobs/search \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "Frontend Engineer",
    "location": "Remote",
    "siteNames": ["linkedin", "indeed", "remoteok"],
    "resultsWanted": 30
  }'
```

**CLI with email recipient:**

```bash
npm run cli -- search -q "UX Designer" --sites "dribbble,behance" -f table
```

**Get salary insights:**

```bash
curl -X POST http://localhost:3001/api/jobs/analyze \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "DevOps", "siteNames": ["indeed"]}'
```

---

## Open Source & Community

This project is **MIT licensed**. You're free to:

- ✅ Use it for yourself
- ✅ Deploy it for your team
- ✅ Modify and remix the code
- ✅ Add new job sources
- ✅ Integrate it into other tools

---

## Response Schema

```
JobPost
├── id
├── site
├── title
├── companyName
├── companyUrl
├── jobUrl
├── jobUrlDirect
├── location
│   ├── city
│   ├── state
│   └── country
├── description
├── datePosted
├── isRemote
├── jobType[]                    fulltime, parttime, internship, contract
├── compensation
│   ├── interval                 yearly, monthly, weekly, daily, hourly
│   ├── minAmount
│   ├── maxAmount
│   └── currency
├── emails[]
├── listingType
│
├── department                   (ATS, Company scrapers)
├── team                         (ATS, Company scrapers)
├── atsId                        (ATS scrapers)
├── atsType                      (ATS scrapers)
├── employmentType               (ATS, Company scrapers)
├── applyUrl                     (ATS scrapers)
│
├── jobLevel                     (LinkedIn)
├── jobFunction                  (LinkedIn)
├── companyIndustry              (LinkedIn, Indeed)
│
├── companyAddresses             (Indeed)
├── companyNumEmployees          (Indeed)
├── companyRevenue               (Indeed)
├── companyDescription           (Indeed)
├── companyLogo                  (Indeed)
├── bannerPhotoUrl               (Indeed)
│
├── skills[]                     (Naukri)
├── experienceRange              (Naukri)
├── companyRating                (Naukri)
├── companyReviewsCount          (Naukri)
├── vacancyCount                 (Naukri)
└── workFromHomeType             (Naukri)
```

---

## Project Structure

```
ever-jobs/
├── apps/
│   ├── api/                          NestJS REST API
│   │   └── src/
│   │       ├── main.ts               Bootstrap + Swagger + CORS
│   │       ├── app.module.ts         Root module (config, guards, interceptors)
│   │       ├── auth/                 API key authentication guard
│   │       ├── cache/                In-memory TTL cache service
│   │       ├── config/               Configuration module (env vars)
│   │       ├── filters/              Global exception filter
│   │       ├── health/               Health check endpoints
│   │       ├── interceptors/         Request logging interceptor
│   │       └── jobs/
│   │           ├── jobs.controller.ts    POST /api/jobs/search + /analyze
│   │           ├── jobs.service.ts       Concurrent aggregation + post-processing
│   │           └── jobs.module.ts        Imports all source + analytics modules
│   │
│   └── cli/                          nest-commander CLI application
│       └── src/
│           ├── main.ts               CLI bootstrap (CommandFactory)
│           ├── cli.module.ts         Imports all source + analytics modules
│           └── commands/
│               ├── search.command.ts    CLI search with --analyze, --bd, 30+ options
│               └── compare.command.ts   Multi-site comparison with table output
│
├── packages/
│   ├── models/                       @ever-jobs/models
│   ├── common/                       @ever-jobs/common (HttpClient, converters, utils)
│   ├── analytics/                    @ever-jobs/analytics
│   ├── source-*/                     Search source modules (×105)
│   ├── source-ats-*/                 ATS source modules (×38)
│   └── source-company-*/             Company-specific source modules (×15)
│
├── .github/
│   ├── workflows/ci.yml              CI pipeline (build, type-check, Docker)
│   ├── CODE_OF_CONDUCT.md
│   ├── CONTRIBUTING.md
│   ├── SECURITY.md
│   └── SUPPORT.md
│
├── docs/                             Project documentation
│   ├── ARCHITECTURE_OVERVIEW.md
│   ├── API_CHANGELOG.md
│   ├── DEPLOYMENT.md
│   ├── FAQ.md
│   ├── GLOSSARY.md
│   ├── PERFORMANCE_TUNING.md
│   ├── ROADMAP.md
│   ├── SECURITY_GUIDELINES.md
│   └── UPGRADE_GUIDE.md
│
├── Dockerfile                        Multi-stage Docker build
├── docker-compose.yml                Production deployment
├── docker-compose.dev.yml            Development with hot-reload
├── Makefile                          Dev & Docker shortcuts
├── .env.example                      Environment variable template
├── tool_manifest.json                Machine-readable tool metadata for MCP/LLMs
├── package.json
├── tsconfig.base.json
├── nx.json
└── nest-cli.json
```

---

## Architecture

### Modular Design

Each job board source is an independent NestJS package that implements the `IScraper` interface:

```typescript
interface IScraper {
  scrape(input: ScraperInputDto): Promise<JobResponseDto>;
}
```

This means you can:

- **Import individual packages** into your own NestJS application
- **Add new sources** by creating a new package that implements `IScraper`
- **Test sources independently** without the API layer

### Concurrent Execution

The `JobsService` orchestrator runs all selected sources concurrently using `Promise.allSettled`. Individual source failures don't affect other sources — results from successful sources are still returned.

### Routing Logic

The service intelligently routes requests based on the input:

- **No `siteType` + no `companySlug`** → Runs search + company scrapers (ATS scrapers skipped — they need a company slug)
- **`companySlug` provided** → Runs ATS scrapers only (Ashby, Greenhouse, Lever, etc.)
- **Explicit `siteType`** → Runs exactly the specified scrapers, regardless of other parameters

### Post-Processing Pipeline

After searching, the orchestrator applies post-processing:

1. **Tag jobs with source** — Each job is tagged with its originating site
2. **Salary enrichment** — For USA jobs without direct compensation, salary is extracted from the description text
3. **Annual salary normalization** — When `enforceAnnualSalary` is enabled, hourly/monthly/weekly wages are converted to annual equivalents
4. **Sorting** — Results are sorted by site name, then by date posted (newest first)

### HTTP Client

A custom `HttpClient` wraps Axios with:

- **Rotating proxy support** — Round-robin through HTTP/HTTPS/SOCKS5 proxies
- **Rate limiting** — Configurable min/max delay between requests
- **Automatic retries** — Configurable retry logic with exponential backoff
- **Custom CA certificates** — For enterprise proxy setups
- **Configurable timeouts** — Per-request and global timeout settings

---

## Supported Countries

### LinkedIn & Google

Search globally using the `location` parameter.

### ZipRecruiter

Searches US and Canada using the `location` parameter.

### Indeed & Glassdoor

Support 65+ countries via the `country` parameter. Use `location` to narrow within a country.

|                |               |               |             |
| -------------- | ------------- | ------------- | ----------- |
| Argentina      | Australia\*   | Austria\*     | Bahrain     |
| Bangladesh     | Belgium\*     | Brazil\*      | Canada\*    |
| Chile          | China         | Colombia      | Costa Rica  |
| Czech Republic | Denmark       | Ecuador       | Egypt       |
| Finland        | France\*      | Germany\*     | Greece      |
| Hong Kong\*    | Hungary       | India\*       | Indonesia   |
| Ireland\*      | Israel        | Italy\*       | Japan       |
| Kuwait         | Luxembourg    | Malaysia      | Mexico\*    |
| Morocco        | Netherlands\* | New Zealand\* | Nigeria     |
| Norway         | Oman          | Pakistan      | Panama      |
| Peru           | Philippines   | Poland        | Portugal    |
| Qatar          | Romania       | Saudi Arabia  | Singapore\* |
| South Africa   | South Korea   | Spain\*       | Sweden      |
| Switzerland\*  | Taiwan        | Thailand      | Turkey      |
| Ukraine        | UAE           | UK\*          | USA\*       |
| Uruguay        | Venezuela     | Vietnam\*     |             |

_\* indicates Glassdoor support_

### Bayt

Searches internationally using `searchTerm` only.

### Naukri

India-specific. Supports INR salary parsing (Lakhs/Crores).

### BDJobs

Bangladesh-specific.

| Source                | ATS Platform          | Method                    | Notable Users                                       |
| --------------------- | --------------------- | ------------------------- | --------------------------------------------------- |
| **Greenhouse**        | Greenhouse            | REST API                  | Airbnb, Coinbase, Datadog, DoorDash, HubSpot, Notion, Stripe |
| **Lever**             | Lever                 | REST API                  | Netflix, Shopify, KPMG, Eventbrite, Atlassian       |
| **Workday**           | Workday               | REST API                  | Amazon, Salesforce, Target, Bank of America, Visa   |
| **Ashby**             | Ashby                 | REST API                  | Ramp, Figma, Linear, Vercel, Plaid                  |
| **SmartRecruiters**   | SmartRecruiters       | REST API                  | Visa, Bosch, LinkedIn, Skechers, Equinox            |
| **Jobvite**           | Jobvite               | REST API                  | Logitech, Schneider Electric, Zappos                |
| **Workable**          | Workable              | GraphQL API               | Sephora, Bain Capital, Forbes                       |
| **SAP SuccessFactors** | SAP SuccessFactors    | OData API + HTML fallback | Siemens, Accenture, Deloitte, EY                    |
| **Oracle Taleo**      | Oracle Taleo          | REST API (JSON)           | JPMorgan Chase, PepsiCo, Intel, Cisco               |
| **iCIMS**             | iCIMS                 | Playwright + JSON gateway | UPS, Uber, Johnson & Johnson, Target                |
| **ADP Recruiting**    | ADP Workforce Now     | REST API                  | Major enterprises across industries                 |
| **UKG (UltiPro)**     | UKG Pro Recruiting    | REST API                  | Major healthcare and manufacturing organizations    |
| **Rippling**          | Rippling              | REST API                  |                                                     |
| **Recruitee**         | Recruitee             | REST API                  |                                                     |
| **Teamtailor**        | Teamtailor            | REST API                  |                                                     |
| **BambooHR**          | BambooHR              | REST API (JSON)           |                                                     |
| **Personio**          | Personio              | XML feed                  |                                                     |
| **JazzHR**            | JazzHR                | HTML scraping             |                                                     |
| **Breezy HR**         | Breezy HR             | REST API                  |                                                     |
| **Comeet**            | Comeet                | REST API                  |                                                     |
| **Pinpoint**          | Pinpoint              | REST API                  |                                                     |
| **Manatal**           | Manatal               | REST API                  | 160K+ organizations (Asia-Pacific, global SMB)      |
| **Paylocity**         | Paylocity             | REST API (GUID)           | 30K+ US mid-market companies                        |
| **Freshteam**         | Freshworks            | REST API (Bearer)         | 1K-5K companies globally                            |
| **Bullhorn**          | Bullhorn              | REST API (Corp Token)     | 10K+ staffing agencies (#1 staffing ATS)            |
| **Trakstar Hire**     | Trakstar              | REST API (Basic Auth)     | 5K+ companies (formerly RecruiterBox)               |
| **HiringThing**       | HiringThing           | REST API (Basic Auth)     | 500+ companies (white-label ATS)                    |
| **Loxo**              | Loxo                  | REST API                  | 1K-3K recruiting firms                              |
| **Fountain**          | Fountain              | REST API (Bearer)         | 300+ enterprises (high-volume hourly hiring)        |
| **Deel**              | Deel                  | REST API (Bearer)         | 35K+ customers (global hiring/EOR platform)         |
| **Phenom**            | Phenom People         | REST API                  | 900+ enterprises (Boeing, Hilton, Nestle, Verizon)  |
| **Jobylon**           | Jobylon               | JSON Feed                 | Hundreds of Nordic companies                        |
| **Homerun**           | Homerun               | REST API (Bearer)         | Thousands of European SMBs                          |
### Arbeitnow

European-focused job board with free JSON API (`arbeitnow.com/api/job-board-api`). Supports page-based pagination. No authentication required.

### We Work Remotely

Popular remote job board. Uses RSS feed (`weworkremotely.com/remote-jobs.rss`) — parsed without external XML libraries. Category-specific feeds also available. No authentication required.

### Recruitee (ATS)

Recruitee ATS integration. Per-company public API at `{slug}.recruitee.com/api/offers`. Provides salary data when available. Requires `companySlug` parameter.

### Teamtailor (ATS)

Teamtailor ATS integration. Per-company career page API. Requires `companySlug` parameter.

### USAJobs

US government job board with free API. Requires `USAJOBS_API_KEY` and `USAJOBS_EMAIL` environment variables. Register at [developer.usajobs.gov](https://developer.usajobs.gov/APIRequest/Index). Returns full descriptions with salary data from position remuneration fields. Credentials can also be passed per-request via the `auth.usajobs` field in the request body.

### Adzuna

Multi-country job aggregator covering 12+ countries. Requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` environment variables. Register at [developer.adzuna.com](https://developer.adzuna.com/signup). Free tier limited to 25 requests/min and 250 requests/day. Uses the `country` parameter to select the appropriate API endpoint. Credentials can also be passed per-request via the `auth.adzuna` field in the request body.

### Reed

UK-focused job board. Requires `REED_API_KEY` environment variable. Register at [reed.co.uk/developers](https://www.reed.co.uk/developers). Uses HTTP Basic Auth. Provides salary data in GBP. Credentials can also be passed per-request via the `auth.reed` field in the request body.

### Jooble

Job aggregator covering 70+ countries. Requires `JOOBLE_API_KEY` environment variable. Register at [jooble.org/api/about](https://jooble.org/api/about). Uses POST requests with the API key in the URL path. Salary data parsed from string format. Credentials can also be passed per-request via the `auth.jooble` field in the request body.

### CareerJet

Job aggregator covering 80+ countries with locale-based searches. Requires `CAREERJET_AFFID` environment variable. Register at [careerjet.com/partners](https://www.careerjet.com/partners/). Requires `clientIp` parameter for proper operation (falls back to `127.0.0.1`). Supports the `proxies` parameter for residential IP rotation. Credentials can also be passed per-request via the `auth.careerjet` field in the request body.

---

## Using Individual Packages

Each source package can be used independently in your own NestJS application:

```typescript
import { Module } from "@nestjs/common";
import { LinkedInModule, LinkedInService } from "@ever-jobs/source-linkedin";
import { ScraperInputDto } from "@ever-jobs/models";

@Module({
  imports: [LinkedInModule],
})
export class MyModule {
  constructor(private readonly linkedin: LinkedInService) {}

  async searchLinkedIn() {
    const input = new ScraperInputDto({
      searchTerm: "TypeScript developer",
      location: "Remote",
      resultsWanted: 10,
      linkedinFetchDescription: true,
    });

    const response = await this.linkedin.scrape(input);
    console.log(`Found ${response.jobs.length} LinkedIn jobs`);
  }
}
```

---

## Tips & Limitations

> **Indeed** is generally the most reliable source with minimal rate limiting.

> **LinkedIn** is the most restrictive — it typically rate-limits around the 10th page from a single IP. Using proxies is strongly recommended.

> **Google Jobs** requires specific search syntax. For best results, search for Google Jobs in your browser, apply filters, and use the resulting search query as `googleSearchTerm`.

> **All job boards** cap results at approximately 1,000 jobs per search query.

### Indeed Limitations

Only **one** of these filters can be active per search:

- `hoursOld`
- `jobType` + `isRemote`
- `easyApply`

### LinkedIn Limitations

Only **one** of these filters can be active per search:

- `hoursOld`
- `easyApply`

---

## FAQ

**Q: Indeed is returning unrelated jobs?**
Indeed searches job descriptions too. Use `-` to exclude terms and `""` for exact match:

```
"engineering intern" software summer (java OR python OR c++) 2025 -tax -marketing
```

**Q: Getting 429 (Too Many Requests)?**
You've been rate-limited. Solutions:

- Use `rateDelayMin` and `rateDelayMax` to add configurable delay between requests
- Use the `proxies` parameter to rotate IPs
- Reduce `resultsWanted`

**Q: No results from Google?**
Google requires very specific query syntax. Search for jobs on Google in your browser, then copy the exact search box text into `googleSearchTerm`.

---

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npx tsc --project tsconfig.base.json --noEmit
```

### Production Start

```bash
npm run start:prod
```

### Run Tests

```bash
# Run all unit tests
npm test

# Run specific test suite
npx jest packages/common/__tests__/helpers.spec.ts --no-coverage

# Run with verbose output
npx jest --verbose --no-coverage --testPathPatterns __tests__
```

---

## ChatGPT & LLM Integration

Ever Jobs is designed to be used as a tool by ChatGPT, Claude, and other LLMs.

### Quick Start

```bash
# Basic search via JSON stdin
echo '{"searchTerm": "data scientist", "siteType": ["indeed"], "resultsWanted": 5}' | npm run cli -- search --stdin

# Search with analysis
npm run cli -- search --search-term "devops" --site indeed --analyze

# BD intelligence mode
npm run cli -- search --search-term "machine learning" --site linkedin --bd

# Multi-site comparison
npm run cli -- compare --search-term "backend developer" --results 10

# API endpoint for analysis
curl -X POST http://localhost:3001/api/jobs/analyze \
  -H 'Content-Type: application/json' \
  -d '{"searchTerm": "fullstack", "siteType": ["indeed"], "resultsWanted": 10}'
```

### Analytics Features

| Feature         | CLI Flag          | API Endpoint             | Description                           |
| --------------- | ----------------- | ------------------------ | ------------------------------------- |
| Summary stats   | `--analyze`       | `POST /api/jobs/analyze` | Remote %, salary range, top companies |
| BD intelligence | `--bd`            | —                        | Company analysis with hiring velocity |
| Site comparison | `compare` command | —                        | Cross-board metrics comparison table  |

### Prompt Templates

**Job Market Research:**

```
Search for "senior react developer" jobs in San Francisco on Indeed and LinkedIn.
Use the analyze flag to get summary statistics.

Input: {"searchTerm": "senior react developer", "location": "San Francisco, CA", "siteType": ["indeed", "linkedin"], "resultsWanted": 20}
```

**BD Intelligence:**

```
Find companies hiring AI/ML engineers. Identify which companies have the most
open positions and what locations they're hiring in.

Input: {"searchTerm": "AI ML engineer", "siteType": ["indeed", "linkedin"], "resultsWanted": 50}
Use --bd flag for company-level analysis.
```

**Multi-Site Comparison:**

```
Compare results for "data engineer" across all job boards.
Which board has the most listings? Best salary coverage?

Run: npm run cli -- compare --search-term "data engineer" --results 15
```

### Resources

| File                                       | Description                                    |
| ------------------------------------------ | ---------------------------------------------- |
| [`tool_manifest.json`](tool_manifest.json) | Machine-readable tool metadata for MCP servers |

---

## Contributing

Found a bug? Want to add a job source? Have feature ideas?

- **Issues**: Report bugs or request features
- **Pull Requests**: Fix bugs or add new job sources
- **Discussion**: Talk about ideas before implementing

---

## Architecture

Sherlock is built with NestJS and TypeScript:

- **Modular design** — Each job source is an independent package
- **Concurrent execution** — All sources run in parallel
- **Request optimization** — Smart caching, rate limiting, proxy rotation
- **Post-processing** — Salary enrichment, deduplication, AI scoring

---

## License

MIT — Use Sherlock freely. We built it because job hunting is exhausting, and everyone deserves a better way to find work.

---

Built with NestJS, TypeScript, and caffeine ☕
