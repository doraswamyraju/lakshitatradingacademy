# Lakshita Trading Academy - Deployment Guide

To deploy the latest updates to the production VPS, follow these simple steps.

## 1. Quick Deploy (Recommended)
Navigate to the project root and run the deployment script:
```bash
cd /var/www/lakshitatradingacademy
sh scripts/deploy.sh
```

## 2. Troubleshooting
If the deployment script fails to restart the service, check the process names:
```bash
pm2 list
```
If the name is different (e.g., `backend` instead of `quant-engine`), update the script or use:
```bash
pm2 restart <correct-name>
```

## 3. Manual Steps (If needed)
1. `git pull origin main`
2. `npm install && npm run build` (Frontend)
3. `cd backend && npm install && npx prisma db push --accept-data-loss && npm run build` (Backend)
4. `pm2 restart quant-engine`

