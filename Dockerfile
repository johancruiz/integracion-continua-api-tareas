
# Etapa 1: Construcción de la aplicación
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Etapa 2: Ejecución de la aplicación
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV PORT=8000

EXPOSE 8000

CMD ["node", "dist/index.js"]
