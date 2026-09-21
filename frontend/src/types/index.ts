export interface User {
  id: string;
  nome: string;
  email: string;
  username: string;
  telefone?: string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  companyId: string;
  roles: string[];
  permissions: string[];
  lastLogin?: string;
  createdAt?: string;
}

export interface Role {
  id: string;
  nome: string;
  descricao?: string;
  isSystem: boolean;
  rolePermissions?: Array<{ permissionId: string; permission: Permission }>;
}

export interface Permission {
  id: string;
  modulo: string;
  acao: string;
  chave: string;
  descricao?: string;
}

export interface Customer {
  id: string;
  companyId: string;
  tipo: 'PF' | 'PJ';
  nomeRazao: string;
  nomeFantasia?: string;
  cpfCnpj: string;
  rgIe?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  tipo: 'PF' | 'PJ';
  nomeRazao: string;
  nomeFantasia?: string;
  cpfCnpj: string;
  rgIe?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface Product {
  id: string;
  companyId: string;
  codigo?: string;
  sku?: string;
  codigoBarras?: string;
  nome: string;
  descricao?: string;
  categoryId?: string;
  brandId?: string;
  unitId?: string;
  supplierId?: string;
  precoCusto: number;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  estoqueMaximo: number;
  imagemUrl?: string;
  fabricante?: string;
  linkFornecedor?: string;
  peso?: number;
  dimensoes?: string;
  garantiaMeses?: number;
  localizacaoEstoque?: string;
  status: 'ACTIVE' | 'INACTIVE';
  category?: { id: string; nome: string };
  brand?: { id: string; nome: string };
  unit?: { id: string; sigla: string; nome: string };
  supplier?: { id: string; nomeRazao: string };
  createdAt?: string;
}

export interface Service {
  id: string;
  companyId: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  duracaoHoras?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface QuoteItem {
  id?: string;
  quoteId?: string;
  tipo: 'PRODUCT' | 'SERVICE';
  productId?: string;
  serviceId?: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  valorTotal: number;
  product?: { id: string; nome: string; sku?: string; precoVenda?: number };
  service?: { id: string; nome: string; codigo?: string; preco?: number };
}

export interface Quote {
  id: string;
  numero: string;
  companyId: string;
  customerId: string;
  status: 'OPEN' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  validadeDias: number;
  dataValidade?: string;
  valorSubtotal: number;
  valorDesconto: number;
  valorTotal: number;
  formaPagamento?: string;
  observacoes?: string;
  createdAt: string;
  customer?: Customer;
  items?: QuoteItem[];
}

export interface StockMovement {
  id: string;
  productId: string;
  tipo: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantidade: number;
  saldoAnterior: number;
  saldoNovo: number;
  motivo?: string;
  documentoRef?: string;
  createdAt: string;
  product?: { nome: string; sku?: string };
}

export interface AccountPayable {
  id: string;
  supplierId?: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  formaPagamento?: string;
  supplier?: { nomeRazao: string };
}

export interface AccountReceivable {
  id: string;
  customerId?: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataRecebimento?: string;
  status: 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED';
  formaPagamento?: string;
  customer?: { nomeRazao: string };
}

export interface Sale {
  id: string;
  numero: string;
  customerId: string;
  tipo: 'QUOTE' | 'ORDER' | 'SALE';
  status: 'OPEN' | 'APPROVED' | 'BILLED' | 'CANCELLED';
  valorSubtotal: number;
  valorDesconto: number;
  valorTotal: number;
  formaPagamento?: string;
  parcelas: number;
  createdAt: string;
  customer?: { nomeRazao: string; cpfCnpj: string };
  items?: Array<{ id: string; productId: string; quantidade: number; valorUnitario: number; valorTotal: number; product?: { nome: string } }>;
}

export interface Purchase {
  id: string;
  numero: string;
  supplierId: string;
  status: 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  valorTotal: number;
  dataPedido: string;
  dataEntrega?: string;
  supplier?: { nomeRazao: string };
  items?: Array<{ id: string; productId: string; quantidade: number; valorUnitario: number; valorTotal: number; product?: { nome: string } }>;
}

export interface CrmLead {
  id: string;
  stageId: string;
  titulo: string;
  contatoNome: string;
  email?: string;
  telefone?: string;
  valorEstimado: number;
  probabilidade: number;
  status: 'OPEN' | 'WON' | 'LOST';
  customer?: { nomeRazao: string };
}

export interface ServiceOrder {
  id: string;
  numero: string;
  customerId: string;
  equipamento?: string;
  problema?: string;
  servicoPrestado?: string;
  valorServicos: number;
  valorPecas: number;
  valorTotal: number;
  status: 'OPEN' | 'IN_ANALYSIS' | 'AWAITING_APPROVAL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dataAbertura: string;
  customer?: { nomeRazao: string; celular?: string };
  technician?: { nome: string };
}

export interface AuditLog {
  id: string;
  userName?: string;
  modulo: string;
  acao: string;
  registroId?: string;
  valAnterior?: string;
  valNovo?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  local?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'DONE' | 'CANCELLED';
  userId: string;
}

export interface TaskItem {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  dataVencimento?: string;
  createdById: string;
  assignedToId?: string;
  assignedTo?: { id: string; nome: string };
  createdAt?: string;
}

export interface CostCenter {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CrmPipelineStage {
  id: string;
  nome: string;
  ordem: number;
  corHex?: string;
  leads?: CrmLead[];
}

export interface SystemSetting {
  id: string;
  chave: string;
  valor: string;
  descricao?: string;
}

export interface Company {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoEst?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status: string;
}

