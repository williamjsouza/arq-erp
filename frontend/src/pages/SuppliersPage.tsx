import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Supplier } from '../types';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const [formData, setFormData] = useState({
    tipo: 'PJ',
    nomeRazao: '',
    nomeFantasia: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
  });

  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers', { params: { search } });
      setSuppliers(res.data.data);
    } catch (err) {
      toast('Erro ao carregar fornecedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await api.put(`/suppliers/${selectedSupplier.id}`, formData);
        toast('Fornecedor atualizado com sucesso!', 'success');
      } else {
        await api.post('/suppliers', formData);
        toast('Fornecedor cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao salvar fornecedor', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast('Fornecedor excluído', 'success');
      fetchSuppliers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao excluir fornecedor', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Fornecedores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerenciamento de fornecedores e empresas parceiras</p>
        </div>

        <Can permission="suppliers.create">
          <button
            onClick={() => {
              setSelectedSupplier(null);
              setFormData({ tipo: 'PJ', nomeRazao: '', nomeFantasia: '', cpfCnpj: '', email: '', telefone: '' });
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/30 flex items-center justify-center space-x-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Fornecedor</span>
          </button>
        </Can>
      </div>

      <Card>
        <div className="flex items-center mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por Nome, Razão Social, CNPJ ou E-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nome / Razão Social</th>
                <th className="py-3 px-4">CNPJ / CPF</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Telefone</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">Carregando fornecedores...</td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">Nenhum fornecedor cadastrado.</td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{s.nomeRazao}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{s.cpfCnpj}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{s.email || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{s.telefone || 'N/A'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Can permission="suppliers.edit">
                          <button
                            onClick={() => {
                              setSelectedSupplier(s);
                              setFormData({
                                tipo: s.tipo,
                                nomeRazao: s.nomeRazao,
                                nomeFantasia: s.nomeFantasia || '',
                                cpfCnpj: s.cpfCnpj,
                                email: s.email || '',
                                telefone: s.telefone || '',
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Can>
                        <Can permission="suppliers.delete">
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Razão Social / Nome</label>
            <input
              type="text"
              required
              value={formData.nomeRazao}
              onChange={(e) => setFormData({ ...formData, nomeRazao: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">CNPJ / CPF</label>
              <input
                type="text"
                required
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
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
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
