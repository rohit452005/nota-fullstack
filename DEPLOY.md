# nota. — Deployment Guide
## Stack: Node.js + MongoDB Atlas + Vercel

---

## 1. MongoDB Atlas Setup (Free Tier)

1. Go to https://cloud.mongodb.com → Create free account
2. Create a **free M0 cluster** (any region)
3. Under **Database Access** → Add a database user (username + password)
4. Under **Network Access** → Add IP: `0.0.0.0/0` (allow all — Vercel uses dynamic IPs)
5. Click **Connect** → **Drivers** → Copy your connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/nota?retryWrites=true&w=majority
   ```

---

## 2. Deploy Backend to Vercel

```bash
cd backend
npm install -g vercel     # if not installed
vercel login
vercel                    # follow prompts, set project name e.g. "nota-backend"
```

### Set Environment Variables in Vercel Dashboard:
Go to your backend project → Settings → Environment Variables → add each:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Run same command again (different value) |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `ANTHROPIC_API_KEY` | Your key from https://console.anthropic.com |
| `FRONTEND_URL` | `https://nota-frontend.vercel.app` (your frontend URL, set after frontend deploy) |
| `NODE_ENV` | `production` |

After setting vars: `vercel --prod` to redeploy.

**Note your backend URL**: `https://nota-backend-xxxx.vercel.app`

---

## 3. Deploy Frontend to Vercel

```bash
cd frontend
vercel login              # already logged in
vercel                    # follow prompts, set project name e.g. "nota-frontend"
```

### Set Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://nota-backend-xxxx.vercel.app/api` |

Then deploy: `vercel --prod`

---

## 4. Update CORS

Go back to backend Vercel project → Environment Variables → update `FRONTEND_URL` to your actual frontend URL → redeploy backend:

```bash
cd backend
vercel --prod
```

---

## 5. Verify Everything Works

Test your backend health:
```
curl https://nota-backend-xxxx.vercel.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

Then visit your frontend URL and create an account!

---

## Local Development

### Backend:
```bash
cd backend
cp .env.example .env     # fill in your values
npm install
npm run dev              # runs on http://localhost:5000
```

### Frontend:
```bash
cd frontend
cp .env.example .env     # set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # runs on http://localhost:3000
```

---

## Project Structure

```
nota/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app entry
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js           # User schema + bcrypt
│   │   │   └── Note.js           # Note schema + indexes
│   │   ├── controllers/
│   │   │   ├── authController.js # signup, login, refresh, logout
│   │   │   ├── notesController.js# CRUD + pin + search
│   │   │   └── aiController.js   # beautify, categorize, ideas
│   │   ├── middleware/auth.js     # JWT protect middleware
│   │   └── routes/               # auth, notes, ai
│   ├── vercel.json
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx              # App entry + routing
│   │   ├── lib/api.js            # Axios + auto token refresh
│   │   ├── context/AuthContext   # Auth state + login/logout
│   │   ├── hooks/useNotes.js     # Notes CRUD + search
│   │   └── pages/
│   │       ├── AuthPage.jsx      # Login + Signup UI
│   │       └── AppPage.jsx       # Main notes app UI
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   ├── package.json
│   └── .env.example
│
└── DEPLOY.md                     # This file
```

---

## Security Features Included
- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens (15min) + refresh tokens (7 days)
- Anthropic API key stays server-side only (never exposed to browser)
- Rate limiting: 100 req/15min global, 10 AI req/min
- Helmet.js security headers
- Input validation on all endpoints
- CORS locked to your frontend URL
- MongoDB indexes for performance
