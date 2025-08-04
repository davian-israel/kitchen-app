# Use the official Node.js 18 image as base
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Declare build-time arguments for environment variables with defaults
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG NEXTAUTH_SECRET="build-time-secret-fallback"
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_build_key"
ARG STRIPE_SECRET_KEY="sk_test_build_key"
ARG NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID="build_merchant_id"

# Set environment variables from build args with fallbacks
ENV DATABASE_URL=${DATABASE_URL:-"postgresql://build:build@localhost:5432/build"}
ENV NEXTAUTH_URL=${NEXTAUTH_URL:-"http://localhost:3000"}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-"build-time-secret-fallback"}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-"pk_test_build_key"}
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-"sk_test_build_key"}
ENV NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID=${NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID:-"build_merchant_id"}

# Skip environment validation during build to prevent failures
ENV SKIP_ENV_VALIDATION=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Declare build-time arguments for runtime environment variables
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG STRIPE_SECRET_KEY
ARG NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Set runtime environment variables from build args
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID=$NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]