#!/bin/bash
set -e
cd /root/doctor-portal
echo ">>> Generating Prisma client..."
npx prisma generate
echo ">>> Building..."
npx next build
echo ">>> Restarting PM2..."
pm2 delete doctor-portal 2>/dev/null
pm2 start "npx next start -p 3002" --name doctor-portal
pm2 save
echo ">>> Done!"
pm2 logs doctor-portal --lines 3 --nostream 2>&1 | grep -v 'prisma:query'
