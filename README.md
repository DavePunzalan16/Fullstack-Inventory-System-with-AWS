# Inventory Management Dashboard

A full-stack inventory, expense, and analytics dashboard. Staff and admins track
products and stock movements, record expenses, and view real-time analytics, with
role-based access control enforced on both the API and the UI.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![Next.js](https://img.shields.io/badge/Next.js-15-000000)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-22-339933)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748)
![Redux](https://img.shields.io/badge/Redux-RTK%20Query-764ABC)
![AWS](https://img.shields.io/badge/AWS-Free%20Tier-232F3E)

## Features

- Dashboard: total products, total stock value, low-stock count, this month expenses,
  plus 12-month trend, expense-by-category, and top-products charts.
- Products: paginated / sortable / filterable data grid, low-stock badges, CRUD, and
  S3-backed image upload (admin only for writes).
- Stock movements: restock / sale / adjustment records that atomically adjust stock.
- Expenses: category and date-range filters, category breakdown chart, admin CRUD.
- Users: admin-only directory of users and roles.
- Auth: Cognito sign-up / sign-in; JWT attached to every API request.
- Theming: dark (default) / light, persisted across sessions.

## Architecture

```mermaid
flowchart LR
  B["Browser"]
  AMP["Amplify Hosting (Next.js)"]
  APIGW["API Gateway (HTTPS)"]
  EC2["EC2 t2.micro: Express + pm2"]
  RDS[("RDS PostgreSQL t3.micro")]
  S3["S3 (product images)"]
  COG["Cognito User Pool"]
  CW["CloudWatch (logs + alarms)"]

  B --> AMP
  B --> COG
  AMP --> APIGW
  APIGW --> EC2
  EC2 --> RDS
  EC2 --> S3
  EC2 --> COG
  EC2 --> CW
```

## Tech Stack

| Layer      | Technology                                                    |
|------------|---------------------------------------------------------------|
| Frontend   | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4    |
| State/data | Redux Toolkit + RTK Query (single HTTP layer)                 |
| UI         | MUI + MUI X DataGrid, Recharts                                |
| Backend    | Node.js 22, Express 4, TypeScript (strict)                    |
| Data       | PostgreSQL + Prisma ORM                                       |
| Auth       | Amazon Cognito (JWT), verified via aws-jwt-verify            |
| Testing    | Jest, Supertest, React Testing Library, fast-check           |
| Cloud      | AWS Amplify, EC2, RDS, S3, API Gateway, Cognito, CloudWatch  |

## Repository Structure

```
.
├── api/         # Express + TypeScript REST API (Prisma, Zod, Cognito JWT)
├── frontend/    # Next.js 15 App Router + TypeScript + Tailwind 4 + RTK Query
├── .github/     # CI workflow (lint, typecheck, tests)
├── docker-compose.yml   # local PostgreSQL
├── DEPLOYMENT.md        # step-by-step AWS Free Tier deployment guide
└── ARCHITECTURE.md      # design decisions, tradeoffs, lessons learned
```

## Local Setup

### Quick start (one command)

From the repo root, launch the database, API, and frontend together:

    powershell -ExecutionPolicy Bypass -File .\start-local.ps1

Then open http://localhost:3000, go to /sign-in, and use the dev login buttons
(Admin/Staff) to sign in without AWS Cognito. Logs are written to .local-logs\.

### Manual start (two terminals)
Prerequisites: Node.js 22 (see .nvmrc), npm, Docker (for local PostgreSQL).

Step 1 - Start PostgreSQL:

    docker compose up -d db

Starts PostgreSQL on localhost:5432 (user postgres, password postgres, database inventory).

Step 2 - Configure and start the API (cd api, then cp .env.example .env).

Required environment variables (see api/.env.example):

| Variable                | Local example                                                           |
|-------------------------|-------------------------------------------------------------------------|
| DATABASE_URL            | postgresql://postgres:postgres@localhost:5432/inventory?schema=public   |
| PORT                    | 4000                                                                    |
| ALLOWED_ORIGINS         | http://localhost:3000                                                   |
| AWS_REGION              | us-east-1                                                               |
| AWS_ACCESS_KEY_ID       | (your key, for S3 uploads)                                              |
| AWS_SECRET_ACCESS_KEY   | (your secret)                                                           |
| COGNITO_USER_POOL_ID    | (your pool id)                                                          |
| COGNITO_CLIENT_ID       | (your app client id)                                                    |

Then run: npm install, npx prisma migrate deploy, npm run db:seed, and start the API
with the dev script (API on http://localhost:4000).

Step 3 - Configure and start the frontend (cd frontend, npm install --legacy-peer-deps).

| Variable                          | Local example           |
|-----------------------------------|-------------------------|
| NEXT_PUBLIC_API_BASE_URL          | http://localhost:4000   |
| NEXT_PUBLIC_COGNITO_USER_POOL_ID  | (your pool id)          |
| NEXT_PUBLIC_COGNITO_CLIENT_ID     | (your app client id)    |

Start the frontend with the dev script (frontend on http://localhost:3000).

## Scripts

From either api/ or frontend/: lint (ESLint), typecheck (tsc --strict --noEmit),
test (Jest), build (production build).

## Demos

Add at least three screenshots / GIFs here:

1. docs/demo-dashboard.png - Dashboard with summary cards and charts
2. docs/demo-products.png - Product grid with low-stock badges and filters
3. docs/demo-expenses.png - Expense list, filters, and category breakdown chart

## Documentation

- ARCHITECTURE.md - design decisions, AWS tradeoffs, lessons learned
- DEPLOYMENT.md - step-by-step AWS Free Tier deployment

## License

Portfolio / demonstration project.
