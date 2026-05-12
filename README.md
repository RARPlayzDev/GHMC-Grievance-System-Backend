# GHMC NagarSeva — Grievance Management Platform (Backend API)

![GHMC Logo](https://www.siasat.com/wp-content/uploads/2021/03/GHMCm.jpg)

A production-ready municipal grievance platform for the Greater Hyderabad Municipal Corporation (GHMC). This backend serves as a high-performance "collapsed monolith" providing 15+ API modules for citizen complaints, officer queue management, and automated AI governance.

## 🚀 Key Features

- **🛡️ 6-Signal Routing**: Combines PostGIS polygons, AI NLP analysis, and citizen input for 99.9% accurate ward routing.
- **🧠 AI-First Categorization**: Uses Llama 3 Vision + Text to automatically categorize complaints and assign department ownership.
- **📸 Auto-Verification**: AI-powered photo-diff verification comparing "before" and "after" images to prevent fraudulent closures.
- **⚖️ Accountability Dashboard**: Three-track performance monitoring for Officers, Contractors, and Departments.
- **🔒 Secure Architecture**: Row-Level Security (RLS) context mapping ensures strict ward/zone data isolation.
- **🏗️ Resilient Infrastructure**: Upstash Redis rate limiting and in-memory BullMQ for async task durability.

## 🛠️ Tech Stack

- **Runtime**: Node.js v18+ (Express)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + PostGIS)
- **AI**: Groq API (Llama 3, Vision, Whisper)
- **Cache/Rate Limit**: Upstash Redis
- **Queue**: BullMQ
- **Deployment**: Render.com (monolith target)

## 📁 Project Structure

```text
├── services/api/ src/        # Express backend source
│   ├── ai/                   # AI inference modules (Groq)
│   ├── gateway/              # Auth, Rate limiting, RLS middleware
│   ├── modules/              # 15 business logic modules
│   └── queue/                # Async job processing
├── packages/shared-types/    # Single source of truth for TypeScript interfaces
├── supabase/                 # DB migrations and demo seed data
├── api-contracts/fixtures/   # Mock data for frontend development
└── INTEGRATION_GUIDE.txt     # Developer handbook for front-to-back merging
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project (Free tier)
- Groq API Key (Free tier)
- Upstash Redis Account (Free tier)

### Installation
1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   cd services/api
   npm install
   ```
3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Fill in your credentials
   ```
4. **Database Setup**:
   - Initialize Supabase: `npx supabase init`
   - Push schema: `npx supabase db push`
   - Seed data: See `INTEGRATION_GUIDE.txt` for Psql commands.

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

## 📖 Integration Guide
For the frontend developer merging the citizen and officer apps, please refer to the [INTEGRATION_GUIDE.txt](./INTEGRATION_GUIDE.txt). It contains code examples, auth flows, and all 40+ API endpoints.

## 🛡️ License
Proprietary — Developed for GHMC NagarSeva Project v2.0.
