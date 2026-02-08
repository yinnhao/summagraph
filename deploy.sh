#!/usr/bin/env bash
# ==============================================
# SummaGraph Deployment Script (Non-Docker)
# ==============================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prerequisites:
#   - Node.js >= 18.x
#   - Python 3.x
#   - npm
#   - pm2 (npm install -g pm2)

set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_PREFIX="[SummaGraph Deploy]"

log()  { echo "$LOG_PREFIX $*"; }
err()  { echo "$LOG_PREFIX ERROR: $*" >&2; }

# ------ Pre-flight checks ------
log "Starting deployment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    err "Node.js is not installed. Please install Node.js >= 18.x"
    exit 1
fi
NODE_VER=$(node -v)
log "Node.js version: $NODE_VER"

# Check Python
if ! command -v python3 &> /dev/null; then
    err "Python 3 is not installed. Please install Python 3.x"
    exit 1
fi
PY_VER=$(python3 --version)
log "Python version: $PY_VER"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    log "PM2 not found. Installing globally..."
    npm install -g pm2
fi

cd "$APP_DIR"

# ------ Step 1: Install Node.js dependencies ------
log "Step 1/5: Installing Node.js dependencies..."
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Also need dev dependencies for building
log "Installing dev dependencies for build..."
npm install

# ------ Step 2: Install Python dependencies ------
log "Step 2/5: Installing Python dependencies..."
if [ -f requirements.txt ]; then
    pip3 install -r requirements.txt --quiet 2>/dev/null || \
    python3 -m pip install -r requirements.txt --quiet
fi

# ------ Step 3: Build frontend ------
log "Step 3/5: Building frontend..."
npm run build

# ------ Step 4: Create necessary directories ------
log "Step 4/5: Creating directories..."
mkdir -p outputs logs

# ------ Step 5: Start/Restart with PM2 ------
log "Step 5/5: Starting application with PM2..."

# Check if .env exists
if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        log "No .env found. Copying from .env.production.example..."
        cp .env.production.example .env
        log "WARNING: Please edit .env with your actual configuration!"
    fi
fi

# Stop existing instance if running
pm2 stop summagraph 2>/dev/null || true
pm2 delete summagraph 2>/dev/null || true

# Start with PM2
pm2 start server/index.js \
    --name summagraph \
    --env production \
    --node-args="--env-file=.env" \
    --max-memory-restart 512M \
    --time

# Save PM2 process list (survives reboot with pm2 startup)
pm2 save

log "========================================="
log "Deployment complete!"
log "========================================="
log ""
log "Application running at: http://localhost:${PORT:-3001}"
log ""
log "Useful commands:"
log "  pm2 status          - Check app status"
log "  pm2 logs summagraph - View logs"
log "  pm2 restart summagraph - Restart app"
log "  pm2 stop summagraph - Stop app"
log ""
log "To auto-start on reboot:"
log "  pm2 startup"
log "  pm2 save"
log ""
log "To set up Nginx reverse proxy:"
log "  See nginx.conf.example"
log "========================================="
