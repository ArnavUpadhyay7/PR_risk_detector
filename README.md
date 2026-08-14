# PR Risk Analyzer

PR Risk Analyzer is an AI-powered merge-risk analysis tool for GitHub Pull Requests. Paste a PR URL and receive a structured report explaining what could go wrong if the PR is merged, with evidence-backed findings linked to the changed code.

The product is designed as a developer tool, not a generic chatbot or style reviewer. It focuses on merge risk across security, logic, code quality, and performance.

## What it does

- Fetches PR metadata and diffs from GitHub
- Runs deterministic pre-analysis on changed files
- Classifies the PR to decide which specialist agents are relevant
- Runs specialist agents in parallel through LangGraph
- Validates and maps findings to exact diff locations
- Aggregates findings into a final risk report
- Displays an interactive report with clickable findings and an in-app diff viewer

## Architecture

```text
GitHub PR URL
      |
      v
GitHub Service
      |
      v
Deterministic Analysis
      |
      v
LangGraph Workflow
      |
      +--> PR Analyzer
      |
      +--> Deterministic Classifier
      |
      +--> Parallel Specialist Agents
      |       - Security Agent
      |       - Code Quality Agent
      |       - Performance Agent
      |       - Logic/Bug Agent
      |
      +--> Risk Aggregator
      |
      v
Structured Risk Report + Parsed Diffs
      |
      v
React Frontend
```

### LangGraph topology

```text
START
  -> prAnalyzer
  -> classifier
  -> parallel fan-out via Send()
       -> securityRisk
       -> qualityRisk
       -> performanceRisk
       -> bugRisk
  -> checkJoin
  -> riskAggregator
  -> END
```

Trivial PRs (docs-only or non-behavioral changes) skip LLM calls and return a deterministic low-risk report.

## Specialist agents

### Security Agent
Looks for authentication, authorization, secrets, tokens, input handling, permissions, and sensitive configuration issues.

### Code Quality Agent
Looks for maintainability risks with real engineering impact such as duplicated logic, excessive complexity, poor separation of concerns, and suspicious abstractions.

### Performance Agent
Looks for evidence-backed performance risks such as N+1 queries, expensive loops, repeated computation, and blocking operations visible in the diff.

### Logic/Bug Agent
Looks for functional correctness issues such as incorrect conditions, edge cases, broken flows, and behavior regressions.

## Evidence-backed findings

Every meaningful finding includes:

- category
- severity
- title
- description
- recommendation
- file
- optional line and evidence snippet
- confidence score
- diff position when available

Findings are validated against parsed patch data before being returned. Invalid line numbers are removed rather than shown incorrectly.

## Tech stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express
- TypeScript
- MongoDB (optional persistence)

### AI
- LangGraph.js
- OpenRouter
- Zod structured outputs

## Project structure

```text
PR-risk-reviewer/
├── client/
│   └── src/
│       ├── components/
│       ├── services/
│       └── App.tsx
├── server/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       │   ├── github/
│       │   ├── analysis/
│       │   │   └── graph/
│       │   └── ai/
│       └── index.ts
└── README.md
```

## Getting started

### Prerequisites

- Node.js
- npm
- MongoDB (optional)
- GitHub token (recommended)
- OpenRouter API key

### Install

```bash
cd client && npm install
cd ../server && npm install
```

### Environment variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=
GITHUB_TOKEN=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.0-flash-001
APP_URL=http://localhost:5000
```

Never commit real secrets.

### Run

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

## API

### Health

```http
GET /api/health
```

### Analyze PR

```http
POST /api/pr/analyze
```

Request:

```json
{
  "prUrl": "https://github.com/owner/repository/pull/123"
}
```

Response includes:

- `pullRequest`
- `analysis.summary`
- `analysis.riskReport`
- `analysis.riskReport.findings`
- `analysis.riskReport.fileDiffs`

## Testing

Run the graph fixture test without live OpenRouter calls:

```bash
cd server
npm test
```

This verifies:

- specialist routing
- structured outputs
- diff line mapping
- finding validation
- deduplication
- aggregator output

## Performance notes

- Specialist agents run in parallel, not sequentially
- Deterministic classification avoids an extra LLM call
- Trivial PRs skip LLM calls entirely
- Each agent receives only a compact, category-specific diff
- Output size is capped to keep free-model latency reasonable

Timing logs are printed on the server:

```text
[PR] GitHub fetch: ...
[AI] security agent: ...
[AI] quality agent: ...
[AI] performance agent: ...
[AI] bug agent: ...
[AI] aggregator: ...
[Graph] total workflow: ...
```

## Security

- API keys stay on the server
- No secrets are exposed to the frontend
- GitHub URLs are validated before processing
- Invalid or unverifiable finding locations are dropped instead of fabricated

## Limitations

- Free OpenRouter models can be slow or occasionally truncate structured output
- Very large PRs are diff-truncated for latency
- Line mapping depends on GitHub patch availability
- Loading stages in the UI are indicative, not live backend progress events

## License

ISC
