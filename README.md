# AOM Analytics Platform

Full-stack data analytics dashboard — deployable via GitHub + Render (backend) + Netlify (frontend) in ~10 minutes, both for free.

---

## Architecture

```
GitHub repo
├── backend/    → Render.com   (free Node.js/Express server)
└── frontend/   → Netlify      (free static hosting)
```

---

## ① Push to GitHub

Open a terminal inside your `analytics-platform/` folder:

```bash
git init
git add .
git commit -m "initial: AOM analytics platform"
```

Create a **new empty repo** on github.com (no README, no .gitignore — you already have them), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/aom-analytics.git
git branch -M main
git push -u origin main
```

---

## ② Deploy Backend → Render.com (free)

1. Go to **https://render.com** → sign up / log in with GitHub
2. Click **New → Web Service**
3. Click **Connect a repository** → select `aom-analytics`
4. Render reads `render.yaml` automatically — just click **Deploy**
5. Wait ~2 min. You get a URL like:
   ```
   https://aom-analytics-api.onrender.com
   ```
6. Verify: open `https://YOUR-APP.onrender.com/api/health` in browser
   → should return `{"status":"ok"}`

> **Free tier note:** Render spins down after 15 min of inactivity.
> First request after sleep takes ~30s. The dashboard falls back to mock data while it wakes up.

---

## ③ Update Frontend with Your Backend URL

Open `frontend/index.html`, find this line near the top of the `<script>` tag:

```js
const PROD_API = 'https://YOUR-APP-NAME.onrender.com/api'; // ← EDIT THIS
```

Replace `YOUR-APP-NAME` with your actual Render app name:

```js
const PROD_API = 'https://aom-analytics-api.onrender.com/api';
```

Commit and push:

```bash
git add frontend/index.html
git commit -m "config: set production API URL"
git push
```

---

## ④ Deploy Frontend → Netlify (free)

### Option A — Connect GitHub (auto-redeploys on every push)

1. Go to **https://netlify.com** → sign up / log in with GitHub
2. Click **Add new site → Import an existing project → GitHub**
3. Select your `aom-analytics` repo
4. Netlify reads `netlify.toml` automatically (publish dir = `frontend`, no build needed)
5. Click **Deploy site**
6. You get a URL like `https://aom-analytics-abc.netlify.app`
7. Optional: rename it in **Site settings → General → Site name**

### Option B — Drag & Drop (30 seconds, no account needed)

1. Go to **https://app.netlify.com/drop**
2. Drag the `frontend/` folder onto the page
3. Done — live URL instantly

---

## ⑤ Allow Your Frontend URL in Backend CORS

Open `backend/server.js` and find:

```js
const ALLOWED_ORIGINS = [
  ...
  // 'https://your-site.netlify.app',  ← uncomment & paste your Netlify URL
];
```

Uncomment that line and paste your real Netlify URL. Save, commit, push — Render auto-redeploys.

```bash
git add backend/server.js
git commit -m "config: allow Netlify origin in CORS"
git push
```

---

## ⑥ Final Checklist

- [ ] `https://YOUR-BACKEND.onrender.com/api/health` → `{"status":"ok"}`
- [ ] `https://YOUR-SITE.netlify.app` → dashboard loads
- [ ] `PROD_API` in `frontend/index.html` = your Render URL
- [ ] Your Netlify URL is in `ALLOWED_ORIGINS` in `backend/server.js`
- [ ] Charts load real data from the API (not just mock)

---

## Local Development

```bash
# Terminal 1 — API server
cd backend
npm install
npm run dev        # auto-reloads with nodemon

# Terminal 2 — Frontend
# Just open frontend/index.html in your browser
# or use VS Code Live Server (port 5500, already whitelisted in CORS)
```

The frontend auto-detects `localhost` and calls `http://localhost:3001/api`.

---

## Project Structure

```
analytics-platform/
├── .gitignore
├── netlify.toml          ← Netlify: publish frontend/, no build step
├── render.yaml           ← Render: run backend/, npm start
├── README.md
├── backend/
│   ├── package.json
│   └── server.js         ← Express REST API (7 endpoints + CORS config)
└── frontend/
    └── index.html        ← Complete dashboard, zero build required
```

---

## Connecting a Real Database

In `backend/server.js`, replace any mock function with a DB query.
Return the same data shape — the frontend stays unchanged.

```bash
cd backend
npm install pg          # PostgreSQL
# or: npm install mongoose   (MongoDB)
# or: npm install mysql2     (MySQL)
```

Add your DB URL in **Render → Environment Variables**:
```
DB_URL = postgresql://user:password@host:5432/analytics
```

---

## API Endpoints

| Method | Path | Params |
|--------|------|--------|
| GET | `/api/health` | — |
| GET | `/api/overview` | — |
| GET | `/api/sales` | `?period=3m\|6m\|12m` |
| GET | `/api/users` | — |
| GET | `/api/products` | — |
| GET | `/api/orders` | `?page=1&limit=20&status=Completed` |
| GET | `/api/orders/:id` | — |
| GET | `/api/reports` | — |
| GET | `/api/analytics/summary` | — |
