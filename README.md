# Inventory Management Dashboard

A full-stack Inventory Management Dashboard built with Next.js (App Router, TypeScript) on
the frontend and Node.js/Express (TypeScript) on the backend, backed by PostgreSQL via
Prisma ORM. Deployed on AWS Free Tier services (Amplify, EC2, RDS, S3, API Gateway, Cognito).

> This is a stub README created during initial scaffolding. Full setup instructions,
> architecture diagram, tech-stack badges, and visual demos are added in a later task
> (see `.kiro/specs/inventory-management-dashboard/tasks.md`, task 17.1).

## Repository Structure

```
.
├── api/         # Node.js + Express + TypeScript REST API (Prisma, Zod, Cognito JWT)
├── frontend/    # Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + RTK Query
├── .editorconfig
├── .gitignore
└── .nvmrc       # Node.js version pin
```

## Prerequisites

- Node.js (version pinned in `.nvmrc`)
- npm
- Docker (for the local PostgreSQL instance, added in a later task)

## Getting Started

Each project manages its own dependencies and scripts. From either `api/` or `frontend/`:

```bash
npm install
npm run lint       # ESLint
npm run typecheck  # tsc --strict, no emit
npm run test       # Jest test suite
npm run build      # production build
```

## License

Portfolio / demonstration project.
