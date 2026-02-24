# Historisches-Wald – Installations- und Updateanleitung

## Instalation

Diese Anleitung beschreibt die vollständige Installation, Konfiguration und Aktualisierung des Projekts auf einem Hostinger VPS (Ubuntu) mit:
	•	Node.js
	•	PM2
	•	Nginx
	•	GitHub Deployment

### Voraussetzungen

VPS Anforderungen
	•	Ubuntu 22.04 oder neuer
	•	Root Zugriff
	•	Domain oder VPS URL

Login:

ssh root@DEINE_SERVER_IP

### System aktualisieren

apt update && apt upgrade -y

### Node.js installieren

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

Test:

node -v
npm -v


### Git installieren

apt install git -y


### PM2 installieren

PM2 startet dein Backend automatisch und hält es am Laufen.

npm install -g pm2

Autostart aktivieren:

pm2 startup
pm2 save


### Nginx installieren

apt install nginx -y

Starten:

systemctl start nginx
systemctl enable nginx

### Projekt installieren

Projekt klonen:

mkdir -p /var/www
cd /var/www

git clone https://github.com/USERNAME/historisches-wald.git

cd historisches-wald

## Backend installieren und starten

cd backend

npm install

pm2 start server.js --name historisches-backend

pm2 save

Status prüfen:

pm2 list

### Frontend builden

cd /var/www/historisches-wald/frontend

npm install

npm run build

Build Output:

/var/www/historisches-wald/frontend/dist

### Nginx konfigurieren

Datei öffnen:

nano /etc/nginx/sites-available/default

Inhalt:

```

server {

    listen 80;

    server_name _;

    root /var/www/historisches-wald/frontend/dist;

    index index.html;

    location / {

        try_files $uri $uri/ /index.html;

    }

    location /api {

        proxy_pass http://localhost:3000;

    }

}
```

Speichern.

Test:

nginx -t

Restart:

systemctl restart nginx

### Website öffnen

Im Browser:

http://DEINE_SERVER_IP

## Update

### Update Script erstellen

Datei:

nano /var/www/historisches-wald/update.sh

Inhalt:
```
#!/bin/bash

echo "Update gestartet"

cd /var/www/historisches-wald

git pull origin main

cd frontend

npm install

npm run build

cd ..

pm2 restart historisches-backend

systemctl reload nginx

echo "Update abgeschlossen"
```

Rechte setzen:

```
chmod 755 /var/www/historisches-wald/update.sh
````

Optional global:

```
ln -s /var/www/historisches-wald/update.sh /usr/local/bin/update-historisches-wald
```

### Update durchführen

Jetzt reicht:

update-historisches-wald

oder:

./update.sh


### Server Status prüfen

Backend:

pm2 list

Nginx:

systemctl status nginx

Frontend testen:

curl http://localhost


### Server neu starten

Backend:

pm2 restart historisches-backend

Nginx:

systemctl restart nginx


### Häufige Probleme

#### Änderungen nicht sichtbar

Frontend neu builden:

```
npm run build
```

Browser Cache löschen:

CTRL + SHIFT + R

#### Backend läuft nicht

pm2 restart historisches-backend

#### Nginx Fehler

nginx -t

Logs:

tail -f /var/log/nginx/error.log


## Projektstruktur

/var/www/historisches-wald

frontend/
backend/
update.sh

## Deployment Workflow

Lokal:

git push

Server:

update-historisches-wald