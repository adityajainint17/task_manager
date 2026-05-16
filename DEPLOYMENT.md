# Production Deployment Guide: TeamFlow

This project is fully production-hardened for Railway deployment using Docker and PostgreSQL.

## 1. Quick Start (Local Testing)

To run the entire stack locally (Frontend, Backend, and Database) exactly as it will run in production:

```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Postgres**: localhost:5432

---

## 2. Railway Deployment

### Step A: Infrastructure Setup
1. Create a new Project on Railway.
2. Add a **PostgreSQL** service.
3. Add two **GitHub Repo** services (or use the CLI to deploy from the same repo):
   - **Service 1 (API)**: Point to `apps/api/Dockerfile`.
   - **Service 2 (Web)**: Point to `apps/web/Dockerfile`.

### Step B: Environment Variables
Configure the following in the **Variables** tab for each service:

#### Backend (API)
| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_ACCESS_SECRET` | `your-secure-secret` |
| `JWT_REFRESH_SECRET` | `your-secure-secret` |
| `CLIENT_URL` | `https://your-frontend-domain.up.railway.app` |
| `NODE_ENV` | `production` |

#### Frontend (Web)
| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain.up.railway.app/api` |

> [!IMPORTANT]
> `NEXT_PUBLIC_API_URL` is required during the build phase. Set it **before** triggering the deployment.

---

## 3. Reliability Features

- **Database Connection Retries**: The backend will attempt to connect to the database 5 times with a 5-second delay between each attempt. This prevents the service from crashing if the database is still warming up.
- **Auto-Migrations**: The API container automatically runs `prisma migrate deploy` on startup.
- **Idempotent Seeding**: The system automatically seeds the database with demo users only if the database is empty.
- **Next.js Standalone**: The frontend is optimized using Next.js standalone mode, resulting in significantly smaller image sizes and faster cold starts.

---

## 4. Manual Docker Commands

If you need to build or push manually:

### Build
```bash
# Backend
docker build -t teamflow-api -f apps/api/Dockerfile .

# Frontend
docker build -t teamflow-web --build-arg NEXT_PUBLIC_API_URL=https://your-api.com/api -f apps/web/Dockerfile .
```

### Run (Standalone)
```bash
# Backend
docker run -p 4000:4000 -e DATABASE_URL=... teamflow-api

# Frontend
docker run -p 3000:3000 teamflow-web
```

---

## 5. Demo Credentials
- **Admin**: `admin@demo.com` / `Password123!`
- **Lead**: `lead@demo.com` / `Password123!`
- **Member**: `member@demo.com` / `Password123!`
