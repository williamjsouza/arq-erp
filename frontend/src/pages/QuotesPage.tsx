import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Printer,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Package,
  Briefcase,
  DollarSign,
  Send,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Quote, QuoteItem, Customer, Product, Service } from '../types';

export const QuotesPage: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [validadeDias, setValidadeDias] = useState(15);
  const [formaPagamento, setFormaPagamento] = useState('PIX à Vista');
  const [valorDescontoGeral, setValorDescontoGeral] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resQuotes, resCustomers, resProducts, resServices] = await Promise.all([
        api.get('/quotes', { params: { search, status: statusFilter } }),
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/products', { params: { limit: 100 } }),
        api.get('/services', { params: { limit: 100 } }),
      ]);

      setQuotes(resQuotes.data.data || []);
      setCustomers(resCustomers.data.data || []);
      setProducts(resProducts.data.data || []);
      setServices(resServices.data.data || []);
    } catch (err) {
      toast('Erro ao carregar dados de orçamentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  // Handlers para adicionar itens
  const handleAddProductItem = () => {
    if (products.length === 0) {
      toast('Nenhum produto cadastrado para adicionar', 'warning');
      return;
    }
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        tipo: 'PRODUCT',
        productId: firstProd.id,
        serviceId: undefined,
        descricao: firstProd.nome,
        quantidade: 1,
        valorUnitario: firstProd.precoVenda,
        desconto: 0,
        valorTotal: firstProd.precoVenda,
      },
    ]);
  };

  const handleAddServiceItem = () => {
    if (services.length === 0) {
      toast('Nenhum serviço cadastrado para adicionar', 'warning');
      return;
    }
    const firstServ = services[0];
    setItems((prev) => [
      ...prev,
      {
        tipo: 'SERVICE',
        productId: undefined,
        serviceId: firstServ.id,
        descricao: firstServ.nome,
        quantidade: 1,
        valorUnitario: firstServ.preco,
        desconto: 0,
        valorTotal: firstServ.preco,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof QuoteItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Se mudou o produto selecionado
      if (field === 'productId') {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          item.descricao = prod.nome;
          item.valorUnitario = prod.precoVenda;
        }
      }

      // Se mudou o serviço selecionado
      if (field === 'serviceId') {
        const serv = services.find((s) => s.id === value);
        if (serv) {
          item.descricao = serv.nome;
          item.valorUnitario = serv.preco;
        }
      }

      const qtd = Number(item.quantidade) || 1;
      const unit = Number(item.valorUnitario) || 0;
      const desc = Number(item.desconto) || 0;
      item.valorTotal = Math.max(0, qtd * unit - desc);

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Cálculos
  const subtotalProdutos = items
    .filter((i) => i.tipo === 'PRODUCT')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  const subtotalServicos = items
    .filter((i) => i.tipo === 'SERVICE')
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  const subtotalTotal = subtotalProdutos + subtotalServicos;
  const valorTotalGeral = Math.max(0, subtotalTotal - Number(valorDescontoGeral || 0));

  const openNewQuoteModal = () => {
    setCustomerId(customers.length > 0 ? customers[0].id : '');
    setValidadeDias(15);
    setFormaPagamento('PIX à Vista');
    setValorDescontoGeral(0);
    setObservacoes('Proposta válida pelo prazo estipulado. Sujeito à disponibilidade de estoque e agenda.');
    setItems([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast('Selecione um cliente para o orçamento', 'warning');
      return;
    }
    if (items.length === 0) {
      toast('Adicione ao menos um produto ou serviço ao orçamento', 'warning');
      return;
    }

    try {
      await api.post('/quotes', {
        customerId,
        validadeDias: Number(validadeDias),
        formaPagamento,
        valorDesconto: Number(valorDescontoGeral),
        observacoes,
        items,
      });

      toast('Orçamento gerado com sucesso!', 'success');
      setIsModalOpen(false);
      setItems([]);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao gerar orçamento', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/quotes/${id}/status`, { status: newStatus });
      toast(`Orçamento atualizado para ${newStatus}`, 'success');
      fetchData();
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote({ ...selectedQuote, status: newStatus as any });
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao atualizar status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este orçamento?')) return;
    try {
      await api.delete(`/quotes/${id}`);
      toast('Orçamento excluído com sucesso', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao excluir orçamento', 'error');
    }
  };

  const handleOpenPreview = async (quote: Quote) => {
    try {
      const res = await api.get(`/quotes/${quote.id}`);
      setSelectedQuote(res.data.data);
      setIsPreviewModalOpen(true);
    } catch (err) {
      toast('Erro ao carregar detalhes do orçamento', 'error');
    }
  };

  // KPIs
  const totalOrcamentos = quotes.length;
  const orcamentosAbertos = quotes.filter((q) => q.status === 'OPEN' || q.status === 'SENT');
  const valorEmAberto = orcamentosAbertos.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const orcamentosAprovados = quotes.filter((q) => q.status === 'APPROVED');
  const valorAprovado = orcamentosAprovados.reduce((acc, curr) => acc + curr.valorTotal, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning">Em Aberto</Badge>;
      case 'SENT':
        return <Badge variant="default">Enviado</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Aprovado</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Recusado</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelado</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Orçamentos & Propostas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Geração de orçamentos integrando produtos e serviços com proposta timbrada para clientes
            </p>
          </div>
        </div>

        <Can permission="sales.create">
          <button
            onClick={openNewQuoteModal}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Orçamento</span>
          </button>
        </Can>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center space-x-4 border-l-4 border-amber-500">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total em Aberto</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
              R$ {valorEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400">{orcamentosAbertos.length} propostas pendentes</span>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Aprovado</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
              R$ {valorAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {orcamentosAprovados.length} orçamentos fechados
            </span>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4 border-l-4 border-primary-500">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volume Total</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalOrcamentos} Orçamentos</p>
            <span className="text-xs text-slate-400">Produtos e serviços orçados</span>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        {/* Search and Status Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por número (ex: ORC-00001) ou nome do cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'OPEN', label: 'Em Aberto' },
              { id: 'SENT', label: 'Enviados' },
              { id: 'APPROVED', label: 'Aprovados' },
              { id: 'REJECTED', label: 'Recusados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Orçamento</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Itens</th>
                <th className="py-3.5 px-4">Validade</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando orçamentos...</span>
                    </div>
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum orçamento encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Clique em "Novo Orçamento" para montar uma proposta.</p>
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  const prodCount = quote.items?.filter((i) => i.tipo === 'PRODUCT').length || 0;
                  const servCount = quote.items?.filter((i) => i.tipo === 'SERVICE').length || 0;

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-primary-600 dark:text-primary-400 block">
                          {quote.numero}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          {quote.customer?.nomeRazao || 'Cliente não identificado'}
                        </span>
                        {quote.customer?.cpfCnpj && (
                          <span className="text-xs text-slate-400">{quote.customer.cpfCnpj}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2 text-xs">
                          {prodCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded">
                              <Package className="w-3 h-3 mr-1" /> {prodCount} prod
                            </span>
                          )}
                          {servCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded">
                              <Briefcase className="w-3 h-3 mr-1" /> {servCount} serv
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {quote.dataValidade ? (
                          <span>Até {new Date(quote.dataValidade).toLocaleDateString('pt-BR')}</span>
                        ) : (
                          <span>{quote.validadeDias} dias</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        R$ {quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(quote.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenPreview(quote)}
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-colors"
                            title="Visualizar Proposta / Imprimir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {quote.status === 'OPEN' && (
                            <button
                              onClick={() => handleUpdateStatus(quote.id, 'APPROVED')}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              title="Aprovar Orçamento"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <Can permission="sales.delete">
                            <button
                              onClick={() => handleDelete(quote.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Excluir Orçamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Criação de Orçamento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gerar Novo Orçamento Comercial"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente e Condições */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Cliente *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="">Selecione um cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeRazao} {c.cpfCnpj ? `(${c.cpfCnpj})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Validade da Proposta</label>
              <select
                value={validadeDias}
                onChange={(e) => setValidadeDias(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value={7}>7 dias corridos</option>
                <option value={15}>15 dias corridos</option>
                <option value={30}>30 dias corridos</option>
                <option value={60}>60 dias corridos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Forma de Pagamento</label>
              <input
                type="text"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                placeholder="Ex: PIX, Boleto 30 dias..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Seção de Itens (Produtos e Serviços) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Itens do Orçamento
                </h4>
                <p className="text-xs text-slate-400">Adicione produtos do estoque e serviços prestados</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAddProductItem}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>+ Produto</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddServiceItem}
                  className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>+ Serviço</span>
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nenhum item adicionado ainda</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Utilize os botões acima para incluir produtos e serviços na proposta comercial.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.tipo === 'PRODUCT'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                        }`}
                      >
                        {item.tipo === 'PRODUCT' ? (
                          <>
                            <Package className="w-3 h-3 mr-1" /> Produto
                          </>
                        ) : (
                          <>
                            <Briefcase className="w-3 h-3 mr-1" /> Serviço
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        title="Remover Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Select Item */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          {item.tipo === 'PRODUCT' ? 'Selecionar Produto' : 'Selecionar Serviço'}
                        </label>
                        {item.tipo === 'PRODUCT' ? (
                          <select
                            value={item.productId || ''}
                            onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} (R$ {p.precoVenda.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={item.serviceId || ''}
                            onChange={(e) => handleUpdateItem(index, 'serviceId', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nome} (R$ {s.preco.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Qtd */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                          {item.tipo === 'SERVICE' ? 'Horas/Qtd' : 'Qtd'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateItem(index, 'quantidade', Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                        />
                      </div>

                      {/* Valor Unit */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Valor Unit (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valorUnitario}
                          onChange={(e) => handleUpdateItem(index, 'valorUnitario', Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {/* Desconto */}
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Desc (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.desconto}
                          onChange={(e) => handleUpdateItem(index, 'desconto', Number(e.target.value))}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>

                      {/* Total Item */}
                      <div className="sm:col-span-2 text-right">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total</label>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          R$ {item.valorTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totais & Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Termos & Observações da Proposta
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal Produtos:</span>
                <span className="font-semibold">R$ {subtotalProdutos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal Serviços:</span>
                <span className="font-semibold">R$ {subtotalServicos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Desconto Geral (R$):</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorDescontoGeral}
                  onChange={(e) => setValorDescontoGeral(Number(e.target.value))}
                  className="w-24 p-1 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-200">TOTAL DA PROPOSTA:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Gerar Orçamento</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Impressão e Visualização da Proposta Timbrada */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Proposta Comercial #${selectedQuote?.numero}`}
        maxWidth="2xl"
      >
        {selectedQuote && (
          <div className="space-y-6">
            {/* Action Bar (No-Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                {getStatusBadge(selectedQuote.status)}
                {selectedQuote.status === 'OPEN' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, 'APPROVED')}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aprovar Orçamento</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>

            {/* Document Body (Pronto para Impressão) */}
            <div id="printable-quote" className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-sm">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">PROPOSTA COMERCIAL</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Orçamento Nº: {selectedQuote.numero}</p>
                  <p className="text-xs text-slate-500">
                    Data de Emissão: {new Date(selectedQuote.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  {selectedQuote.dataValidade && (
                    <p className="text-xs font-semibold text-primary-600">
                      Válido até: {new Date(selectedQuote.dataValidade).toLocaleDateString('pt-BR')} ({selectedQuote.validadeDias} dias)
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <h3 className="font-extrabold text-base text-slate-800">ERP EMPRESARIAL</h3>
                  <p className="text-xs text-slate-500">Soluções Integradas & Serviços</p>
                  <p className="text-xs text-slate-500">contato@empresa.com.br</p>
                </div>
              </div>

              {/* Dados do Cliente */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dados do Cliente</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Cliente: </span>
                    <span>{selectedQuote.customer?.nomeRazao}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">CPF/CNPJ: </span>
                    <span>{selectedQuote.customer?.cpfCnpj || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Telefone/Celular: </span>
                    <span>{selectedQuote.customer?.celular || selectedQuote.customer?.telefone || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">E-mail: </span>
                    <span>{selectedQuote.customer?.email || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discriminação dos Itens</h4>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 uppercase">
                      <th className="py-2 px-2">Tipo</th>
                      <th className="py-2 px-2">Descrição</th>
                      <th className="py-2 px-2 text-center">Qtd</th>
                      <th className="py-2 px-2 text-right">Valor Unit.</th>
                      <th className="py-2 px-2 text-right">Desconto</th>
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuote.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.tipo === 'PRODUCT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {item.tipo === 'PRODUCT' ? 'PRODUTO' : 'SERVIÇO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-slate-800">{item.descricao}</td>
                        <td className="py-2.5 px-2 text-center">{item.quantidade}</td>
                        <td className="py-2.5 px-2 text-right">R$ {item.valorUnitario.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right text-rose-600">
                          {item.desconto > 0 ? `- R$ ${item.desconto.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                          R$ {item.valorTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totais */}
              <div className="flex justify-end pt-3 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>R$ {selectedQuote.valorSubtotal.toFixed(2)}</span>
                  </div>
                  {selectedQuote.valorDesconto > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Desconto Geral:</span>
                      <span>- R$ {selectedQuote.valorDesconto.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>TOTAL GERAL:</span>
                    <span className="text-base text-emerald-600">
                      R$ {selectedQuote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Condições e Observações */}
              <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-800">Condições de Pagamento: </strong>
                  {selectedQuote.formaPagamento || 'A combinar'}
                </p>
                {selectedQuote.observacoes && (
                  <p>
                    <strong className="text-slate-800">Observações: </strong>
                    {selectedQuote.observacoes}
                  </p>
                )}
              </div>

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="text-slate-600 font-semibold">Responsável Comercial</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="text-slate-600 font-semibold">Aceite do Cliente</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
