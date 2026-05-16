# TeamFlow Workforce Management

This is a professional internal platform built for managing teams, tracking attendance, and handling project tasks all in one place. It's designed to be clean, fast, and easy to use for everyone from admins to the execution team.

## What's Inside

- **Unified Dashboard**: Personalized views for different roles (Admin, Lead, Tasker).
- **Attendance Tracker**: A simple punch-in/out system to keep track of work hours.
- **Task Management**: Full lifecycle tracking for tasks—start, pause, and complete them as you go.
- **Leave Requests**: Apply for time off and get approvals directly through the app.
- **Performance Stats**: Visual charts to see how projects and teams are progressing.
- **Role Control**: Proper permissions for Admins, Project Leads, Quality Leads, and Taskers.

## Tech Used

- **Frontend**: Next.js, Tailwind CSS, Framer Motion, Recharts.
- **Backend**: Node.js with Express and Prisma.
- **Database**: PostgreSQL (Production ready) or SQLite (for local testing).
- **Security**: JWT authentication with secure cookies.

## How to Run it Locally

1. **Install everything**:
   ```bash
   npm install
   ```

2. **Setup your environment**:
   Create a `.env` in `apps/api` and `.env.local` in `apps/web`. You'll need a `DATABASE_URL` and some JWT secrets.

3. **Prep the database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Fire it up**:
   ```bash
   npm run dev
   ```

## Login for Testing

I've set up some demo accounts to test the different roles:

- **Admin**: `admin@teamflow.dev` / `Password123!`
- **Lead**: `lead@teamflow.dev` / `Password123!`
- **Tasker**: `tasker@teamflow.dev` / `Password123!`

---
Built for smooth team operations.
