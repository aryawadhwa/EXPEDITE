# EXPEDITE (OutboundAI) 🚀

<div align="center">
  <img src="https://img.shields.io/badge/Status-LIVE-success" alt="Status" />
  <img src="https://img.shields.io/badge/Security-GDPR%20Compliant-green" alt="GDPR Compliant" />
  <img src="https://img.shields.io/badge/Architecture-LangGraph%20Agents-blue" alt="Architecture" />
  <img src="https://img.shields.io/badge/Stack-FastAPI%20%7C%20React-purple" alt="Tech Stack" />
</div>

**EXPEDITE** is an autonomous AI agent designed for B2B sales and recruiting outreach. It drastically reduces manual prospect research by utilizing advanced LLM pipelines (LangGraph) to find verified leads, extract insights, and draft hyper-personalized outreach emails.

Built for scale, speed, and real-world ROI.

---

## 💡 Methodology

EXPEDITE operates on an **Evidence-First Pipeline**. Unlike traditional scraping wrappers, EXPEDITE leverages agentic orchestration to ensure every prospect is verified and every drafted email contains personalized, highly relevant context.

1. **Intent & Location Scoping:** The user defines an objective (e.g., "Find Series A fintechs") and an optional location (e.g., "San Francisco"). The agent translates this into targeted API queries.
2. **Parallel Agent Execution:** Using a LangGraph state machine (`ScoutAgent`), the system orchestrates sub-tasks. It searches Hunter.io and Apollo for domain contacts, pulling recent news and company intelligence concurrently.
3. **Data Verification (Proof Ledger):** Every lead is subjected to a deliverability check (MX records, SMTP checks) and recorded in a transparent Proof Ledger. 
4. **Contextual Drafting:** Instead of generic templates, the LLM uses the gathered company intelligence and location context to write personalized drafts designed to cut through the noise.
5. **ROI Analytics:** The platform strictly tracks output, actively visualizing the hours saved, leads found, and emails drafted on the main dashboard.

---

## 🏗️ Architecture & Flow Diagram

The application is built on a split architecture: a lightweight React/Vite frontend and a robust, async-first FastAPI backend.

```mermaid
graph TD
    %% Frontend Components
    subgraph Frontend [Frontend (React + Vite)]
        UI[Launchpad UI] --> ApiClient[API Client]
        Dashboard[ROI Dashboard] --> ApiClient
    end

    %% Backend Components
    subgraph Backend [Backend (FastAPI)]
        Router[Missions Router]
        Agent[ScoutAgent (LangGraph)]
        LLM[LLM Service (OpenAI/Groq)]
        Integrations[Integration Layer]
        
        ApiClient -->|POST /missions| Router
        Router --> Agent
        Agent <--> LLM
        Agent --> Integrations
    end
    
    %% External Services
    subgraph External [External Services]
        Hunter[Hunter.io API]
        Apollo[Apollo API]
        WebScraper[Firecrawl / Web]
        
        Integrations --> Hunter
        Integrations --> Apollo
        Integrations --> WebScraper
    end

    %% Database
    subgraph DB [Database]
        Mongo[(MongoDB)]
        Router --> Mongo
        Agent --> Mongo
    end
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+ (managed via `uv`)
- Node.js v18+
- MongoDB instance (Cloud or Local)

### 1. Backend Setup
Navigate to the `backend` directory and set up the environment:
```bash
cd backend
# Install dependencies using uv
uv sync

# Configure your environment
cp .env.example .env
# Fill in OPENAI_API_KEY, HUNTER_API_KEY, MONGODB_URI, etc.

# Run the FastAPI server
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
# Install dependencies
npm install

# Run the development server
npm run dev
```

---

## 🔒 Security & Privacy (Trust Center)
EXPEDITE was built with enterprise-grade security in mind:
- **GDPR Compliant:** Designed with data minimization principles.
- **Isolated Execution:** User data is processed in isolated execution environments.
- **Zero Raw Passwords:** Strict enforcement against storing raw passwords; robust auth via Clerk.

## 📈 Key Features
- **ROI Analytics Dashboard:** Real-time visibility into manual hours saved and leads verified.
- **Location-Specific Targeting:** Hyper-local prospect searching directly from the Launchpad.
- **Intelligent Caching:** Heavily cached external API calls to minimize latency and costs.
- **Lightweight & Fast:** Bloat-free frontend design prioritizing UX and speed.
