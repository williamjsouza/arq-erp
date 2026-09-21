# ==========================================
# Estágio 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar OpenSSL necessário para o engine do Prisma
RUN apk add --no-cache openssl

# Copiar manifests de dependências
COPY backend/package*.json ./backend/
COPY prisma/ ./prisma/

WORKDIR /app/backend
RUN npm ci

# Copiar código fonte do backend
COPY backend/ ./

# Gerar Prisma Client com os novos modelos e compilar TypeScript
RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

# ==========================================
# Estágio 2: Runner de Produção
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/backend

# Instalar apenas dependências de produção
COPY backend/package*.json ./
RUN npm ci --only=production

# Copiar build e Prisma Client gerado
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma /app/prisma

# Criar pastas para persistência de uploads e banco de dados SQLite
RUN mkdir -p uploads/products /app/data

EXPOSE 3000

# Inicialização: Sincroniza schema do banco SQLite persistido e inicia servidor
CMD ["sh", "-c", "npx prisma db push --schema=/app/prisma/schema.prisma && node dist/server.js"]
