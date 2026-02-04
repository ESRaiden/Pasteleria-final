# syntax = docker/dockerfile:1
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"

# --- ETAPA 1: CONSTRUCCIÓN (BUILD) ---
FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3
COPY package-lock.json package.json ./
# Instalamos dependencias
RUN npm ci
COPY . .

# --- ETAPA 2: PRODUCCIÓN FINAL ---
FROM base

# [CRÍTICO] Instalamos las dependencias del sistema que Puppeteer necesita para correr
# Incluimos fuentes (fonts-*) para evitar que el texto salga con cuadros []
RUN apt-get update \
    && apt-get install -y wget gnupg ca-certificates \
    && apt-get install -y \
      fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 libnss3 libx11-xcb1 libxtst6 xdg-utils \
      libgbm1 libdrm2 libxcomposite1 libxcursor1 libxi6 libxrandr2 libxrender1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copiamos la aplicación construida
COPY --from=build /app /app

# Configuración de Puppeteer
# Cache en una ruta accesible
ENV PUPPETEER_CACHE_DIR="/app/.cache"

EXPOSE 3000
CMD [ "node", "server.js" ]