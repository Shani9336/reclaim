# ReClaim — Smart Campus Lost & Found Platform

> **Community Engagement Project (CEP) — Semester 5 | Devkiba College, Silvassa**  
> **Project Leader**: Shani (`shaniyadav777am@gmail.com`)

**ReClaim** is a modern, full-stack digital lost-and-found web & mobile application designed specifically for college campuses and local communities. It bridges the gap between students who lose items and good samaritans who find them through intelligent text & category matching, proof-of-ownership claims verification, and administrative moderation.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **Backend** | Next.js Server Components & Route Handlers |
| **Database** | Cloud PostgreSQL (Neon Serverless) + Prisma ORM |
| **Authentication** | NextAuth.js (Session & JWT with live role synchronization) |
| **Role Control** | 4-Tier RBAC: Project Leader (`SUPER_ADMIN`), Staff (`ADMIN`), Student (`USER`), Finder (`FINDER`) |
| **Matching Engine** | In-App NLP Similarity Engine (Jaccard tokenization, category, brand, and color proximity) |
| **Mobile & PWA** | Progressive Web App (Installable on Android & iOS) |
| **Deployment** | Vercel (Production Cloud Hosting) |

---

## 📁 Project Structure

```
foundit/
├── app/                        # Next.js App Router pages
│   ├── (auth)/login/           # Login page
│   ├── (auth)/register/        # Register page
│   ├── (dashboard)/            # Protected dashboard routes
│   │   ├── browse/             # Browse all items
│   │   ├── lost/new/           # Report lost item (multi-step form)
│   │   ├── found/new/          # Report found item
│   │   ├── matches/            # AI match results
│   │   └── profile/            # User profile
│   ├── admin/                  # Admin dashboard
│   ├── api/                    # API routes
│   │   ├── auth/[...nextauth]/ # NextAuth handler
│   │   ├── items/              # CRUD for items
│   │   ├── claims/             # Claims management
│   │   ├── notifications/      # Notification system
│   │   └── health/             # Health check
│   ├── items/[id]/             # Item detail page
│   └── claims/new/             # Submit a claim
├── components/
│   ├── layout/                 # Navbar, Sidebar
│   ├── items/                  # ItemCard, ItemDetail
│   ├── notifications/          # NotificationBell
│   ├── providers/              # Theme, Session, Query providers
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma singleton
│   ├── utils.ts                # Utility functions
│   ├── cloudinary.ts           # Image upload helpers
│   ├── resend.ts               # Email templates
│   ├── redis.ts                # Rate limiters
│   └── validators/             # Zod schemas
├── prisma/
│   ├── schema.prisma           # Database schema (11 models)
│   └── seed.ts                 # Realistic seed data
├── services/matching-engine/   # Python AI microservice
│   ├── main.py                 # FastAPI app
│   ├── matcher.py              # Matching algorithm
│   ├── models.py               # Pydantic models
│   └── Dockerfile              # Container config
└── middleware.ts               # Route protection
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 20+
- Python 3.11+
- A Neon PostgreSQL database
- Cloudinary account (free tier)
- Resend account (free tier)

### 2. Install Next.js dependencies

```bash
cd foundit
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in all values — see .env.example for instructions
```

### 4. Set up the database

```bash
# Push schema to Neon
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Start the Next.js app

```bash
npm run dev
# → http://localhost:3000
```

### 6. Start the Python matching service

```bash
cd services/matching-engine
python -m venv venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
cp .env.example .env
python main.py
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

---

## 🧠 AI Matching Algorithm

The matching engine computes a **composite similarity score**:

```
Score = 0.50 × text_similarity
      + 0.20 × category_match
      + 0.15 × color_similarity
      + 0.15 × date_proximity
```

- **Text similarity**: Cosine similarity between 384-dim sentence-transformer embeddings
- **Category match**: Exact match (binary — electronics vs electronics)
- **Color similarity**: Color group fuzzy matching
- **Date proximity**: Days difference scoring (same day = 1.0, > 30 days = 0.1)

Items scoring **≥ 0.70** trigger automatic email + in-app notifications.

---

## 🗄️ Database Schema

```
User ─────────┬─ Item (LOST/FOUND)
              │      └─ Match (lostItem ↔ foundItem, score)
              │      └─ Claim (with proof, admin review)
              │      └─ Report (spam/fake reports)
              ├─ Notification
              └─ SavedSearch

Space ─────────── Item (campus/mall/metro location)
```

---

## 🔐 Authentication Flow

1. User clicks "Continue with Google" or enters email
2. Google OAuth → NextAuth callback → creates User + Account in DB
3. Email magic link → Resend sends link → user clicks → session created
4. JWT token contains `{ id, email, role }` — embedded at login, no DB lookup per request
5. Middleware checks JWT on every protected route

---

## 📧 Email Notifications

- **Match found** — sent when AI finds ≥ 70% match for your item
- **Claim submitted** — sent to item owner when someone claims their item
- **Claim approved/rejected** — sent to claimant after admin review

---

## 🚀 Deployment

### Vercel (Next.js)
```bash
# Push to GitHub, connect to Vercel
# Add all env vars from .env.example in Vercel dashboard
vercel --prod
```

### Railway (Python service)
```bash
# Push services/matching-engine/ to separate GitHub repo or monorepo
# Railway auto-detects Dockerfile
# Set PORT, API_KEY, ALLOWED_ORIGINS env vars
```

---

## 👥 Seed Data

The seed script creates:
- **5 users**: admin, alice, bob, carol, dave
- **3 spaces**: DY Patil University, Inorbit Mall, Belapur Metro
- **10 lost items + 10 found items** with realistic Navi Mumbai locations
- **5 AI matches** pre-seeded with score breakdowns
- **3 notifications**

Login with any seeded email (magic link will be sent to that address).

---

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run test         # Run Vitest unit tests
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:seed      # Seed database
npm run db:migrate   # Run migrations
```

---

*Built with ❤️ for DY Patil University CEP — Semester 5, 2024*
