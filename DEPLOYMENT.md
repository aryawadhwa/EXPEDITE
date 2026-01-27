# Deployment Guide

Follow these steps to deploy OutboundAI to a production environment (e.g., VPS, DigitalOcean, AWS EC2).

## Prerequisites
- Docker & Docker Compose installed on the server.
- API Keys for Groq, Firecrawl, and Clerk.

## Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/BEASTSHRIRAM/OutboundAI.git
    cd OutboundAI
    ```

2.  **Configure Environment**
    Create a `.env.prod` file from the example:
    ```bash
    cp .env.prod.example .env.prod
    ```
    Edit `.env.prod` and fill in your actual API keys. Ensure `MONGODB_URI` is set to `mongodb://mongodb:27017` (internal docker network).

3.  **Build and Run**
    ```bash
    docker-compose up -d --build
    ```

4.  **Access the Application**
    - Frontend: `http://<your-server-ip>`
    - Backend API: `http://<your-server-ip>:8000/docs`

## Data Management
- MongoDB data is persisted in a docker volume `mongo_data`.
- To reset data (Warning: Destructive):
    ```bash
    docker-compose down -v
    ```
