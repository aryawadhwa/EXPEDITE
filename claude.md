# OutboundAI Project Context

## Project Overview

**Name**: OutboundAI (ExpediteAI)  
**Purpose**: AI-powered outbound sales automation platform with agent-based prospecting, email generation, and human-in-the-loop approval workflow.

---

## Current Tech Stack

### Frontend

- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui
- **Icons**: lucide-react
- **Animation**: framer-motion
- **Auth**: Clerk
- **Routing**: react-router-dom
- **Custom Components**: FloatingLines (animated background)

### Backend

- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **Server**: Uvicorn
- **Port**: 8000

### Development

- **Frontend Dev Server**: http://localhost:8080 (Vite)
- **Backend Dev Server**: http://localhost:8000 (FastAPI)

---

## Current Design System

### Color Scheme

- **Background**: Dark (`hsl(240 6% 6%)`)
- **Foreground**: White (`hsl(0 0% 98%)`)
- **Primary/Accent**: Electric Indigo (`hsl(239 84% 67%)` - `#7E6BFF`)
- **Borders**: White/10 opacity
- **Cards**: Dark with subtle transparency

### Typography

- **Font**: Inter (weights 300-700)
- **Monospace**: JetBrains Mono
- **Scale**: Standard Tailwind scale (text-sm to text-7xl)

### UI Patterns

- **Floating pill navigation** at top
- **Gradient text effects** for headlines
- **Card-based layouts** with borders
- **Framer Motion animations** for scroll reveals
- **FloatingLines background** component

---

## Key Pages

### 1. Landing Page (`/`)

**Current State**:

- Floating pill navigation with logo and auth buttons
- Hero section with FloatingLines background
- Gradient headline: "Your AI-Powered Outbound Team"
- Stats section (10x, 85%, 3hrs)
- Features section (3 cards: Prospecting, Outreach, Human-in-Loop)
- How It Works (4 steps)
- Benefits section
- CTA section
- **Footer**: PhantomBuster-style gradient footer (peach/cream to lavender) with 6 columns

### 2. Dashboard/Launchpad

**Purpose**: Mission control center
**Status**: Needs implementation

### 3. Review Queue

**Purpose**: Human approval workflow for AI-generated emails
**Status**: Needs implementation

### 4. Mission Chat

**Purpose**: Real-time agent activity monitoring
**Status**: Needs implementation

---

## Components Inventory

### Layout Components

- `LiveBrainSidebar.tsx` - WebSocket-based log viewer with zoom control

### UI Components (shadcn-ui)

- Button
- Card
- Badge
- Input
- Slider
- ScrollArea
- Tabs

### Custom Components

- `FloatingLines.tsx` - Animated wave background

---

## Important Files

### Configuration

- `tailwind.config.ts` - Tailwind configuration
- `vite.config.ts` - Vite build configuration
- `nginx.conf` - Nginx server configuration

### Styling

- `index.css` - Global CSS with custom gradients and animations

### Backend

- `main.py` - FastAPI entry point
- `app/core/config.py` - Environment configuration
- `app/database.py` - MongoDB connection

---

## Design References Provided

1. **PhantomBuster Footer** (uploaded_media_1769758010425.png)
   - Gradient background (peach to lavender)
   - Large brand name
   - 6-column layout
   - Social icons in circles
   - Legal links at bottom

2. **LlamaIndex Website** (uploaded_media_1769758207904.png)
   - Mega-menu navigation
   - Outlined brand name with gradient
   - Newsletter signup
   - Multi-column footer

---

## User Preferences & Rules

### Design Constraints

- **DO NOT** change the main theme (dark with electric indigo accent)
- **Keep** existing color scheme
- **Use** PhantomBuster-style footer (already implemented)
- **Maintain** floating pill navigation
- **Preserve** FloatingLines background component

### Development Rules

- Only make UI changes (no backend modifications unless explicitly requested)
- Auto-run safe commands
- Use existing components from shadcn-ui
- Follow Tailwind CSS conventions
- Maintain TypeScript types

---

## Current Status

### Completed

✅ Landing page with PhantomBuster-style footer  
✅ Floating pill navigation  
✅ Hero section with FloatingLines  
✅ Features, How It Works, Benefits sections  
✅ Framer Motion animations  
✅ Clerk authentication integration

### Pending

⏳ Launchpad Dashboard implementation  
⏳ Review Queue implementation  
⏳ Mission Chat implementation  
⏳ Additional page designs

---

## Notes

- User prefers **concise** responses
- User wants **only UI changes** unless specified
- User provides reference images for design inspiration
- Current design is **modern, dark, futuristic** with clean animations
- Footer follows **PhantomBuster gradient style** (not LlamaIndex)

---

**Last Updated**: 2026-01-30  
**Version**: 1.0
