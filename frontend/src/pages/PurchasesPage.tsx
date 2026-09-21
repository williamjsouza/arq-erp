import React, { useEffect, useState } from 'react';
import { Plus, ShoppingCart, CheckCircle, Eye } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Purchase, Supplier, Product } from '../types';

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantidade: number; valorUnitario: number }>>([]);

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPurchases, resSuppliers, resProducts] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products'),
      ]);
      setPurchases(resPurchases.data.data);
      setSuppliers(resSuppliers.data.data);
      setProducts(resProducts.data.data);
    } catch (err) {
      toast('Erro ao carregar dados de compras', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems((prev) => [...prev, { productId: products[0].id, quantidade: 1, valorUnitario: products[0].precoCusto }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast('Adicione ao menos um item no pedido de compra', 'warning');
      return;
    }
    try {
      await api.post('/purchases', {
        supplierId,
        observacoes,
        items,
      });
      toast('Pedido de compra criado com sucesso!', 'success');
      setIsModalOpen(false);
      setItems([]);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao criar pedido de compra', 'error');
    }
  };

  const handleReceive = async (id: string) => {
    if (!confirm('Confirmar recebimento? Isto fará a entrada no estoque e gerará a Conta a Pagar!')) return;
    try {
      await api.post(`/purchases/${id}/receive`);
      toast('Pedido recebido! Estoque e Contas a Pagar atualizados.', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao receber compra', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gestão de Compras</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pedidos de compra, cotações, recebimentos e integração financeira</p>
        </div>

        <Can permission="purchases.create">
          <button
            onClick={() => {
              if (suppliers.length > 0) setSupplierId(suppliers[0].id);
              setItems([]);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/30 flex items-center justify-center space-x-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Pedido de Compra</span>
          </button>
        </Can>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Número</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Data Pedido</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Carregando pedidos de compra...</td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Nenhum pedido de compra cadastrado.</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary-600 dark:text-primary-400">{p.numero}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">{p.supplier?.nomeRazao || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{new Date(p.dataPedido).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">R$ {p.valorTotal.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === 'RECEIVED' ? 'success' : 'warning'}>
                        {p.status === 'RECEIVED' ? 'Recebido' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={async () => {
                            const res = await api.get(`/purchases/${p.id}`);
                            setSelectedPurchase(res.data.data);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {p.status !== 'RECEIVED' && (
                          <Can permission="purchases.approve">
                            <button
                              onClick={() => handleReceive(p.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Receber</span>
                            </button>
                          </Can>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Pedido de Compra" maxWidth="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Selecione o Fornecedor</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.nomeRazao} ({s.cpfCnpj})</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Itens da Compra</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-primary-600 hover:text-primary-500"
              >
                + Adicionar Item
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl">
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].productId = e.target.value;
                      setItems(updated);
                    }}
                    className="flex-1 p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>{prod.nome}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].quantidade = Number(e.target.value);
                      setItems(updated);
                    }}
                    className="w-20 p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                    placeholder="Qtd"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.valorUnitario}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].valorUnitario = Number(e.target.value);
                      setItems(updated);
                    }}
                    className="w-24 p-2 bg-white dark:bg-slate-800 border rounded-lg text-xs"
                    placeholder="Preço R$"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-rose-500 text-xs font-bold px-2"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-md">
              Emitir Pedido de Compra
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Detalhes da Compra ${selectedPurchase?.numero}`}>
        <div className="space-y-4 text-sm">
          <p><strong>Fornecedor:</strong> {selectedPurchase?.supplier?.nomeRazao}</p>
          <p><strong>Data:</strong> {selectedPurchase && new Date(selectedPurchase.dataPedido).toLocaleDateString('pt-BR')}</p>
          <p><strong>Status:</strong> {selectedPurchase?.status}</p>
          <div className="border-t pt-2">
            <p className="font-bold mb-2">Itens:</p>
            {selectedPurchase?.items?.map((it: any) => (
              <div key={it.id} className="flex justify-between py-1 border-b text-xs">
                <span>{it.product?.nome} x {it.quantidade}</span>
                <span>R$ {it.valorTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-right font-black text-lg">Total: R$ {selectedPurchase?.valorTotal.toFixed(2)}</p>
        </div>
      </Modal>
    </div>
  );
};
