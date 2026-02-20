# EXPEDITE

## The Operating System for Autonomous Sales Teams

EXPEDITE is an intelligent outbound sales platform that automates prospect discovery, enrichment, and personalized email outreach at scale. Using advanced AI agents, job board scraping, and human-in-the-loop approval, EXPEDITE helps sales teams find and contact qualified prospects efficiently.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [How It Works](#how-it-works)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Getting Started](#getting-started)
7. [Project Structure](#project-structure)
8. [API Documentation](#api-documentation)
9. [Configuration](#configuration)
10. [Deployment](#deployment)
11. [Documentation](#documentation)
12. [Support](#support)

---

## Overview

EXPEDITE automates the entire prospect outreach workflow:

1. **Prospect Discovery** - Scrapes 4 job board sources to find companies actively hiring
2. **Email Enrichment** - Uses Hunter.io to find verified email addresses (60-80% success rate)
3. **Draft Generation** - AI generates personalized emails for each prospect
4. **Human Review** - All drafts go to Review Queue for user approval before sending
5. **Execution** - Sends approved emails via Composio integration
6. **Tracking** - Maintains contact history and engagement metrics

**Result:** Find and contact 50-100 qualified prospects in minutes, not weeks.

---

## Core Features

### 1. Intelligent Prospect Discovery

**Job Board Scraping**
- Scrapes 4 major job board sources simultaneously
- Sources: Hiring.cafe (API), Glassdoor, Monster, Indeed
- Extracts company name, job title, location, and apply URL
- Concurrent scraping for 5-10 second total execution time

**How it works:**
```
User Input: "Find VPs of Engineering at Series A startups"
    ↓
System scrapes 4 job boards concurrently
    ↓
Finds 50-100 companies actively hiring for VP Engineering
    ↓
Extracts company and job information
    ↓
Returns structured prospect list
```

### 2. Email Enrichment via Hunter.io

**Automatic Email Finding**
- Integrates with Hunter.io API (500M+ business emails database)
- Finds verified email addresses for prospects
- Validates email confidence (only uses >50% confidence)
- Enriches first 10 prospects per mission to optimize API quota

**Success Metrics:**
- 60-80% of prospects have verified emails found
- Email validation via MX record checking
- Filters out disposable and invalid emails

**Example:**
```
Prospect: John Smith at Acme Corp
    ↓
Hunter.io lookup: acme.com domain
    ↓
Found: john.smith@acme.com (87% confidence)
    ↓
MX validation: PASS
    ↓
Result: john.smith@acme.com (verified)
```

### 3. AI-Powered Draft Generation

**Personalized Email Creation**
- Uses Groq LLM for fast inference
- Generates personalized emails based on prospect context
- Incorporates company information and job details
- Supports RAG (Retrieval Augmented Generation) with uploaded documents

**Features:**
- Natural language email generation
- Context-aware personalization
- Professional tone and formatting
- Customizable templates

### 4. Human-in-the-Loop Review Queue

**Quality Assurance Checkpoint**
- All drafts appear in Review Queue before sending
- Users can view, edit, and approve/reject drafts
- Prevents accidental or low-quality outreach
- Maintains brand reputation and compliance

**Review Options:**
- View full draft content
- Edit subject and body
- Approve for sending
- Reject and discard
- Bulk approve multiple drafts

### 5. Multi-Channel Integration

**Supported Channels:**
- Email (Gmail via Composio)
- Twitter/X (posting)
- LinkedIn (posting)
- Reddit (posting)
- Slack (messaging)
- GitHub (issues)

**OAuth Integration:**
- Secure OAuth flow via Composio
- One-click connection for each platform
- Automatic token management
- Connection status verification

### 6. Knowledge Graph (Neo4j)

**Relationship Tracking**
- Stores people, companies, and relationships
- Tracks contact methods and history
- Enables intelligent prospect matching
- Prevents duplicate outreach

**Graph Structure:**
```
Person → WORKS_AT → Company
Person → KNOWS → Person
Person → HAS_EMAIL → Email
Company → HIRING_FOR → JobTitle
```

### 7. Real-Time Updates via WebSocket

**Live Progress Tracking**
- Real-time mission progress in chat interface
- Live draft creation notifications
- Instant error alerts
- WebSocket connection for streaming updates

### 8. LangGraph Agentic Workflow

**10-Node Intelligent Workflow**
- Initial triage (intent classification)
- Person resolution (Neo4j lookup)
- Channel identity resolution
- Intent-based routing
- Discovery, outreach, or publish flows
- Human approval checkpoint
- Action execution
- Post-action updates

---

## How It Works

### Complete User Journey

**Step 1: Create Mission**
```
User: "Find VPs of Engineering at Series A startups and draft emails"
```

**Step 2: Agent Analysis**
- LLM classifies intent as "discovery + outreach"
- Determines channels (email)
- Identifies draft requirement (yes)

**Step 3: Prospect Discovery**
- Scrapes 4 job boards concurrently (5-10 seconds)
- Finds 50 companies hiring for VP Engineering
- Extracts company and job information

**Step 4: Email Enrichment**
- Calls Hunter.io for each company domain
- Finds verified emails (35 out of 50 = 70% success)
- Validates emails with MX records

**Step 5: Draft Generation**
- LLM generates 35 personalized emails
- Each email tailored to prospect and company
- Saves drafts with PENDING status

**Step 6: Review Queue**
- User reviews 35 drafts in Review Queue
- Approves 30 drafts
- Rejects 5 drafts

**Step 7: Execution**
- System sends 30 approved emails via Gmail
- Updates contact history
- Tracks engagement

**Step 8: Completion**
- Mission marked as completed
- Results logged and displayed
- Agent statistics updated

---

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn/ui + Tailwind CSS
- **State Management:** React Hooks + Context API
- **HTTP Client:** Axios
- **Real-time:** WebSocket
- **Voice Input:** Web Speech API

### Backend
- **Framework:** FastAPI (Python 3.12+)
- **Async:** asyncio + httpx
- **ORM:** Beanie (MongoDB ODM)
- **Graph DB:** Neo4j driver
- **LLM Orchestration:** LangChain + LangGraph
- **LLM Provider:** Groq (primary), OpenAI (fallback)
- **Tracing:** LangSmith
- **Web Scraping:** BeautifulSoup + httpx
- **Email Validation:** Custom MX record checker
- **Retry Logic:** Tenacity
- **Authentication:** Clerk

### Databases
- **Primary:** MongoDB Atlas (documents)
- **Graph:** Neo4j (relationships)
- **Cache:** In-memory (MemorySaver)

### External Services
- **Hunter.io** - Email finding (500M+ business emails)
- **Composio** - OAuth + integrations
- **Groq** - Fast LLM inference
- **LangSmith** - Tracing & debugging
- **Clerk** - Authentication

---

## System Architecture

```
Frontend (React + TypeScript)
    ↓
WebSocket (Real-time updates)
    ↓
FastAPI Backend (Python 3.12+)
     API Routes
     LangGraph Agent (10 nodes)
     Services Layer
         web_scraper.py (4 job boards)
         email_finder.py (Hunter.io)
         smtp_verifier.py (Email validation)
         neo4j.py (Knowledge graph)
         direct_actions.py (Social media)
    ↓
Databases
     MongoDB (users, missions, prospects, drafts)
     Neo4j (people, companies, relationships)
    ↓
External APIs
     Hunter.io (email finding)
     Composio (OAuth + sending)
     Groq (LLM inference)
     LangSmith (tracing)
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB Atlas account
- API Keys:
  - Clerk (authentication)
  - Groq (LLM)
  - Hunter.io (email finding)
  - Composio (OAuth)
  - LangSmith (tracing)

### Installation

**1. Clone Repository**
```bash
git clone https://github.com/finalroundai/EXPEDITE_static.git
cd EXPEDITE_static
```

**2. Backend Setup**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start backend
python -m uvicorn main:app --reload
```

Backend runs on: http://localhost:8000
API Docs: http://localhost:8000/docs

**3. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API endpoint

# Start frontend
npm run dev
```

Frontend runs on: http://localhost:5173

### First Mission

1. Open http://localhost:5173
2. Sign in with Clerk
3. Create new mission: "Find VPs of Engineering"
4. Watch the agent work in real-time
5. Review drafts in Review Queue
6. Approve and send emails

---

## Project Structure

```
EXPEDITE_static/
 backend/
    app/
       core/
          agent.py              # LangGraph workflow
          config.py             # Settings
          sender.py             # Email sending
          socket.py             # WebSocket
       services/
          web_scraper.py        # Job board scraping
          email_finder.py       # Hunter.io
          smtp_verifier.py      # Email validation
          neo4j.py              # Knowledge graph
       routers/
          missions.py           # Mission CRUD
          reviews.py            # Draft review
          scraper.py            # Scraper API
       models.py                 # MongoDB models
    main.py                       # FastAPI entry
    requirements.txt              # Dependencies
    .env                          # Configuration

 frontend/
    src/
       components/               # React components
       pages/                    # Page components
       lib/                      # Utilities
       App.tsx                   # Root component
       main.tsx                  # Entry point
    package.json                  # Dependencies
    vite.config.ts                # Vite config

 Documentation/
     README.md                     # This file
     TECHNICAL_ARCHITECTURE.md     # Complete technical guide
     LANGGRAPH_VISUALIZATION.md    # Workflow diagrams
     PROJECT_STATUS.md             # Current status
```

---

## API Documentation

### Missions
```
POST   /missions                    # Create mission
GET    /missions                    # List missions
GET    /missions/{id}               # Get mission details
POST   /missions/{id}/chat          # Chat with mission
GET    /missions/{id}/logs          # Get mission logs
```

### Reviews (Drafts)
```
GET    /reviews                     # List drafts
GET    /reviews/{id}                # Get draft
PUT    /reviews/{id}                # Update draft
POST   /reviews/{id}/approve        # Approve draft
POST   /reviews/{id}/reject         # Reject draft
```

### Scraper
```
POST   /scraper/scrape-jobs         # Scrape job boards
POST   /scraper/scrape-emails       # Scrape emails
POST   /scraper/research-company    # Research company
GET    /scraper/status              # Scraper status
```

### Integrations
```
POST   /integrations/connect/{tool} # Connect tool
GET    /integrations/status         # Connection status
POST   /integrations/disconnect     # Disconnect tool
```

---

## Configuration

### Environment Variables

**Backend (.env)**
```bash
# Authentication
CLERK_SECRET_KEY=pk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# APIs
GROQ_API_KEY=gsk_...
HUNTER_API_KEY=04094d0f...
COMPOSIO_API_KEY=ak_...

# Databases
MONGODB_URI=mongodb+srv://...
NEO4J_URI=bolt://...

# Tracing
LANGSMITH_API_KEY=lsv2_...
LANGCHAIN_PROJECT=My First App
```

**Frontend (.env)**
```bash
VITE_API_URL=http://localhost:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Deployment

### Docker

**Build Backend**
```bash
cd backend
docker build -t EXPEDITE-backend .
docker run -p 8000:8000 EXPEDITE-backend
```

**Build Frontend**
```bash
cd frontend
docker build -t EXPEDITE-frontend .
docker run -p 5173:5173 EXPEDITE-frontend
```

### Production Deployment

1. Deploy backend to cloud (AWS, GCP, Heroku)
2. Deploy frontend to Vercel or Netlify
3. Configure MongoDB Atlas
4. Set up environment variables
5. Enable CORS for production domain
6. Configure SSL/TLS certificates

---

## Documentation

Comprehensive documentation is available:

- **TECHNICAL_ARCHITECTURE.md** - Complete technical reference (2000+ lines)
- **LANGGRAPH_VISUALIZATION.md** - Workflow diagrams and explanations
- **PROJECT_STATUS.md** - Current system status and capabilities
- **DOCUMENTATION_GUIDE.md** - Navigation guide for all docs

---

## Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Production Readiness | 95/100 | Ready to deploy |
| Job Board Sources | 4 | Concurrent scraping |
| Email Finding Success | 60-80% | Via Hunter.io |
| LangGraph Nodes | 10 | Complete workflow |
| API Endpoints | 20+ | Full REST API |
| Frontend Components | 50+ | shadcn/ui based |
| Code Lines | 10,000+ | Production quality |

---

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Job board scraping | 5-10s | 4 sources concurrent |
| Email enrichment | 2-5s | Hunter.io API |
| Draft generation | 10-20s | LLM inference |
| Email sending | 1-2s | Per email |
| Total workflow | 20-40s | Excluding review time |

---

## Support

### Documentation
- See TECHNICAL_ARCHITECTURE.md for complete reference
- See LANGGRAPH_VISUALIZATION.md for workflow diagrams
- See PROJECT_STATUS.md for current status

### Debugging
- Backend logs: Check console output
- Frontend logs: Browser console (F12)
- LangSmith traces: https://smith.langchain.com
- Database: MongoDB Atlas dashboard

### Issues
- Check backend logs for errors
- Verify API keys are valid
- Monitor Hunter.io API quota
- Check Composio connection status

---

## License

Private & Confidential.

---

## Repository

GitHub: https://github.com/finalroundai/EXPEDITE_static

Branch: arya (development)
Main: main (production)
