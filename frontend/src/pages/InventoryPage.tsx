import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Sliders, Layers, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StockMovement, Product } from '../types';

export const InventoryPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    tipo: 'IN',
    quantidade: 1,
    motivo: '',
  });

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resKardex, resProducts, resLow] = await Promise.all([
        api.get('/inventory/kardex'),
        api.get('/products'),
        api.get('/inventory/low-stock'),
      ]);
      setMovements(resKardex.data.data);
      setProducts(resProducts.data.data);
      setLowStock(resLow.data.data);
    } catch (err) {
      toast('Erro ao carregar dados do estoque', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/move', {
        ...formData,
        quantidade: Number(formData.quantidade),
      });
      toast('Movimentação realizada e Kardex atualizado!', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao realizar movimentação', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Controle de Estoque & Kardex</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rastreabilidade de entradas, saídas, ajustes e alertas de reposição</p>
        </div>

        <Can permission="inventory.create">
          <button
            onClick={() => {
              if (products.length > 0) setFormData((prev) => ({ ...prev, productId: products[0].id }));
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/30 flex items-center justify-center space-x-2 transition-all"
          >
            <Layers className="w-5 h-5" />
            <span>Lançar Movimentação</span>
          </button>
        </Can>
      </div>

      {lowStock.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center space-x-3 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="font-bold">Atenção! </span>
            Existem <span className="font-bold">{lowStock.length} produto(s)</span> abaixo do estoque mínimo configurado.
          </div>
        </div>
      )}

      <Card title="Histórico de Movimentações (Kardex)">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Qtd</th>
                <th className="py-3 px-4">Saldo Anterior</th>
                <th className="py-3 px-4">Saldo Novo</th>
                <th className="py-3 px-4">Motivo / Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">Carregando movimentações Kardex...</td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">Nenhuma movimentação registrada.</td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 text-xs text-slate-500">{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{m.product?.nome || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      {m.tipo === 'IN' && <Badge variant="success"><ArrowDownLeft className="w-3 h-3 mr-1" /> Entrada</Badge>}
                      {m.tipo === 'OUT' && <Badge variant="danger"><ArrowUpRight className="w-3 h-3 mr-1" /> Saída</Badge>}
                      {m.tipo === 'ADJUSTMENT' && <Badge variant="warning"><Sliders className="w-3 h-3 mr-1" /> Ajuste</Badge>}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{m.quantidade} UN</td>
                    <td className="py-3.5 px-4 text-slate-500">{m.saldoAnterior} UN</td>
                    <td className="py-3.5 px-4 font-bold text-primary-600 dark:text-primary-400">{m.saldoNovo} UN</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">{m.motivo || m.documentoRef || 'Manual'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Movimentação de Estoque">
        <form onSubmit={handleMove} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Selecione o Produto</label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Atual: {p.estoqueAtual} UN)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Tipo de Operação</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="IN">Entrada (+)</option>
                <option value="OUT">Saída (-)</option>
                <option value="ADJUSTMENT">Ajuste (Definir Saldo Real)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Motivo / Observação</label>
            <input
              type="text"
              placeholder="Ex: Compra com nota, Danificação, Inventário..."
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
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
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
