#!/bin/bash

set -euo pipefail

APP_DIR="/var/www/historisches-wald"
PM2_APP="historisches-backend"

echo "Stoppe Prozesse für ${APP_DIR}"

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "${PM2_APP}" >/dev/null 2>&1; then
    echo "-> Stoppe PM2-App ${PM2_APP}"
    pm2 stop "${PM2_APP}" >/dev/null
    pm2 delete "${PM2_APP}" >/dev/null
  else
    echo "-> PM2-App ${PM2_APP} läuft nicht."
  fi
else
  echo "-> PM2 ist nicht installiert oder nicht im PATH."
fi

echo "Suche nach verbleibenden Prozessen im ${APP_DIR} ..."
PIDS=$(pgrep -f "${APP_DIR}" || true)

if [ -n "${PIDS}" ]; then
  echo "-> Beende Prozesse: ${PIDS}"
  kill ${PIDS} >/dev/null 2>&1 || true
  sleep 1
  REMAINING=$(pgrep -f "${APP_DIR}" || true)
  if [ -n "${REMAINING}" ]; then
    echo "-> Erzwinge Beendigung für: ${REMAINING}"
    kill -9 ${REMAINING} >/dev/null 2>&1 || true
  fi
else
  echo "-> Keine zusätzlichen Prozesse gefunden."
fi

echo "Alle konfigurierten Prozesse wurden gestoppt."
