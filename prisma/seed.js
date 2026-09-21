"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando Seed do ERP Profissional...');
    // 1. Criar Empresa Padrão
    const company = await prisma.company.upsert({
        where: { cnpj: '00.000.000/0001-00' },
        update: {},
        create: {
            razaoSocial: 'Empresa Matriz ERP S.A.',
            nomeFantasia: 'Empresa Principal',
            cnpj: '00.000.000/0001-00',
            email: 'contato@empresa.com.br',
            telefone: '(11) 3000-0000',
            status: 'ACTIVE',
        },
    });
    console.log(`✅ Empresa Padrão criada/verificada: ${company.razaoSocial}`);
    // 2. Módulos e Ações do Sistema
    const modulos = [
        'dashboard',
        'customers',
        'suppliers',
        'products',
        'inventory',
        'purchases',
        'sales',
        'finance',
        'crm',
        'agenda',
        'service_orders',
        'reports',
        'users',
        'roles',
        'settings',
        'audit',
    ];
    const acoes = ['view', 'create', 'edit', 'delete', 'export', 'print', 'approve'];
    // 3. Criar Permissões
    console.log('🔐 Criando lista de permissões...');
    const permissionsList = [];
    for (const modulo of modulos) {
        for (const acao of acoes) {
            const chave = `${modulo}.${acao}`;
            const perm = await prisma.permission.upsert({
                where: { chave },
                update: {},
                create: {
                    modulo,
                    acao,
                    chave,
                    descricao: `Permissão de ${acao.toUpperCase()} no módulo ${modulo.toUpperCase()}`,
                },
            });
            permissionsList.push(perm);
        }
    }
    console.log(`✅ ${permissionsList.length} Permissões garantidas.`);
    // 4. Criar Roles (Perfis de Acesso)
    const rolesData = [
        { nome: 'SUPER_ADMIN', descricao: 'Acesso Irrestrito a todos os recursos', isSystem: true },
        { nome: 'ADMINISTRADOR', descricao: 'Administrador da Empresa', isSystem: true },
        { nome: 'GERENTE', descricao: 'Gestor operacional e comercial', isSystem: false },
        { nome: 'SUPERVISOR', descricao: 'Supervisor de equipes', isSystem: false },
        { nome: 'FINANCEIRO', descricao: 'Gestor Financeiro e Contas', isSystem: false },
        { nome: 'VENDEDOR', descricao: 'Acesso Comercial e CRM', isSystem: false },
        { nome: 'ESTOQUISTA', descricao: 'Controle de Estoque e Compras', isSystem: false },
        { nome: 'OPERADOR', descricao: 'Atendimento e Ordens de Serviço', isSystem: false },
    ];
    for (const roleInfo of rolesData) {
        const role = await prisma.role.upsert({
            where: { nome: roleInfo.nome },
            update: { descricao: roleInfo.descricao },
            create: roleInfo,
        });
        // Associar permissões de acordo com o perfil
        let permsToAssign = permissionsList;
        if (role.nome === 'VENDEDOR') {
            permsToAssign = permissionsList.filter(p => ['dashboard', 'customers', 'sales', 'crm', 'agenda', 'reports'].includes(p.chave.split('.')[0]) &&
                !['delete', 'approve'].includes(p.chave.split('.')[1]));
        }
        else if (role.nome === 'FINANCEIRO') {
            permsToAssign = permissionsList.filter(p => ['dashboard', 'finance', 'customers', 'suppliers', 'reports'].includes(p.chave.split('.')[0]));
        }
        else if (role.nome === 'ESTOQUISTA') {
            permsToAssign = permissionsList.filter(p => ['dashboard', 'products', 'inventory', 'purchases', 'suppliers', 'reports'].includes(p.chave.split('.')[0]));
        }
        for (const p of permsToAssign) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId: role.id, permissionId: p.id },
                },
                update: {},
                create: {
                    roleId: role.id,
                    permissionId: p.id,
                },
            });
        }
    }
    console.log('✅ Perfis e permissões associadas com sucesso.');
    // 5. Criar Usuário Admin Padrão
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456!';
    const passwordHash = await bcryptjs_1.default.hash(adminPassword, 10);
    const superAdminRole = await prisma.role.findUnique({ where: { nome: 'SUPER_ADMIN' } });
    if (superAdminRole) {
        const adminUser = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                companyId: company.id,
            },
            create: {
                nome: 'Administrador Master',
                username: 'admin',
                email: adminEmail,
                passwordHash,
                companyId: company.id,
                status: 'ACTIVE',
            },
        });
        await prisma.userRole.upsert({
            where: {
                userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id },
            },
            update: {},
            create: {
                userId: adminUser.id,
                roleId: superAdminRole.id,
            },
        });
        console.log(`👤 Usuário Administrador garantido: ${adminUser.email}`);
    }
    // 6. Unidades e Estágios do CRM
    const unidades = [
        { sigla: 'UN', nome: 'Unidade' },
        { sigla: 'KG', nome: 'Quilograma' },
        { sigla: 'CX', nome: 'Caixa' },
        { sigla: 'L', nome: 'Litro' },
        { sigla: 'M', nome: 'Metro' },
    ];
    for (const u of unidades) {
        await prisma.unit.upsert({
            where: { sigla: u.sigla },
            update: {},
            create: u,
        });
    }
    const stages = [
        { nome: 'NOVO LEAD', ordem: 1 },
        { nome: 'CONTATO REALIZADO', ordem: 2 },
        { nome: 'NEGOCIAÇÃO', ordem: 3 },
        { nome: 'PROPOSTA ENVIADA', ordem: 4 },
        { nome: 'FECHAMENTO', ordem: 5 },
    ];
    for (const s of stages) {
        const existing = await prisma.crmPipelineStage.findFirst({ where: { nome: s.nome } });
        if (!existing) {
            await prisma.crmPipelineStage.create({ data: s });
        }
    }
    console.log('✅ Seed finalizado com sucesso!');
}
main()
    .catch((e) => {
    console.error('❌ Erro durante a execução do Seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
