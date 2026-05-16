FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for workspace management
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --workspace=@team-task-manager/api

# Copy source code
COPY apps/api ./apps/api

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Build the application
RUN npm run build --workspace=@team-task-manager/api

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Copy built files and production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose the dynamic port
EXPOSE 4000

# Start command: Apply migrations, seed, and start the server
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/server.js"]

