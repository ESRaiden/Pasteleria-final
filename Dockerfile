# syntax = docker/dockerfile:1

# 1. Definir versión de Node
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Directorio de trabajo
WORKDIR /app

# Entorno de producción
ENV NODE_ENV="production"

# --- ETAPA DE CONSTRUCCIÓN (BUILD) ---
FROM base AS build

# Instalar herramientas de compilación básicas
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Instalar dependencias del proyecto
COPY package-lock.json package.json ./
# Usamos 'npm ci' para una instalación limpia y exacta
RUN npm ci

# Copiar el código fuente
COPY . .

# --- ETAPA FINAL (PRODUCCIÓN) ---
FROM base

# [CRÍTICO] Instalar Google Chrome Stable y Fuentes Requeridas
# 1. Descargamos las llaves de seguridad de Google.
# 2. Añadimos el repositorio oficial de Chrome.
# 3. Instalamos google-chrome-stable y fuentes (para evitar cuadros [] en el PDF).
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copiar la aplicación compilada desde la etapa anterior
COPY --from=build /app /app

# Configuración Vital para Puppeteer en la Nube
# 1. Decimos a Puppeteer que NO descargue su propio Chrome (usaremos el que acabamos de instalar)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# 2. Le decimos dónde está el ejecutable exacto de Chrome
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"

# Exponer el puerto
EXPOSE 3000

# Iniciar la aplicación
CMD [ "node", "server.js" ]