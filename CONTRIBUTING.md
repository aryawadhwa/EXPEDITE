# Contributing to EXPEDITE

Welcome to the EXPEDITE project! We're thrilled that you want to help us build the next generation of autonomous B2B sales and recruiting agents.

## Project Architecture

EXPEDITE is built on a modern, robust stack separated into two main directories:

- **`backend/` (FastAPI & LangGraph)**: The core intelligence of the platform. It handles API requests, orchestrates the `ScoutAgent` using LangGraph, interacts with external intelligence APIs (Hunter.io, Apollo), and manages the MongoDB database.
- **`frontend/` (React & Vite)**: The user-facing Launchpad and Dashboard. Built for speed and a bloat-free experience.

## Getting Your Local Environment Set Up

### 1. Backend Setup
We use `uv` as our Python package and environment manager.

```bash
cd backend

# Install dependencies and sync the environment
uv sync

# Duplicate the example environment file and fill in your keys
cp .env.example .env
```

To run the backend server with live-reloading:
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
We use standard NPM for the React/Vite frontend.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Branching & Pull Requests

When you are ready to make a contribution, please follow these steps:

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally.
3. **Create a new branch** off of `main` for your feature or bug fix: `git checkout -b feature/my-awesome-feature`.
4. **Make your changes** and ensure everything runs smoothly locally.
5. **Commit your changes** using conventional commit messages (e.g., `feat: added new integration`, `fix: resolved crashing issue on dashboard`).
6. **Push the branch** to your fork.
7. **Open a Pull Request (PR)** against the `main` branch of the original repository.

Please ensure your PR description clearly states the problem you are solving and how you solved it. 

## Where to start?
If you're looking for ways to contribute, check out the issue tracker. We're always looking for help with:
- Adding new data sources/integrations to the `ScoutAgent`.
- Improving the UI/UX on the dashboard.
- Optimizing LangGraph state transitions.

Thank you for contributing!
