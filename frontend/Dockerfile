# Estágio 1: Build do Frontend com Vite
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependências
COPY frontend/package*.json ./
RUN npm ci

# Copiar código fonte e gerar build estático
COPY frontend/ ./
RUN npm run build

# Estágio 2: Servidor Web Nginx
FROM nginx:alpine

# Copiar arquivo de configuração do Nginx otimizado para SPA
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos estáticos compilados do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
