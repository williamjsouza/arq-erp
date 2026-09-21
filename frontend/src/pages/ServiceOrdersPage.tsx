import React, { useEffect, useState } from 'react';
import { Plus, Wrench, Eye, Printer, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ServiceOrder, Customer, Product } from '../types';

export const ServiceOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form OS
  const [customerId, setCustomerId] = useState('');
  const [equipamento, setEquipamento] = useState('');
  const [problema, setProblema] = useState('');
  const [servicoPrestado, setServicoPrestado] = useState('');
  const [valorServicos, setValorServicos] = useState(0);
  const [items, setItems] = useState<Array<{ productId: string; quantidade: number; valorUnitario: number }>>([]);

  // Status Change Form
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [servicoConcluido, setServicoConcluido] = useState('');

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resOrders, resCustomers, resProducts] = await Promise.all([
        api.get('/service-orders'),
        api.get('/customers'),
        api.get('/products'),
      ]);
      setOrders(resOrders.data.data || []);
      setCustomers(resCustomers.data.data || []);
      setProducts(resProducts.data.data || []);
    } catch (err) {
      toast('Erro ao carregar Ordens de Serviço', 'error');
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
      { productId: products[0].id, quantidade: 1, valorUnitario: products[0].precoVenda },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast('Selecione um cliente', 'warning');
      return;
    }

    try {
      await api.post('/service-orders', {
        customerId,
        equipamento,
        problema,
        servicoPrestado,
        valorServicos: Number(valorServicos),
        items,
      });

      toast('Ordem de Serviço criada com sucesso!', 'success');
      setIsModalOpen(false);
      setEquipamento('');
      setProblema('');
      setServicoPrestado('');
      setValorServicos(0);
      setItems([]);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao criar Ordem de Serviço', 'error');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await api.patch(`/service-orders/${selectedOrder.id}/status`, {
        status: newStatus,
        servicoPrestado: servicoConcluido || undefined,
      });

      toast('Status da OS atualizado com sucesso!', 'success');
      setIsStatusModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao alterar status', 'error');
    }
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const res = await api.get(`/service-orders/${id}`);
      setSelectedOrder(res.data.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast('Erro ao buscar detalhes da OS', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="warning">Aberta</Badge>;
      case 'IN_ANALYSIS':
        return <Badge variant="info">Em Análise</Badge>;
      case 'AWAITING_APPROVAL':
        return <Badge variant="warning">Aguard. Aprovação</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="primary">Em Execução</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Concluída</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Ordens de Serviço (OS)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de serviços técnicos, manutenção, peças aplicadas e garantias
          </p>
        </div>

        <Can permission="service_orders.create">
          <button
            onClick={() => {
              if (customers.length > 0) setCustomerId(customers[0].id);
              setItems([]);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Ordem de Serviço
          </button>
        </Can>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-slate-500">Carregando ordens de serviço...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhuma Ordem de Serviço cadastrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Número</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Equipamento / Objeto</th>
                  <th className="py-3.5 px-4">Data Abertura</th>
                  <th className="py-3.5 px-4">Valor Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                      {order.numero}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{order.customer?.nomeRazao}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {order.equipamento || 'Geral'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(order.dataAbertura).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {Number(order.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetails(order.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Ver OS Completa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <Can permission="service_orders.edit">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setServicoConcluido(order.servicoPrestado || '');
                              setIsStatusModalOpen(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                            title="Alterar Status"
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Status
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

      {/* Modal Nova OS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Ordem de Serviço"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Cliente *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              >
                <option value="">Selecione o cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeRazao}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Equipamento / Marca / Modelo
              </label>
              <input
                type="text"
                value={equipamento}
                onChange={(e) => setEquipamento(e.target.value)}
                placeholder="Ex: Notebook Dell Inspiron 15 / Ar Condicionado LG"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Problema / Reclamação Relatada
            </label>
            <textarea
              rows={2}
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              placeholder="Descreva o defeito apresentado pelo cliente..."
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Serviços Previstos / Escopo
            </label>
            <textarea
              rows={2}
              value={servicoPrestado}
              onChange={(e) => setServicoPrestado(e.target.value)}
              placeholder="Ex: Troca de tela, formatação, higienização..."
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Valor Mão de Obra / Serviços (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorServicos}
                onChange={(e) => setValorServicos(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Peças / Itens aplicados */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Peças / Produtos Utilizados
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold px-2.5 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                + Adicionar Peça
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={it.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    const newItems = [...items];
                    newItems[idx].productId = e.target.value;
                    if (prod) newItems[idx].valorUnitario = prod.precoVenda;
                    setItems(newItems);
                  }}
                  className="flex-1 px-2.5 py-1.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-xs"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (R$ {p.precoVenda.toFixed(2)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={it.quantidade}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].quantidade = parseInt(e.target.value) || 1;
                    setItems(newItems);
                  }}
                  className="w-20 px-2 py-1.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 text-xs"
                  placeholder="Qtd"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="text-rose-500 font-bold text-xs p-1"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-3">
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
              Salvar Ordem de Serviço
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Alterar Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Alterar Status da OS ${selectedOrder?.numero}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Novo Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm font-medium"
            >
              <option value="OPEN">Aberta</option>
              <option value="IN_ANALYSIS">Em Análise / Diagnóstico</option>
              <option value="AWAITING_APPROVAL">Aguardando Aprovação do Cliente</option>
              <option value="IN_PROGRESS">Em Execução / Manutenção</option>
              <option value="COMPLETED">Concluída / Entregue</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Laudo Técnico / Observações de Fechamento
            </label>
            <textarea
              rows={3}
              value={servicoConcluido}
              onChange={(e) => setServicoConcluido(e.target.value)}
              placeholder="Descreva o que foi consertado e orientações ao cliente..."
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700"
            >
              Confirmar Alteração
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes / Impressão OS */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Ordem de Serviço ${selectedOrder?.numero}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 block font-bold">Cliente</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedOrder.customer?.nomeRazao}</span>
                <span className="text-xs text-slate-500 block">{selectedOrder.customer?.celular || selectedOrder.customer?.telefone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">Equipamento</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedOrder.equipamento || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">Status Atual</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">Data de Abertura</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {new Date(selectedOrder.dataAbertura).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Defeito Reclamado</span>
                <p className="text-slate-700 dark:text-slate-200 mt-0.5">{selectedOrder.problema || 'Nenhum informado'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Serviço Realizado / Laudo</span>
                <p className="text-slate-700 dark:text-slate-200 mt-0.5">{selectedOrder.servicoPrestado || 'Ainda em execução'}</p>
              </div>
            </div>

            {/* Peças */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Peças e Insumos</h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2 text-left">Peça / Insumo</th>
                        <th className="p-2 text-right">Qtd</th>
                        <th className="p-2 text-right">Preço Unit.</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedOrder.items.map((it: any) => (
                        <tr key={it.id}>
                          <td className="p-2 font-medium">{it.product?.nome || 'Peça'}</td>
                          <td className="p-2 text-right">{it.quantidade}</td>
                          <td className="p-2 text-right">R$ {Number(it.valorUnitario).toFixed(2)}</td>
                          <td className="p-2 text-right font-bold">R$ {Number(it.valorTotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-extrabold p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-xl">
              <div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-normal">
                  Serviços: R$ {Number(selectedOrder.valorServicos).toFixed(2)} | Peças: R$ {Number(selectedOrder.valorPecas).toFixed(2)}
                </span>
                <span>Valor Total da OS:</span>
              </div>
              <span className="text-xl">R$ {Number(selectedOrder.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir OS
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
