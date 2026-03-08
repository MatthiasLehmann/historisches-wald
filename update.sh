#!/bin/bash

echo "Update gestartet"

cd /var/www/historisches-wald

git pull origin main

cd frontend

npm install

npm run build

cd ..

cd backend

npm install

#npm run build

#cd ..

pm2 restart historisches-backend

systemctl reload nginx

echo "Update abgeschlossen"