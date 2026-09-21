import React, { useEffect, useState } from 'react';
import { Plus, TrendingUp, CheckCircle, Eye, Printer, ShoppingCart } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Sale, Customer, Product } from '../types';

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [tipo, setTipo] = useState<'QUOTE' | 'ORDER' | 'SALE'>('ORDER');
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [parcelas, setParcelas] = useState(1);
  const [valorDesconto, setValorDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantidade: number; valorUnitario: number; desconto: number }>>([]);

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSales, resCustomers, resProducts] = await Promise.all([
        api.get('/sales'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setSales(resSales.data.data || []);
      setCustomers(resCustomers.data.data || []);
      setProducts(resProducts.data.data || []);
    } catch (err) {
      toast('Erro ao carregar dados de vendas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems((prev) => [
      ...prev,
      { productId: products[0].id, quantidade: 1, valorUnitario: products[0].precoVenda, desconto: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, curr) => acc + curr.quantidade * curr.valorUnitario, 0);
  const totalGeral = Math.max(0, subtotal - valorDesconto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast('Selecione um cliente', 'warning');
      return;
    }
    if (items.length === 0) {
      toast('Adicione ao menos um item ao pedido', 'warning');
      return;
    }

    try {
      await api.post('/sales', {
        customerId,
        tipo,
        formaPagamento,
        parcelas: Number(parcelas),
        valorDesconto: Number(valorDesconto),
        observacoes,
        items,
      });

      toast('Venda/Pedido cadastrado com sucesso!', 'success');
      setIsModalOpen(false);
      setItems([]);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao registrar venda', 'error');
    }
  };

  const handleFinalize = async (id: string) => {
    if (!confirm('Deseja faturar e aprovar esta venda? O estoque será atualizado e o Contas a Receber gerado.')) return;

    try {
      await api.post(`/sales/${id}/finalize`);
      toast('Venda faturada com sucesso!', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao faturar venda', 'error');
    }
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const res = await api.get(`/sales/${id}`);
      setSelectedSale(res.data.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast('Erro ao buscar detalhes da venda', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gestão Comercial & Vendas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Orçamentos, pedidos de vendas, PDV, faturamento e integração com estoque e financeiro
          </p>
        </div>

        <Can permission="sales.create">
          <button
            onClick={() => {
              if (customers.length > 0) setCustomerId(customers[0].id);
              setItems([]);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda / Orçamento
          </button>
        </Can>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-slate-500">Carregando pedidos de venda...</div>
        ) : sales.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Nenhuma venda ou orçamento registrado até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Número</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                      {sale.numero}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sale.tipo === 'QUOTE' ? 'Orçamento' : sale.tipo === 'ORDER' ? 'Pedido' : 'Venda Direta'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{sale.customer?.nomeRazao || 'Consumidor'}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {Number(sale.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          sale.status === 'BILLED'
                            ? 'success'
                            : sale.status === 'APPROVED'
                            ? 'primary'
                            : sale.status === 'CANCELLED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {sale.status === 'BILLED'
                          ? 'Faturado'
                          : sale.status === 'APPROVED'
                          ? 'Aprovado'
                          : sale.status === 'CANCELLED'
                          ? 'Cancelado'
                          : 'Aberto'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetails(sale.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {sale.status !== 'BILLED' && sale.status !== 'CANCELLED' && (
                        <Can permission="sales.approve">
                          <button
                            onClick={() => handleFinalize(sale.id)}
                            className="inline-flex items-center px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                            title="Faturar Venda"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Faturar
                          </button>
                        </Can>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Nova Venda */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Pedido / Venda"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Cliente *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                required
              >
                <option value="">Selecione um cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeRazao} ({c.cpfCnpj})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Tipo do Documento
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              >
                <option value="ORDER">Pedido de Venda</option>
                <option value="QUOTE">Orçamento</option>
                <option value="SALE">Venda Direta (PDV)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              >
                <option value="PIX">PIX</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="DINHEIRO">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Parcelas
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={parcelas}
                onChange={(e) => setParcelas(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Desconto (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorDesconto}
                onChange={(e) => setValorDesconto(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2 text-primary-500" />
                Itens da Venda
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                + Adicionar Item
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhum produto adicionado ainda.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Produto</label>
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const prod = products.find((p) => p.id === e.target.value);
                          const newItems = [...items];
                          newItems[idx].productId = e.target.value;
                          if (prod) newItems[idx].valorUnitario = prod.precoVenda;
                          setItems(newItems);
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} (Estoque: {p.estoqueAtual}) - R$ {p.precoVenda.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Qtd</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].quantidade = parseInt(e.target.value) || 1;
                          setItems(newItems);
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-xs"
                      />
                    </div>

                    <div className="w-28">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Preço Unit.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.valorUnitario}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].valorUnitario = parseFloat(e.target.value) || 0;
                          setItems(newItems);
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-xs"
                      />
                    </div>

                    <div className="w-28 text-right pr-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Subtotal</label>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Totais do Pedido */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-500">Subtotal: R$ {subtotal.toFixed(2)}</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                Total Geral: R$ {totalGeral.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              placeholder="Informações adicionais da entrega ou negociação..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-700"
            >
              Concluir e Salvar Venda
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes da Venda */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Venda / Pedido ${selectedSale?.numero}`}
        maxWidth="max-w-2xl"
      >
        {selectedSale && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block font-bold">Cliente</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedSale.customer?.nomeRazao}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">Documento (CPF/CNPJ)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedSale.customer?.cpfCnpj}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">Status</span>
                <Badge variant={selectedSale.status === 'BILLED' ? 'success' : 'warning'}>
                  {selectedSale.status}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">Forma de Pagamento</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedSale.formaPagamento} ({selectedSale.parcelas}x)</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Itens Faturados</h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2 text-left">Produto</th>
                      <th className="p-2 text-right">Qtd</th>
                      <th className="p-2 text-right">Preço Unit.</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedSale.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-medium">{it.product?.nome || 'Produto'}</td>
                        <td className="p-2 text-right">{it.quantidade}</td>
                        <td className="p-2 text-right">R$ {Number(it.valorUnitario).toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">R$ {Number(it.valorTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center text-base font-extrabold p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-xl">
              <span>Valor Total da Venda:</span>
              <span>R$ {Number(selectedSale.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Pedido
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
