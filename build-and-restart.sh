#!/bin/bash
cd /root/doctor-portal
npx next build
pm2 delete doctor-portal 2>/dev/null
pm2 start "npx next start -p 3002" --name doctor-portal
pm2 save
sleep 5
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3002
