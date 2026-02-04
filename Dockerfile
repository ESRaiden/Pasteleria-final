# syntax = docker/dockerfile:1

# 1. BASE: Usamos Node 20
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Directorio de la app
WORKDIR /app

# Entorno de producción
ENV NODE_ENV="production"

# 2. BUILD: Etapa temporal para instalar dependencias y compilar
FROM base AS build

# Instalar paquetes necesarios para compilar módulos nativos (si los hay)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Instalar módulos de node
COPY package-lock.json package.json ./

# Usamos npm ci para instalación limpia. 
# Si falla, puedes cambiarlo por 'npm install'
RUN npm ci

# Copiar el código de la aplicación
COPY . .

# 3. FINAL: Imagen de producción
FROM base

# [CRÍTICO] Instalar Google Chrome Stable y Fuentes
# Reemplazamos 'chromium' por 'google-chrome-stable' y añadimos fuentes para evitar cuadros [] en el PDF
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copiar la aplicación construida desde la etapa 'build'
COPY --from=build /app /app

# [OPCIONAL] Evitar que Puppeteer descargue su propio Chrome (ahorrar espacio y tiempo)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# [IMPORTANTE] Indicar a Puppeteer dónde está el Chrome real
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"

EXPOSE 3000

CMD [ "node", "server.js" ]