# Sherlock MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that lets AI assistants like **ChatGPT**, **GitHub Copilot**, and others search for jobs across **65+ sources** — including LinkedIn, Indeed, Glassdoor, company career pages, and ATS platforms.

## Quick Start

### Install & Run

```bash
# From the sherlock monorepo root
cd apps/mcp
npm install
npm run build
npm start          # starts the MCP server in stdio mode
```

### Connect to ChatGPT / Other Clients

Use any MCP-compatible client. The server communicates via **stdio** (standard input/output).

## Tools

### `search_jobs`

Search for jobs across all sources.

| Parameter     | Type    | Required | Description                                        |
| ------------- | ------- | -------- | -------------------------------------------------- |
| `query`       | string  | ✅       | Job search query (e.g. "software engineer")        |
| `location`    | string  | ❌       | Location filter (e.g. "San Francisco", "Remote")   |
| `source`      | string  | ❌       | Specific source id (use `list_sources` to see all) |
| `company`     | string  | ❌       | Company slug for ATS sources (e.g. "stripe")       |
| `limit`       | number  | ❌       | Max results (default: 20, max: 100)                |
| `remote_only` | boolean | ❌       | Filter to remote positions only                    |

### `get_job_details`

Get detailed information about a specific job posting.

| Parameter | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| `job_url` | string | ❌       | Full URL of the job posting |
| `job_id`  | string | ❌       | Sherlock internal job ID   |

### `list_sources`

List all available job sources.

| Parameter | Type   | Required | Description                                                          |
| --------- | ------ | -------- | -------------------------------------------------------------------- |
| `type`    | string | ❌       | Filter: `all`, `job_board`, `ats`, `company`, `remote`, `aggregator` |

### `search_remote_jobs`

Search for remote-only positions across all remote-first job boards (RemoteOK, Remotive, We Work Remotely, Jobicy, Himalayas, Arbeitnow).

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `query`   | string | ✅       | Job search query                 |
| `source`  | string | ❌       | Specific remote source to target |
| `limit`   | number | ❌       | Max results (default: 25)        |

### `get_salary_insights`

Aggregate salary data from job search results. Returns min, max, median, P25, and P75 salary statistics.

| Parameter  | Type   | Required | Description                            |
| ---------- | ------ | -------- | -------------------------------------- |
| `query`    | string | ✅       | Job title/role to research             |
| `location` | string | ❌       | Location to focus on                   |
| `limit`    | number | ❌       | Number of jobs to sample (default: 50) |

### `compare_sources`

Compare all available job sources by type. Returns a breakdown of sources grouped by category (job board, ATS, company, remote, aggregator) with counts.

_No parameters required._

## Resources

| URI                  | Description                        |
| -------------------- | ---------------------------------- |
| `sherlock://sources` | Complete list of available sources |
| `sherlock://guide`   | Search tips and usage guide        |

## Environment Variables

| Variable            | Default                 | Description            |
| ------------------- | ----------------------- | ---------------------- |
| `SHERLOCK_API_URL` | `http://localhost:3001` | Sherlock API endpoint |

## Source Coverage

- **21** Job Boards (LinkedIn, Indeed, Glassdoor, Dice, Monster, Upwork, Exa, BuiltIn, Snagajob, Dribbble, ...)
- **6** Remote Job Boards (RemoteOK, Remotive, We Work Remotely, Jobicy, Himalayas, Arbeitnow)
- **4** Aggregator APIs (Adzuna, Reed, Jooble, CareerJet)
- **22** ATS Platforms (Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Rippling, Workday, ...)
- **12** Company Career Pages (Google, Meta, Netflix, Stripe, OpenAI, Amazon, Apple, Microsoft, NVIDIA, TikTok, Uber, Cursor)

**Total: 65 sources**
