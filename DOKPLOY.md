# 🚀 Guia de Deploy no Dokploy - ERP Empresarial

Este projeto está 100% preparado e otimizado para deploy em produção através do **Dokploy** (ou Coolify / Docker Compose).

---

## 🏗️ Arquitetura de Produção no Dokploy

A aplicação utiliza uma stack desacoplada e performática com dois serviços orquestrados via `docker-compose.yml`:

1. **Frontend (`frontend`)**:
   - Compilação estática do React + Vite.
   - Servido por **Nginx Alpine** com compressão Gzip e cache.
   - Proxy reverso transparente para `/api/` e `/uploads/` sem expor a porta do backend publicamente.
   - Roteamento SPA habilitado (`try_files $uri $uri/ /index.html`).

2. **Backend (`backend`)**:
   - Node.js 20 Alpine rodando o Express compilado em TypeScript.
   - OpenSSL integrado para o engine do Prisma.
   - Executa automaticamente `prisma db push` na inicialização para sincronizar o banco.
   - Endpoint de verificação de integridade (*Health Check*) em `/api/health`.

3. **Volumes Persistentes (Essencial para não perder dados)**:
   - `erp_db_data`: Garante que o arquivo SQLite (`database.sqlite`) não seja perdido em restarts ou novos deploys.
   - `erp_uploads_data`: Armazena com segurança todas as imagens enviadas dos produtos.

---

## 📋 Passo a Passo para Deploy no Dokploy

### Método Recomendado: Deploy via Docker Compose

1. No painel do **Dokploy**, crie um novo projeto ou selecione um existente.
2. Clique em **Create Service** e escolha a opção **Compose** (ou crie a partir do seu repositório Git selecionando o tipo *Docker Compose*).
3. Caso conecte diretamente ao repositório Git:
   - **Repository URL**: A URL do seu repositório Git.
   - **Branch**: `main` (ou a branch desejada).
   - **Compose Path**: `./docker-compose.yml`.
4. Caso cole manualmente:
   - Cole o conteúdo do arquivo `docker-compose.yml` da raiz do projeto.

---

## 🔐 Variáveis de Ambiente (Environment)

No Dokploy, na aba **Environment**, você pode configurar ou customizar as seguintes variáveis:

| Variável | Valor Padrão / Recomendado | Descrição |
|---|---|---|
| `NODE_ENV` | `production` | Modo de execução do Node.js |
| `PORT` | `3000` | Porta interna da API |
| `DATABASE_URL` | `file:/app/data/database.sqlite` | Caminho do arquivo SQLite no volume persistente |
| `JWT_SECRET` | *(Gere uma chave segura e aleatória)* | Segredo para assinatura dos tokens JWT |
| `JWT_REFRESH_SECRET` | *(Gere uma chave segura e aleatória)* | Segredo para tokens de atualização |
| `JWT_EXPIRES_IN` | `1d` | Tempo de expiração da sessão (1 dia) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Tempo de expiração do refresh token |

> 💡 **Dica de Segurança**: Gere hashes fortes para `JWT_SECRET` e `JWT_REFRESH_SECRET` antes de colocar em produção real.

---

## 🌐 Configuração de Domínio e SSL (HTTPS)

1. No Dokploy, vá até a aba **Domains** do serviço `frontend` (porta `80`).
2. Adicione o seu domínio ou subdomínio (ex: `erp.suaempresa.com.br`).
3. O Dokploy configurará o Traefik e gerará automaticamente o certificado **SSL gratuito (Let's Encrypt)**.
4. Clique em **Deploy**.

---

## 🩺 Verificação de Saúde e Logs

- **Health Check**: O backend possui monitoramento automático em `http://localhost:3000/api/health`.
- **Logs**: Acompanhe o build e a inicialização na aba **Logs** do Dokploy.
- **Uploads de Imagens**: As imagens enviadas estarão imediatamente acessíveis e persistidas através do volume Docker.
