# Lakshita Trading Academy - Deployment Guide

This document outlines the standard deployment procedure for the Lakshita Trading Academy application on the production VPS.

## 1. Project Path
**VPS Production Directory:** `/var/www/lakshitatradingacademy`
**PM2 Process Name:** `quant-engine`

## 2. Deployment Commands

Run these commands sequentially on the VPS to pull the latest changes, build the applications, and restart the live engine.

```bash
# 1. Navigate to the exact project directory
cd /var/www/lakshitatradingacademy

# 2. Pull the latest code from GitHub
git pull origin main

# 3. Install frontend dependencies and build the production React bundle
npm install
npm run build

# 4. Navigate to the backend directory
cd backend

# 5. Install backend dependencies
npm install

# 6. Synchronize the latest Prisma database schema
# (Warning: --accept-data-loss is used for prototype drops. Remove for safe migrations).
npx prisma db push --accept-data-loss

# 7. Build the TypeScript backend 
npm run build

# 8. Restart the PM2 process to apply backend changes
pm2 restart quant-engine
# Note: if you have other attached services, you can run pm2 restart all

# 9. Verify the logs to ensure a clean boot
pm2 logs quant-engine --lines 20
```

## 3. Post-Deployment Checks
- Log into the dashboard.
- Verify WebSocket connectivity in the Terminal (`[WebSocket] Terminal Connected:` should appear in PM2 logs).
- Ensure "System Broker (Global)" is authenticated in the API Gateway.
