# syntax = docker/dockerfile:1
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"

# --- ETAPA DE CONSTRUCCIÓN ---
FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3
COPY package-lock.json package.json ./
RUN npm ci
COPY . .

# --- ETAPA FINAL (PRODUCCIÓN) ---
FROM base

# [CRÍTICO] Instalar Google Chrome Stable y Fuentes
# Esto garantiza que tengamos un navegador real y funcional en Railway
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

# [CONFIGURACIÓN VITAL]
# 1. Saltamos la descarga de Chromium de Puppeteer (usaremos el Chrome instalado arriba)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# 2. Le decimos a Puppeteer dónde está el Chrome del sistema
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"

EXPOSE 3000
CMD [ "node", "server.js" ]