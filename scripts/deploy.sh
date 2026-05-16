#!/bin/bash
# Lakshita Trading Academy - Quick Deploy Script

echo "🚀 Starting Deployment..."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Frontend Build
echo "🏗️ Building Frontend..."
npm install
npm run build

# 3. Backend Build & Database Sync
echo "⚙️ Building Backend..."
cd backend
npm install
npx prisma db push --accept-data-loss
npm run build

# 4. Restart PM2 Process
echo "🔄 Restarting PM2 process..."
# Check for lakshita-api first, then quant-engine, then backend
if pm2 list | grep -q "lakshita-api"; then
    pm2 restart lakshita-api
elif pm2 list | grep -q "quant-engine"; then
    pm2 restart quant-engine
elif pm2 list | grep -q "backend"; then
    pm2 restart backend
else
    echo "❌ ERROR: PM2 process not found. Please run 'pm2 list' to check the name."
    exit 1
fi

echo "✅ Deployment Successful!"
pm2 list
