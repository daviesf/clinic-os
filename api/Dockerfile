# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Gera Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build


# ---------- PRODUCTION STAGE ----------
FROM node:20-alpine

WORKDIR /app

# Copia tudo já pronto do builder
COPY --from=builder /app ./

EXPOSE 3000

CMD ["node", "dist/server.js"]