# Deployment Guide — MadMix Insights Portal

Two services to deploy:
- **Backend** → [Render](https://render.com) (Python / FastAPI)
- **Frontend** → [Vercel](https://vercel.com) (React / Vite)

Deploy the backend **first** — you need its URL before setting up the frontend.

---

## Prerequisites

- Your Supabase project is live with the schema applied (`backend/schema.sql`)
- You have pushed this repo to GitHub / GitLab
- You have the following secrets on hand:
  - `SUPABASE_URL` — from Supabase Dashboard → Settings → API
  - `SUPABASE_ANON_KEY` — same page, labelled "anon / public"
  - `SUPABASE_SERVICE_ROLE_KEY` — same page, labelled "service_role" (keep this secret)
  - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/account/keys)

---

## Part 1 — Deploy the Backend to Render

### 1. Create a new Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Connect your GitHub account if not already connected
3. Select this repository

### 2. Configure the service

| Field | Value |
|-------|-------|
| **Name** | `madmix-backend` (or any name) |
| **Root Directory** | `my-mvo-app/backend` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

> The `render.yaml` at `backend/render.yaml` pre-fills most of this. If Render detects it automatically, you only need to confirm the values above.

### 3. Set environment variables

Click **Advanced** → **Add Environment Variable** for each:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |
| `ALLOWED_ORIGINS` | `http://localhost:5173` *(update after Vercel deploy)* |
| `PYTHON_VERSION` | `3.12.0` |

### 4. Deploy

Click **Create Web Service**. Render will install dependencies and start the server. This takes 2–3 minutes on a free instance.

### 5. Verify

Once deployed, visit:
```
https://madmix-backend.onrender.com/health
```
You should see:
```json
{"status": "ok", "service": "madmix-insights-api", "version": "1.0.0"}
```

**Copy your Render URL** — you'll need it in Part 2 and in the CORS update below.

---

## Part 2 — Deploy the Frontend to Vercel

### 1. Import the project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select this repo
3. Vercel will detect the `vercel.json` in `my-mvo-app/frontend/`

### 2. Configure the project

| Field | Value |
|-------|-------|
| **Root Directory** | `my-mvo-app/frontend` |
| **Framework Preset** | Vite *(auto-detected)* |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 3. Set environment variables

Under **Environment Variables** before clicking Deploy:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon key |
| `VITE_API_URL` | `https://madmix-backend.onrender.com` *(your Render URL, no trailing slash)* |

> `VITE_*` variables are baked into the JS bundle at build time. If you change them later, redeploy.

### 4. Deploy

Click **Deploy**. Vercel builds and deploys in ~60 seconds.

### 5. Verify

Open the Vercel URL in a browser. You should see the MadMix login screen. Sign in and confirm data loads on the Dashboard.

---

## Part 3 — Post-Deploy: Fix CORS

The backend only allows origins listed in `ALLOWED_ORIGINS`. After getting your Vercel URL:

1. Go to Render Dashboard → **madmix-backend** → **Environment**
2. Update `ALLOWED_ORIGINS` to include your Vercel domain:
   ```
   https://your-app.vercel.app,http://localhost:5173
   ```
3. Click **Save Changes** — Render will restart the service automatically

Without this step, the browser will block all API calls from the frontend with a CORS error.

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Public anon key (used for JWT verification) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (bypasses RLS for all DB writes) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for the decisions engine |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins |
| `PYTHON_VERSION` | Yes | `3.12.0` |
| `SKIP_RATE_THRESHOLD` | No | Default `0.30` — skip rate that flags a city as high-risk |
| `LOW_SALES_MRP_THRESHOLD` | No | Default `5000.0` — min MRP to consider a city active |
| `A2S_THRESHOLD` | No | Default `0.45` — Ad-to-Sales ratio ceiling |
| `DECISIONS_CACHE_TTL_HOURS` | No | Default `24` — how long decision results are cached |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Same Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Same anon key |
| `VITE_API_URL` | Yes | Full Render backend URL (e.g. `https://madmix-backend.onrender.com`) |

---

## Troubleshooting

**`TypeError: Failed to fetch` / CORS error in browser console**
→ Check `ALLOWED_ORIGINS` on Render includes your exact Vercel URL (no trailing slash)

**Backend returns 401 Unauthorized**
→ `SUPABASE_URL` or `SUPABASE_ANON_KEY` mismatch. The backend uses these to verify JWTs from the frontend.

**Backend returns 500 on `/api/v1/analysis`**
→ Check Render logs. Usually means `SUPABASE_SERVICE_ROLE_KEY` is wrong or the `pods_sales` table is empty.

**Vercel build fails: `VITE_API_URL` is undefined**
→ Env vars must be set *before* the first deploy. Go to Vercel → Project → Settings → Environment Variables and add them, then trigger a redeploy.

**Free Render instance cold-starts (30–60s delay)**
→ Expected on the free plan. The first request after inactivity wakes the service. The frontend shows a loading spinner while this happens. Upgrade to a paid instance to avoid cold starts.

**Import page: clearing data returns 500**
→ Ensure the `SUPABASE_SERVICE_ROLE_KEY` is the service role key, not the anon key. The delete endpoint requires it to bypass RLS.
