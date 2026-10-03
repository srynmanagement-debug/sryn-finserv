# Multi-stage Dockerfile for SRYN FinServ Node.js Monolith Backend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace package definitions
COPY package.json package-lock.json tsconfig.json ./
COPY backend/package.json ./backend/
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/

# Install all dependencies
RUN npm ci

# Copy source files
COPY backend ./backend
COPY packages ./packages

# Build shared packages and backend
RUN npm run build --workspace=packages/config
RUN npm run build --workspace=packages/types
RUN npm run build --workspace=packages/validation
RUN npm run build --workspace=backend

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy root package files and node_modules from builder
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json

EXPOSE 3000

# Default command starts backend API server
CMD ["node", "backend/dist/index.js"]
