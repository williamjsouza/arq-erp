import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Briefcase, Clock, DollarSign, Eye, Tag } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Service } from '../types';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    categoria: '',
    preco: 0,
    duracaoHoras: 1,
    descricao: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/services', { params: { search } });
      setServices(res.data.data || []);
    } catch (err) {
      toast('Erro ao carregar serviços', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search]);

  const categories = Array.from(new Set(services.map((s) => s.categoria).filter(Boolean))) as string[];

  const filteredServices = services.filter((s) => {
    if (selectedCategory !== 'ALL' && s.categoria !== selectedCategory) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        preco: Number(formData.preco),
        duracaoHoras: formData.duracaoHoras ? Number(formData.duracaoHoras) : null,
      };

      if (selectedService) {
        await api.put(`/services/${selectedService.id}`, payload);
        toast('Serviço atualizado com sucesso!', 'success');
      } else {
        await api.post('/services', payload);
        toast('Serviço cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      setSelectedService(null);
      fetchServices();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao salvar serviço', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast('Serviço excluído', 'success');
      fetchServices();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao excluir serviço', 'error');
    }
  };

  const openEditModal = (service: Service) => {
    setSelectedService(service);
    setFormData({
      codigo: service.codigo || '',
      nome: service.nome,
      categoria: service.categoria || '',
      preco: service.preco,
      duracaoHoras: service.duracaoHoras || 1,
      descricao: service.descricao || '',
      status: service.status,
    });
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setSelectedService(null);
    setFormData({
      codigo: `SRV-${(services.length + 1).toString().padStart(3, '0')}`,
      nome: '',
      categoria: 'Geral',
      preco: 0,
      duracaoHoras: 1,
      descricao: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  // KPIs
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.status === 'ACTIVE').length;
  const avgPrice = totalServices > 0 ? services.reduce((acc, curr) => acc + curr.preco, 0) / totalServices : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Catálogo de Serviços</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gerenciamento de serviços oferecidos, precificação por hora/tabela e especificações técnicas
              </p>
            </div>
          </div>
        </div>

        <Can permission="services.create">
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-primary-900/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Serviço</span>
          </button>
        </Can>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center space-x-4 border-l-4 border-primary-500">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Serviços</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalServices}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preço Médio</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
              R$ {avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4 border-l-4 border-sky-500">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Serviços Ativos</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {activeServices} <span className="text-sm font-medium text-slate-400">/ {totalServices}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar serviço por nome, código ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Serviço</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Duração</th>
                <th className="py-3.5 px-4">Preço Sugerido</th>
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
                      <span>Carregando serviços...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum serviço encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Clique em "Novo Serviço" para cadastrar seu primeiro item.</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      {service.codigo || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">{service.nome}</span>
                        {service.descricao && (
                          <span className="text-xs text-slate-400 line-clamp-1">{service.descricao}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium">
                        <Tag className="w-3 h-3 mr-1 opacity-60" />
                        {service.categoria || 'Geral'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {service.duracaoHoras ? `${service.duracaoHoras}h` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      R$ {service.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={service.status === 'ACTIVE' ? 'success' : 'default'}>
                        {service.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Can permission="services.edit">
                          <button
                            onClick={() => openEditModal(service)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                            title="Editar Serviço"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Can>
                        <Can permission="services.delete">
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Excluir Serviço"
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

      {/* Modal Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedService ? 'Editar Serviço' : 'Novo Serviço'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Código</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: SRV-001"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Nome do Serviço *</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Consultoria Técnica Especializada"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Categoria</label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Manutenção, Consultoria..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Preço Sugerido (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Duração (Horas)</label>
              <input
                type="number"
                step="0.5"
                value={formData.duracaoHoras}
                onChange={(e) => setFormData({ ...formData, duracaoHoras: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Descrição Detalhada</label>
            <textarea
              rows={3}
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o escopo e o que está incluso neste serviço..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-md transition-all"
            >
              Salvar Serviço
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalhes do Serviço */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Detalhes do Serviço - ${selectedService?.nome}`}
      >
        {selectedService && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Código</span>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">{selectedService.codigo || 'Não informado'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedService.categoria || 'Geral'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duração Estimada</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {selectedService.duracaoHoras ? `${selectedService.duracaoHoras} hora(s)` : 'Sob demanda'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preço Tabela</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  R$ {selectedService.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <Badge variant={selectedService.status === 'ACTIVE' ? 'success' : 'default'}>
                  {selectedService.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>

            {selectedService.descricao && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição / Escopo</h4>
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedService.descricao}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-sm font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
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
