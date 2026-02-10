# ==============================================
# Stage 1: Build frontend
# ==============================================
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Build args for Vite (VITE_ prefixed env vars are embedded at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_PAYPAL_CLIENT_ID
ARG VITE_PAYPAL_PRO_PLAN_ID
ARG VITE_PAYPAL_PREMIUM_PLAN_ID
ARG VITE_GOOGLE_CLIENT_ID

# Install dependencies first (better cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build


# ==============================================
# Stage 2: Production runtime
# ==============================================
FROM node:20-slim

# Install Python 3 and pip
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node.js production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Install Python dependencies
COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir --break-system-packages -r requirements.txt

# Copy backend server
COPY server/ ./server/

# Copy Python source files
COPY workflow.py prompts.py api_config.py ./
COPY api_call/ ./api_call/

# Copy skill references (used by workflow)
COPY baoyu-skills/ ./baoyu-skills/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Create directories
RUN mkdir -p outputs logs

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV MOCK_GENERATION=false

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
