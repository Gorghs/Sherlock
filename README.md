# Sherlock

Sherlock is a job aggregation engine that searches many job boards in parallel and exposes the results through API, CLI, GraphQL, and MCP integrations.

## Features

- Search across 160+ job sources
- Normalized results with deduplication
- Optional AI-based relevance scoring
- Email digests and scheduler support
- Modular source packages

## Quick Start

```bash
npm install
npm run build
npm run start:dev
```

The API runs on `http://localhost:3001`.

## Configuration

Create a `.env` file if you want email digests or AI scoring:

```bash
EMAIL_GMAIL_USER=your-email@gmail.com
EMAIL_GMAIL_PASSWORD=your-app-password
EMAIL_RECIPIENT_EMAIL=you@example.com
GEMINI_API_KEY=your-gemini-api-key
SCHEDULER_ENABLED=true
SCHEDULER_TIME=0 9 * * *
```


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


## Tips & Limitations

> **Indeed** is generally the most reliable source with minimal rate limiting.

> **LinkedIn** is the most restrictive — it typically rate-limits around the 10th page from a single IP. Using proxies is strongly recommended.

> **Google Jobs** requires specific search syntax. For best results, search for Google Jobs in your browser, apply filters, and use the resulting search query as `googleSearchTerm`.

> **All job boards** cap results at approximately 1,000 jobs per search query.


```
"engineering intern" software summer (java OR python OR c++) 2025 -tax -marketing
```
## Development

### Build

```bash
npm run build
```



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
