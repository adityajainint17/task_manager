# Production Deployment Guide: Railway

This project is now production-hardened and optimized for Railway deployment using Docker and PostgreSQL.

## 1. Prerequisites

- A [Railway](https://railway.com/) account.
- [Railway CLI](https://docs.railway.com/guides/cli) installed (optional but recommended).

## 2. Environment Variables

Set the following variables in your Railway service settings:

### Backend (API Service)
| Variable | Value | Description |
| --- | --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway will auto-populate this from the Postgres service. |
| `JWT_ACCESS_SECRET` | `your-long-random-string` | Secret for access tokens. |
| `JWT_REFRESH_SECRET` | `your-another-random-string` | Secret for refresh tokens. |
| `CLIENT_URL` | `https://your-frontend-url.up.railway.app` | The public URL of your frontend service. |
| `PORT` | `4000` | Internal port (Railway dynamic port will overwrite this). |
| `NODE_ENV` | `production` | Set to production. |

### Frontend (Web Service)
| Variable | Value | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://your-api-url.up.railway.app/api` | Public URL of your backend service (include `/api`). |
| `PORT` | `3000` | Internal port. |

> [!IMPORTANT]
> Since `NEXT_PUBLIC_API_URL` is needed at **build time**, you must ensure it is defined in the Railway "Variables" section before the first build starts.

## 3. Deployment Steps

1. **Connect Repository**: Push your code to GitHub and connect it to a new Railway project.
2. **Add Services**:
   - Add a **PostgreSQL** database service.
   - Add the **Backend service** (pointing to `apps/api/Dockerfile`).
   - Add the **Frontend service** (pointing to `apps/web/Dockerfile`).
3. **Configure Building**:
   - The project includes `railway.api.json` and `railway.web.json` which tell Railway exactly which Dockerfiles to use.
4. **Database Initialization**:
   - The backend Docker image is configured to automatically run `prisma migrate deploy` and `prisma db seed` on startup. 
   - Seeding only happens if the `User` table is empty.

## 4. Local Build Validation (Optional)

To verify the images locally before pushing:

### Backend
```bash
docker build -t team-task-api -f apps/api/Dockerfile .
```

### Frontend
```bash
docker build -t team-task-web --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api -f apps/web/Dockerfile .
```

## 5. Demo Accounts

After deployment, the following accounts are created automatically:
- **Admin**: `admin@demo.com` / `Password123!`
- **Lead**: `lead@demo.com` / `Password123!`
- **Member**: `member@demo.com` / `Password123!`
