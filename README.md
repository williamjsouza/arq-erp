# 💼 ERP Master - Sistema de Gestão Empresarial Completo

Sistema ERP empresarial moderno, modular, seguro e de alta performance desenvolvido para pequenas e médias empresas. Inclui gestão completa de produtos, serviços, orçamentos, vendas, ordens de serviço, finanças, CRM, agenda, controle de estoque e auditoria detalhada.

Preparado para execução local ou deploy imediato em produção via **Docker** e **Dokploy**.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18** com **TypeScript**
- **Vite** para build ultrarrápido
- **Tailwind CSS** para estilização moderna e responsiva
- **Lucide React** para ícones consistentes
- **Axios** para integração com API REST
- Context API para autenticação, tema e notificações

### Backend
- **Node.js** com **Express** e **TypeScript**
- **Prisma ORM** com banco de dados SQLite (compatível com PostgreSQL / MySQL)
- **JWT** (JSON Web Tokens) com suporte a Refresh Tokens
- **RBAC** (Role-Based Access Control) para controle granular de permissões
- **Multer** para upload e armazenamento de imagens de produtos
- **Logger** estruturado e middleware de auditoria de ações

### Infraestrutura & Deploy
- **Docker** & **Docker Compose**
- **Nginx Alpine** como servidor web de borda e proxy reverso para a API
- Otimizado para **Dokploy** e **Coolify** com volumes persistentes

---

## 📦 Funcionalidades e Módulos

- 📊 **Dashboard Executivo**: Métricas em tempo real de vendas, faturamento, ticket médio e gráficos de desempenho.
- 📦 **Gestão de Produtos**: Cadastro com imagens, controle de estoque mínimo/máximo, categorias, marcas, código de barras e precificação.
- 🛠️ **Gestão de Serviços**: Tabela de serviços, valores hora/fixo e integração com ordens de serviço.
- 📑 **Orçamentos Comerciais**: Emissão de orçamentos completos com itens, descontos, condições de pagamento, validade e impressão.
- 🛒 **Vendas & Pedidos**: Gestão de pedidos de venda com baixa automática no estoque e integração financeira.
- 🔧 **Ordens de Serviço (OS)**: Acompanhamento de status, técnicos responsáveis, peças utilizadas e mão de obra.
- 💰 **Módulo Financeiro**:
  - Contas a Pagar e a Receber
  - Controle de status (Pendente, Pago, Atrasado, Cancelado)
  - Resumo de fluxo de caixa e conciliação
- 👥 **CRM & Oportunidades**: Funil de vendas, etapas de negociação e histórico de interações.
- 📅 **Agenda Corporativa**: Agendamento de compromissos, visitas técnicas e prazos com visualização em calendário.
- 🏢 **Cadastros Gerais**: Clientes (PF/PJ), Fornecedores, Transportadoras.
- 🔐 **Segurança & Permissões**:
  - Cadastro de usuários com senhas criptografadas (bcrypt)
  - Perfis de acesso configuráveis (Admin, Gerente, Vendedor, Financeiro, etc.)
  - Registro de auditoria com IP, data/hora e ação realizada
- 💾 **Backup & Configurações**: Dados cadastrais da empresa, logotipo e rotina de backup.

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **NPM** instalado

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/williamjsouza/arq-erp.git
cd arq-erp
```

2. Instale as dependências:
```bash
npm run setup
```

3. Configure as variáveis de ambiente:
Crie o arquivo `backend/.env` baseado no `backend/.env.example`:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="seu_jwt_secret_super_seguro"
JWT_REFRESH_SECRET="seu_jwt_refresh_secret_super_seguro"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

4. Inicialize o banco de dados e dados padrão:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Inicie a aplicação (Backend + Frontend):
```bash
npm run dev
```

Acesse:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000/api](http://localhost:3000/api)
- **Credenciais padrão de teste**: `admin@empresa.com.br` / `admin123`

---

## 🐳 Deploy em Produção (Dokploy / Docker)

Para instruções detalhadas de deploy com Docker Compose no Dokploy, consulte o guia [DOKPLOY.md](DOKPLOY.md).

```bash
docker compose up -d --build
```

---

## 📄 Licença

Este projeto é de uso privado e corporativo. Todos os direitos reservados.
