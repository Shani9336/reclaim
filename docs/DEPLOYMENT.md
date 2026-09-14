# FoundIt Deployment Guide

This guide covers deploying FoundIt to production using **Vercel** (Next.js frontend & API routes), **Railway** (Python FastAPI Matching Engine), **Neon** (PostgreSQL), and **Cloudinary** (Media CDN).

---

## Architecture Overview

```
                        ┌───────────────────────────────┐
                        │      Client Browser / PWA     │
                        └───────────────┬───────────────┘
                                        │ HTTPS
                                        ▼
                        ┌───────────────────────────────┐
                        │       Vercel (Next.js)        │
                        │ - App Router UI & Server Actions
                        │ - REST API Routes             │
                        └───┬───────────┬───────────┬───┘
                            │           │           │
                   Prisma   │           │ Upload    │ HTTP + API Key
                   Database │           │ Preset    │
                            ▼           ▼           ▼
                   ┌────────────┐ ┌───────────┐ ┌──────────────────────┐
                   │Neon (Postgres) Cloudinary│ │ Railway (FastAPI)    │
                   │  Database  │ │ CDN Storage│ │ sentence-transformers│
                   └────────────┘ └───────────┘ └──────────────────────┘
```

---

## 1. Database Setup (Neon PostgreSQL)

1. Navigate to [Neon.tech](https://neon.tech) and create a new project named `foundit-prod`.
2. Copy the pooled connection string:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Push the schema and seed initial data:
   ```bash
   cd foundit
   DATABASE_URL="your-neon-url" npm run db:push
   DATABASE_URL="your-neon-url" npm run db:seed
   ```

---

## 2. Cloudinary Media Storage

1. Create a free account at [Cloudinary](https://cloudinary.com).
2. Note down your `Cloud Name`, `API Key`, and `API Secret`.
3. Create an **Unsigned Upload Preset**:
   - Go to **Settings** > **Upload** > **Upload presets**.
   - Click **Add upload preset**.
   - Preset name: `foundit_items`.
   - Signing Mode: **Unsigned**.
   - Folder: `foundit/items`.
   - Save.

---

## 3. Python Matching Engine (Railway)

1. Fork or push the repository to GitHub.
2. Log in to [Railway.app](https://railway.app).
3. Click **New Project** > **Deploy from GitHub repo**.
4. Set the Root Directory to `/foundit/services/matching-engine` (or deploy from dedicated repo).
5. Railway will automatically detect the `Dockerfile` and `railway.json`.
6. Add Environment Variables in the Railway dashboard:
   - `PORT`: `8000`
   - `ENVIRONMENT`: `production`
   - `API_KEY`: Generate a random 32-character key (e.g. `openssl rand -hex 16`)
   - `ALLOWED_ORIGINS`: `https://your-vercel-domain.vercel.app`
7. Once deployed, copy your Railway public URL (e.g., `https://matching-engine-production-xyz.upstash.app`).

---

## 4. Frontend & Next.js Deployment (Vercel)

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project** and import your repository.
3. Configure the Root Directory:
   - Set Root Directory to `foundit`.
4. Add all environment variables:

| Variable | Value / Description |
|----------|---------------------|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `RESEND_API_KEY` | From Resend dashboard |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` |
| `UPSTASH_REDIS_REST_URL` | From Upstash Redis console |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash Redis console |
| `MATCHING_SERVICE_URL` | Your deployed Railway URL (e.g. `https://matching-engine.railway.app`) |
| `MATCHING_SERVICE_API_KEY` | Must match `API_KEY` in Railway |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `FoundIt` |

5. Click **Deploy**. Vercel will build Next.js, run `prisma generate`, and host the application edge-globally.

---

## 5. Post-Deployment Verification

1. Access `https://your-domain.vercel.app/api/health`.
   - Verify `database.status === "ok"` and `matcher.status === "ok"`.
2. Visit `/browse` and verify pre-seeded items display with images and category filters.
3. Submit a test lost item at `/lost/new`.
4. Verify matching suggestions trigger automatically and notifications appear in the header bell.
