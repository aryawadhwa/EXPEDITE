# Outbound AI

Outbound AI is a comprehensive platform designed to manage and monitor AI missions, agents, and reviews. It features a modern dashboard for real-time tracking and control.

## Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Language**: TypeScript
- **Styling**: TailwindCSS, shadcn-ui
- **State/Data**: TanStack Query
- **Authentication**: Clerk
- **Visualization**: Recharts

### Backend
- **Framework**: FastAPI
- **Database**: MongoDB (Beanie OD)
- **AI/LLM**: LangChain, LangGraph
- **Search**: Firecrawl
- **Utilities**: Pydantic

## Key Features

- **Launchpad**: Initiate and configure new missions.
- **Mission Chat**: Real-time interaction and monitoring of active missions.
- **Review Queue**: Interface for human-in-the-loop review of AI actions.
- **Active Agents**: Dashboard to view and manage currently running agents.
- **Detailed Analytics**: Visualizations of mission performance and metrics.

## Setup Instructions

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
