# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./
COPY knexfile.ts ./

# Install all dependencies (including devDependencies needed for tsc)
RUN npm ci

# Copy source and compile TypeScript → dist/
COPY src/ ./src/

RUN npm run build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production dependency manifests
COPY package*.json ./
COPY knexfile.ts ./
COPY tsconfig.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy migrations and seeds (needed at runtime for knex commands)
COPY src/migrations ./src/migrations
COPY src/seeds ./src/seeds

# Copy the docker entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER appuser

EXPOSE 3000

# Use dumb-init to handle signals correctly
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
