import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  User,
  MapPin,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Customer } from '../types';
import axios from 'axios';

// Formatadores auxiliares
export const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
};

export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PF' | 'PJ'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const numeroInputRef = useRef<HTMLInputElement>(null);

  const initialFormData = {
    tipo: 'PJ' as 'PF' | 'PJ',
    nomeRazao: '',
    nomeFantasia: '',
    cpfCnpj: '',
    rgIe: '',
    email: '',
    telefone: '',
    celular: '',
    whatsapp: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    observacoes: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  };

  const [formData, setFormData] = useState(initialFormData);

  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers', { params: { search } });
      setCustomers(res.data.data || []);
    } catch (err) {
      toast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  // Busca de CEP via ViaCEP
  const handleCepLookup = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      setLoadingCep(true);
      const res = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (res.data.erro) {
        toast('CEP não encontrado na base dos Correios', 'warning');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        endereco: res.data.logradouro || prev.endereco,
        bairro: res.data.bairro || prev.bairro,
        cidade: res.data.localidade || prev.cidade,
        estado: res.data.uf || prev.estado,
      }));

      toast('Endereço preenchido automaticamente via CEP!', 'success');

      // Foca no campo número automaticamente para agilidade
      setTimeout(() => {
        numeroInputRef.current?.focus();
      }, 150);
    } catch (err) {
      toast('Erro ao consultar CEP. Preencha o endereço manualmente.', 'warning');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setFormData((prev) => ({ ...prev, cep: formatted }));
    if (formatted.replace(/\D/g, '').length === 8) {
      handleCepLookup(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        await api.put(`/customers/${selectedCustomer.id}`, formData);
        toast('Cliente atualizado com sucesso!', 'success');
      } else {
        await api.post('/customers', formData);
        toast('Cliente cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao salvar cliente', 'error');
    }
  };

  const handleOpenHistory = async (customer: Customer) => {
    try {
      const res = await api.get(`/customers/${customer.id}`);
      setSelectedCustomer(res.data.data);
      setIsHistoryModalOpen(true);
    } catch (err) {
      toast('Erro ao carregar histórico do cliente', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast('Cliente excluído com sucesso', 'success');
      fetchCustomers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao excluir cliente', 'error');
    }
  };

  const openNewModal = (tipo: 'PF' | 'PJ' = 'PJ') => {
    setSelectedCustomer(null);
    setFormData({
      ...initialFormData,
      tipo,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setFormData({
      tipo: c.tipo || 'PJ',
      nomeRazao: c.nomeRazao,
      nomeFantasia: c.nomeFantasia || '',
      cpfCnpj: c.cpfCnpj || '',
      rgIe: c.rgIe || '',
      email: c.email || '',
      telefone: c.telefone || '',
      celular: c.celular || '',
      whatsapp: c.whatsapp || '',
      cep: c.cep || '',
      endereco: c.endereco || '',
      numero: c.numero || '',
      complemento: c.complemento || '',
      bairro: c.bairro || '',
      cidade: c.cidade || '',
      estado: c.estado || 'SP',
      observacoes: c.observacoes || '',
      status: c.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  // Filtragem
  const filteredCustomers = customers.filter((c) => {
    if (typeFilter === 'ALL') return true;
    return c.tipo === typeFilter;
  });

  const pfCount = customers.filter((c) => c.tipo === 'PF').length;
  const pjCount = customers.filter((c) => c.tipo === 'PJ').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Cadastro de Clientes</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gestão com distinção entre Pessoa Física (PF) e Empresas (PJ), preenchimento automático por CEP e histórico
              </p>
            </div>
          </div>
        </div>

        <Can permission="customers.create">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openNewModal('PF')}
              className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all text-sm"
            >
              <User className="w-4 h-4" />
              <span>+ Pessoa Física</span>
            </button>

            <button
              onClick={() => openNewModal('PJ')}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all text-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Empresa (PJ)</span>
            </button>
          </div>
        </Can>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center space-x-4 border-l-4 border-primary-500">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Clientes</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{customers.length}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4 border-l-4 border-blue-500">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pessoas Físicas (PF)</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {pfCount} <span className="text-xs text-slate-400 font-normal">consumidores cadastrados</span>
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center space-x-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresas (PJ)</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {pjCount} <span className="text-xs text-slate-400 font-normal">clientes corporativos</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por Nome, Razão Social, Nome Fantasia ou CPF/CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({customers.length})
            </button>
            <button
              onClick={() => setTypeFilter('PF')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                typeFilter === 'PF'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Pessoa Física ({pfCount})</span>
            </button>
            <button
              onClick={() => setTypeFilter('PJ')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                typeFilter === 'PJ'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Empresas ({pjCount})</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-24">Tipo</th>
                <th className="py-3.5 px-4">Nome / Razão Social</th>
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Contato</th>
                <th className="py-3.5 px-4">Cidade / UF</th>
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
                      <span>Carregando clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Nenhum cliente encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">Cadastre clientes PF ou Empresas utilizando os botões acima.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Tipo Badge */}
                    <td className="py-3.5 px-4">
                      {c.tipo === 'PF' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          <User className="w-3 h-3 mr-1" /> PF
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <Building2 className="w-3 h-3 mr-1" /> PJ
                        </span>
                      )}
                    </td>

                    {/* Nome / Razão */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">{c.nomeRazao}</span>
                        {c.nomeFantasia && (
                          <span className="text-xs text-slate-400">{c.nomeFantasia}</span>
                        )}
                      </div>
                    </td>

                    {/* Documento */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {formatCpfCnpj(c.cpfCnpj)}
                      {c.rgIe && <span className="block text-[10px] text-slate-400">{c.tipo === 'PF' ? 'RG:' : 'IE:'} {c.rgIe}</span>}
                    </td>

                    {/* Contato */}
                    <td className="py-3.5 px-4 text-xs">
                      {c.celular || c.telefone ? (
                        <div className="flex items-center text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{c.celular || c.telefone}</span>
                        </div>
                      ) : null}
                      {c.email ? (
                        <div className="flex items-center text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 mr-1 text-slate-400" />
                          <span className="truncate max-w-[150px]">{c.email}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Endereço */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {c.cidade ? `${c.cidade}/${c.estado || 'SP'}` : '—'}
                      {c.bairro && <span className="block text-[11px] text-slate-400">{c.bairro}</span>}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'default'}>
                        {c.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenHistory(c)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors"
                          title="Ver Histórico"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Can permission="customers.edit">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                            title="Editar Cliente"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Can>
                        <Can permission="customers.delete">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Excluir Cliente"
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

      {/* Modal Cadastro/Edição de Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Editar Cliente' : 'Novo Cadastro de Cliente'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seletor do Tipo (PF vs PJ) */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tipo: 'PJ' })}
              className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                formData.tipo === 'PJ'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Pessoa Jurídica (Empresa / PJ)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, tipo: 'PF' })}
              className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                formData.tipo === 'PF'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Pessoa Física (PF)</span>
            </button>
          </div>

          {/* Dados Pessoais / Empresariais */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  {formData.tipo === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomeRazao}
                  onChange={(e) => setFormData({ ...formData, nomeRazao: e.target.value })}
                  placeholder={formData.tipo === 'PJ' ? 'Ex: Alfa Comércio de Peças Ltda' : 'Ex: João da Silva Santos'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              {formData.tipo === 'PJ' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={formData.nomeFantasia}
                    onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                    placeholder="Ex: Alfa Peças"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  {formData.tipo === 'PJ' ? 'CNPJ *' : 'CPF *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: formatCpfCnpj(e.target.value) })}
                  placeholder={formData.tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  {formData.tipo === 'PJ' ? 'Inscrição Estadual (IE)' : 'RG'}
                </label>
                <input
                  type="text"
                  value={formData.rgIe}
                  onChange={(e) => setFormData({ ...formData, rgIe: e.target.value })}
                  placeholder={formData.tipo === 'PJ' ? 'Ex: 123.456.789.000' : 'Ex: 12.345.678-9'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dados de Contato */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contato & Comunicação</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@exemplo.com.br"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Celular / WhatsApp</label>
                <input
                  type="text"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Telefone Fixo</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  placeholder="(11) 3333-3333"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Endereço com Busca Automática por CEP */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Endereço (Preenchimento Automático via CEP)
                </h4>
              </div>
              {loadingCep && (
                <span className="text-xs text-primary-600 dark:text-primary-400 font-bold flex items-center space-x-1 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Buscando CEP...</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  CEP (digite 8 dígitos)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={handleCepChange}
                    onBlur={() => handleCepLookup(formData.cep)}
                    placeholder="00000-000"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                  {formData.cep.replace(/\D/g, '').length === 8 && !loadingCep && (
                    <button
                      type="button"
                      onClick={() => handleCepLookup(formData.cep)}
                      className="absolute right-2 top-2.5 text-primary-600 hover:text-primary-500 text-xs font-bold"
                      title="Buscar CEP novamente"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Logradouro / Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Avenida, Praça..."
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Número</label>
                <input
                  type="text"
                  ref={numeroInputRef}
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Ex: 120"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Complemento</label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto 42, Bloco B..."
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Bairro</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Bairro"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Cidade</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-center uppercase"
                />
              </div>
            </div>
          </div>

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
              className="px-5 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 rounded-xl shadow-md transition-all"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Histórico do Cliente */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Histórico Completo - ${selectedCustomer?.nomeRazao}`}
        maxWidth="2xl"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Últimas Vendas</h4>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 divide-y divide-slate-200 dark:divide-slate-800">
              {selectedCustomer?.sales?.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhuma venda registrada.</p>
              ) : (
                selectedCustomer?.sales?.map((s: any) => (
                  <div key={s.id} className="py-2 flex justify-between text-xs">
                    <span className="font-bold">{s.numero}</span>
                    <span>R$ {s.valorTotal.toFixed(2)}</span>
                    <Badge variant="success">{s.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contas a Receber</h4>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 divide-y divide-slate-200 dark:divide-slate-800">
              {selectedCustomer?.accountsReceivable?.length === 0 ? (
                <p className="text-xs text-slate-500">Nenhum título a receber registrado.</p>
              ) : (
                selectedCustomer?.accountsReceivable?.map((r: any) => (
                  <div key={r.id} className="py-2 flex justify-between text-xs">
                    <span>{r.descricao}</span>
                    <span className="font-bold">R$ {r.valor.toFixed(2)}</span>
                    <Badge variant={r.status === 'RECEIVED' ? 'success' : 'warning'}>{r.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
