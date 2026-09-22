# Production Deployment Guide

This guide deploys the app to three free-tier cloud services:
- Database: Neon (managed PostgreSQL)
- API: Render (Node server)
- Frontend: Vercel (Next.js hosting)

## Why not just Vercel for everything?

Vercel runs serverless functions only. The API is a long-running Express + Prisma
server, which needs a real server host like Render.

---

## Step 1 - Create the database on Neon (free)

1. Go to https://neon.tech and sign up (GitHub works).
2. Create a new project. Name it "inventory".
3. Neon gives you a connection string that looks like:

   postgresql://user:password@ep-xxx-yyy.us-east-1.aws.neon.tech/neondb?sslmode=require

4. Copy it. You will need it in the next steps.
5. Keep the Neon dashboard tab open.

NOTE: Neon's free tier includes 0.5 GB storage and autoscaling to zero when idle.
It wakes up on first request (adds ~1s cold start). For a portfolio demo this is fine.

---

## Step 2 - Deploy the API on Render (free)

1. Go to https://render.com and sign up (GitHub works).
2. Click "New" -> "Web Service" -> "Connect a GitHub repository".
   Select this repo and click Connect.
3. Configure the service:
   - Name: inventory-api
   - Root directory: api
   - Build command: npm ci && npx prisma generate && npm run build
   - Start command: node dist/index.js
   - Instance type: Free
4. Under "Environment Variables" add the following (click "Add variable" for each):

   DATABASE_URL      = (paste your Neon connection string from Step 1)
   PORT              = 10000
   ALLOWED_ORIGINS   = (leave blank for now; update with Vercel URL after Step 3)
   AWS_REGION        = us-east-1
   AWS_ACCESS_KEY_ID = (your IAM key, or placeholder if not using image upload)
   AWS_SECRET_ACCESS_KEY = (your IAM secret, or placeholder)
   S3_BUCKET         = (your S3 bucket name, or placeholder)
   COGNITO_USER_POOL_ID = (your Cognito pool id, or placeholder)
   COGNITO_CLIENT_ID    = (your Cognito client id, or placeholder)
   AUTH_MODE         = dev
   NODE_ENV          = production

   TIP: If you are not using S3 image uploads or Cognito yet, put the word
   "placeholder" in those fields so the env validator does not fail.

5. Click "Create Web Service". Render will build and deploy (takes 2-5 minutes).
6. Wait for the "Deploy succeeded" message. Click "Open" to see your API URL,
   it looks like: https://inventory-api-xxxx.onrender.com
7. Visit https://inventory-api-xxxx.onrender.com/health - you should see:
   {"status":"ok","database":"connected"}
   If database says "disconnected", double-check the DATABASE_URL.

IMPORTANT: On first deploy, run the migrations and seed from your local machine:
(run this from your computer with the Neon DATABASE_URL in your terminal)

   cd api
   DATABASE_URL="your-neon-url-here" npx prisma migrate deploy
   DATABASE_URL="your-neon-url-here" npm run db:seed

NOTE on the seed: it creates the admin@gmail.com/admin123 account. This is the
LOCAL DEV seed. Before sharing the production URL publicly, log in as admin and
change the password from Settings.

---

## Step 3 - Deploy the frontend on Vercel (free)

1. Go to https://vercel.com and sign up (GitHub works).
2. Click "Add New" -> "Project" -> import this GitHub repo.
3. Vercel should auto-detect Next.js. If not, set Framework to "Next.js".
4. Set the Root Directory to: frontend
   (This is critical - Vercel needs to build from the frontend/ subfolder)
5. Under "Environment Variables" add:

   NEXT_PUBLIC_API_BASE_URL      = https://inventory-api-xxxx.onrender.com
                                   (your Render URL from Step 2)
   NEXT_PUBLIC_AUTH_MODE         = dev
   NEXT_PUBLIC_COGNITO_USER_POOL_ID = placeholder  (or your real Cognito id)
   NEXT_PUBLIC_COGNITO_CLIENT_ID    = placeholder  (or your real Cognito id)

6. Click "Deploy". Wait for the build (2-5 minutes).
7. Vercel gives you a URL like: https://your-app.vercel.app
8. Visit the URL. You should see the landing page.

---

## Step 4 - Wire the two services together

After both Render and Vercel deployments are live:

1. Copy your Vercel URL (e.g. https://your-app.vercel.app).
2. Go to Render -> your inventory-api service -> Environment.
3. Update ALLOWED_ORIGINS to your Vercel URL:
   ALLOWED_ORIGINS = https://your-app.vercel.app
4. Click "Save Changes". Render will redeploy automatically.
5. Test the full flow: open your Vercel URL, land on the landing page,
   login as admin@gmail.com/admin123, browse the dashboard.

---

## Step 5 - Change the default admin password (security)

1. Open your production Vercel URL.
2. Log in as admin@gmail.com with password admin123.
3. Go to Settings. Under "Edit profile", change the password to something
   strong that only you know.
4. Optionally change the email too.

---

## Environment variable quick reference

### Render (API)
| Variable               | Where to get it                                    |
|------------------------|----------------------------------------------------|
| DATABASE_URL           | Neon dashboard -> Connection details -> Connection string |
| PORT                   | Always 10000 on Render                             |
| ALLOWED_ORIGINS        | Your Vercel URL                                    |
| AWS_REGION             | e.g. us-east-1                                     |
| AWS_ACCESS_KEY_ID      | IAM user credentials (Step 2 of DEPLOYMENT.md)     |
| AWS_SECRET_ACCESS_KEY  | Same as above                                      |
| S3_BUCKET              | S3 bucket name (Step 7 of DEPLOYMENT.md)           |
| COGNITO_USER_POOL_ID   | Cognito console (Step 9 of DEPLOYMENT.md)          |
| COGNITO_CLIENT_ID      | Same as above                                      |
| AUTH_MODE              | "dev" for email/password login, "cognito" for JWT  |

### Vercel (frontend)
| Variable                          | Value                                    |
|-----------------------------------|------------------------------------------|
| NEXT_PUBLIC_API_BASE_URL          | Your Render API URL                      |
| NEXT_PUBLIC_AUTH_MODE             | "dev"                                    |
| NEXT_PUBLIC_COGNITO_USER_POOL_ID  | Your Cognito pool id (or "placeholder")  |
| NEXT_PUBLIC_COGNITO_CLIENT_ID     | Your Cognito client id (or "placeholder")|

---

## Free-tier limits to watch

| Service | Free limit                                     | What happens when exceeded     |
|---------|------------------------------------------------|-------------------------------|
| Neon    | 0.5 GB storage, compute suspends when idle     | Storage overage billed         |
| Render  | 750 free hours/month, sleeps after 15 min idle | First request wakes it (~30s)  |
| Vercel  | 100 GB bandwidth/month, 6000 build min/month   | Throttled or paused            |

---

## Updating production after code changes

1. Push to main (or merge a branch into main).
2. Render auto-redeploys on push to the connected branch.
3. Vercel auto-redeploys on push to the connected branch.
4. If the schema changed, run migrations manually:
   DATABASE_URL="your-neon-url" npx prisma migrate deploy