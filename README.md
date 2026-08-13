# 🛡️ PR Risk Detector

An AI-powered **Pull Request Risk Analysis and Code Review system** that analyzes GitHub Pull Requests and generates a structured risk assessment before the code is merged.

The system examines the PR's code changes, identifies potentially risky modifications, evaluates their impact, and produces an **AI-generated assessment with risk level, findings, reasoning, and recommendations**.

Built to demonstrate how **AI agents and workflow orchestration** can be applied to real-world software engineering workflows.

---

## ✨ Features

* 🔍 **GitHub PR Analysis** — Analyze a public GitHub Pull Request using its URL.
* 🤖 **AI-Powered Risk Detection** — Uses an LLM to reason about potential risks in the changes.
* 📊 **Risk Assessment** — Classifies the PR based on the potential severity and impact of detected issues.
* 🧠 **Context-Aware Analysis** — Considers the actual changes in the PR rather than simply scanning individual lines.
* ⚠️ **Risk Categories** — Identifies areas such as:

  * Security
  * Breaking changes
  * Logic errors
  * Performance
  * API changes
  * Database/data integrity
  * Dependency changes
  * Configuration changes
  * Maintainability
* 💡 **Actionable Recommendations** — Provides suggestions for what developers should review before merging.
* 📋 **Structured Assessment** — Presents the final analysis in an easy-to-understand UI instead of returning raw LLM output.
* ⚡ **AI Workflow Architecture** — Uses LangGraph to orchestrate the different stages of the analysis pipeline.

---

##  How It Works

The application follows a multi-step analysis workflow.

```text
                    GitHub Pull Request
                            │
                            ▼
                    ┌───────────────┐
                    │  PR Fetcher   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Change Parser │
                    └───────┬───────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │   AI Risk Analysis  │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Risk Classification │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Recommendations     │
                  └──────────┬──────────┘
                             │
                             ▼
                    Final PR Assessment
```

### 1. PR Input

The user provides a GitHub Pull Request URL.

The backend extracts the repository and PR information and retrieves the relevant GitHub data.

### 2. Change Analysis

The system examines the PR metadata and code changes to understand:

* What files were modified
* What code was added or removed
* The size and scope of the change
* Which parts of the application are affected
* Whether the PR introduces potentially sensitive changes

### 3. AI Risk Analysis

The relevant PR context is passed to an LLM.

Instead of simply asking the model:

> "Is this PR risky?"

the system provides structured context and asks the model to reason about specific categories of potential risk.

This allows the analysis to focus on **software-engineering consequences**, rather than simply describing the code.

### 4. Risk Classification

The detected issues are evaluated and organized into a structured assessment.

The result can include:

* Overall risk level
* Risk score
* Identified issues
* Severity
* Affected areas
* Explanation
* Recommended actions

### 5. Final Assessment

The frontend presents the result as a readable PR review rather than exposing raw model output.

This makes the system useful for developers who want a quick **"should I be concerned about this PR?"** assessment before reviewing or merging it.

---

## Why LangGraph?

The project uses **LangGraph** to orchestrate the AI workflow.

Rather than treating the LLM as a single API call, the analysis is represented as a workflow consisting of multiple steps.

For example:

```text
Fetch PR
   ↓
Extract Changes
   ↓
Analyze Risk
   ↓
Evaluate Findings
   ↓
Generate Recommendations
   ↓
Final Assessment
```

Each step can operate on a shared state and pass its output to the next stage.

This makes the system easier to:

* Break complex AI tasks into smaller operations
* Maintain structured state between steps
* Add additional analysis agents later
* Retry or modify individual stages
* Control the overall AI workflow
* Build more reliable AI applications than a single large prompt

The goal is therefore not just to "call an LLM", but to demonstrate an **AI-native workflow for software engineering**.

---

## Architecture

```text
┌──────────────────────────────────────────────┐
│                    Frontend                  │
│                                              │
│       React + Vite + TypeScript + Tailwind   │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTP
                       ▼
┌──────────────────────────────────────────────┐
│                    Backend                   │
│                                              │
│              Node.js + Express               │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │             PR Analysis API            │  │
│  └───────────────────┬────────────────────┘  │
└──────────────────────┼───────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    LangGraph    │
              │ AI Workflow     │
              └────────┬────────┘
                       │
             ┌─────────┴──────────┐
             ▼                    ▼
      ┌──────────────┐     ┌──────────────┐
      │   GitHub API │     │   LLM API    │
      └──────────────┘     └──────────────┘
             │                    │
             └─────────┬──────────┘
                       ▼
                Risk Assessment
                       │
                       ▼
                    Frontend
```

---

## Tech Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript
* MongoDB
* Mongoose

### AI

* LangGraph
* LLM API
* OpenRouter

### Integrations

* GitHub API
* GitHub Personal Access Tokens

### Development

* Git
* GitHub
* npm
* dotenv

---

##  Project Structure

```text
PR-risk-reviewer/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.tsx
│   │
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── agents/
│   │   └── index.ts
│   │
│   ├── .env
│   └── package.json
│
└── README.md
```

> The exact structure may change as the project evolves.

---

##  Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* MongoDB
* Git

You will also need:

* A GitHub Personal Access Token
* An OpenRouter API key

---

##  Installation

Clone the repository:

```bash
git clone <your-repository-url>

cd PR-risk-reviewer
```

### Install frontend dependencies

```bash
cd client
npm install
```

### Install backend dependencies

```bash
cd ../server
npm install
```

---

##  Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

GITHUB_TOKEN=your_github_token

OPENROUTER_API_KEY=your_openrouter_api_key
```

### GitHub Token

The GitHub token is used to retrieve Pull Request information and code changes from GitHub.

For a basic public-PR analyzer, use the minimum permissions required for your use case.

### OpenRouter

The OpenRouter API is used as the gateway to the selected LLM used by the analysis workflow.

**Never commit your `.env` file or API keys to GitHub.**

---

##  Running the Application

Start the backend:

```bash
cd server
npm run dev
```

The backend should start on:

```text
http://localhost:5000
```

Then start the frontend:

```bash
cd client
npm run dev
```

The frontend will be available at the local Vite development URL shown in the terminal.

---

## 🔎 Example Usage

1. Open the application.
2. Enter a public GitHub Pull Request URL.

Example:

```text
https://github.com/owner/repository/pull/123
```

3. Start the analysis.
4. The backend retrieves the PR information.
5. LangGraph executes the analysis workflow.
6. The LLM evaluates potential risks.
7. The final structured assessment is returned to the frontend.
8. Review the identified risks and recommendations.

---

##  Example Assessment

A generated assessment may look conceptually like:

```text
Overall Risk
HIGH

Risk Areas
├── Security       HIGH
├── Breaking API   MEDIUM
├── Performance    LOW
└── Maintainability MEDIUM

Key Findings

1. Authentication middleware was modified.
   Severity: HIGH

   The change affects request authorization and could
   potentially allow unintended access if incorrectly configured.

2. Database query logic was changed.
   Severity: MEDIUM

   The new query may increase the number of database operations
   for large datasets.

Recommendations

• Add authentication regression tests.
• Review authorization behavior for affected routes.
• Benchmark the modified database query.
• Verify existing API consumers remain compatible.
```

The exact output depends on the Pull Request being analyzed.

---

## ⚡ Performance Considerations

AI analysis can take significantly longer than a conventional API request because the workflow may involve:

* Fetching GitHub data
* Processing large diffs
* Multiple reasoning steps
* LLM inference
* Structured output generation

To keep the application responsive, the UI provides feedback while the analysis is being generated instead of leaving the user on a blank loading screen.

Future improvements can include:

* Streaming AI responses
* Parallel analysis of independent risk categories
* Smaller/faster models for preliminary analysis
* Caching previously analyzed PRs
* Diff chunking
* Early risk detection
* Background job processing

---

##  Security

This project handles potentially sensitive development information, so API credentials should be handled carefully.

### Important practices

* Never commit `.env` files.
* Never expose GitHub tokens to the frontend.
* Keep LLM API keys on the backend.
* Use the minimum GitHub permissions necessary.
* Validate GitHub URLs before processing them.
* Avoid logging secrets or sensitive repository information.

---

##  Project Goals

The project was built with two primary goals.

### 1. Practical Developer Tool

Provide developers with an AI-assisted way to quickly identify potentially risky Pull Requests and areas that deserve additional attention.

### 2. Demonstrate AI System Design

Demonstrate how modern AI applications can be built using:

* LLMs
* Agentic workflows
* LangGraph
* External APIs
* Structured outputs
* Backend orchestration
* Context-aware reasoning

The important part of the system is not simply the LLM call, but the **workflow surrounding the model**.
