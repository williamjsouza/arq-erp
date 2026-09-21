import React, { useEffect, useState } from 'react';
import { Settings, Building, Database, Download, ShieldCheck, Save, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'backup'>('company');
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<any[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Company Form
  const [company, setCompany] = useState<any>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEst: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  });

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCompany, resBackups] = await Promise.all([
        api.get('/companies/current'),
        api.get('/settings/backups'),
      ]);
      if (resCompany.data && resCompany.data.data) {
        setCompany(resCompany.data.data);
      }
      setBackups(resBackups.data.data || []);
    } catch (err: any) {
      toast('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/companies/current', company);
      if (res.data && res.data.data) {
        setCompany(res.data.data);
      }
      toast('Dados da empresa atualizados com sucesso!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao salvar dados da empresa', 'error');
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.post('/settings/backups');
      toast(res.data.message || 'Backup gerado com sucesso!', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao gerar backup', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Configurações do Sistema</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dados cadastrais da empresa emissora, parâmetros fiscais e backups do banco
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'company'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Dados da Empresa</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'backup'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Restauração</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Carregando configurações...</div>
      ) : activeTab === 'company' ? (
        <Card>
          <form onSubmit={handleSaveCompany} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={company.razaoSocial || ''}
                  onChange={(e) => setCompany({ ...company, razaoSocial: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={company.nomeFantasia || ''}
                  onChange={(e) => setCompany({ ...company, nomeFantasia: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  required
                  value={company.cnpj || ''}
                  onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={company.inscricaoEst || ''}
                  onChange={(e) => setCompany({ ...company, inscricaoEst: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  E-mail Oficial
                </label>
                <input
                  type="email"
                  value={company.email || ''}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Telefone Corporativo
                </label>
                <input
                  type="text"
                  value={company.telefone || ''}
                  onChange={(e) => setCompany({ ...company, telefone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">Endereço da Sede</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={company.cep || ''}
                    onChange={(e) => setCompany({ ...company, cep: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Logradouro / Endereço
                  </label>
                  <input
                    type="text"
                    value={company.endereco || ''}
                    onChange={(e) => setCompany({ ...company, endereco: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={company.numero || ''}
                    onChange={(e) => setCompany({ ...company, numero: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={company.bairro || ''}
                    onChange={(e) => setCompany({ ...company, bairro: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Cidade / UF
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={company.cidade || ''}
                      onChange={(e) => setCompany({ ...company, cidade: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="UF"
                      maxLength={2}
                      value={company.estado || ''}
                      onChange={(e) => setCompany({ ...company, estado: e.target.value })}
                      className="w-16 px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm uppercase text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Can permission="settings.edit">
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="flex items-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-600/30 transition-all"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados Cadastrais
                </button>
              </div>
            </Can>
          </form>
        </Card>
      ) : (
        <div className="space-y-6 max-w-4xl">
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Cópias de Segurança (Backup)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gera uma cópia completa do banco de dados SQLite com carimbo de data/hora
                </p>
              </div>

              <Can permission="settings.create">
                <button
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60 shadow"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isBackingUp ? 'animate-spin' : ''}`} />
                  {isBackingUp ? 'Gerando Cópia...' : 'Gerar Novo Backup'}
                </button>
              </Can>
            </div>
          </Card>

          <Card title="Histórico de Backups Disponíveis">
            {backups.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhum backup localizado na pasta de dados.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {backups.map((b: any, i: number) => {
                  const name = typeof b === 'string' ? b : b?.name || 'backup.db';
                  const size = typeof b === 'object' && b?.size ? `${(b.size / 1024).toFixed(1)} KB` : '';
                  const date = typeof b === 'object' && b?.createdAt ? new Date(b.createdAt).toLocaleString('pt-BR') : '';

                  return (
                    <div key={i} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Database className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <div>
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                            {name}
                          </span>
                          {(size || date) && (
                            <span className="text-[10px] text-slate-400">
                              {date} {size ? `• ${size}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                        Disponível
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
