import React, { useEffect, useState } from 'react';
import { Plus, Kanban, DollarSign, CheckCircle, XCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CrmLead, CrmPipelineStage, Customer } from '../types';

export const CrmPage: React.FC = () => {
  const [stages, setStages] = useState<CrmPipelineStage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [stageId, setStageId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valorEstimado, setValorEstimado] = useState(0);
  const [probabilidade, setProbabilidade] = useState(50);
  const [observacoes, setObservacoes] = useState('');

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPipeline, resCustomers] = await Promise.all([
        api.get('/crm/pipeline'),
        api.get('/customers'),
      ]);
      setStages(resPipeline.data.data || []);
      setCustomers(resCustomers.data.data || []);
    } catch (err) {
      toast('Erro ao carregar dados do CRM', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !contatoNome) {
      toast('Preencha os campos obrigatórios', 'warning');
      return;
    }

    try {
      await api.post('/crm/leads', {
        stageId: stageId || (stages[0] ? stages[0].id : undefined),
        customerId: customerId || undefined,
        titulo,
        contatoNome,
        email: email || undefined,
        telefone: telefone || undefined,
        valorEstimado: Number(valorEstimado),
        probabilidade: Number(probabilidade),
        observacoes,
      });

      toast('Lead criado com sucesso!', 'success');
      setIsModalOpen(false);
      setTitulo('');
      setContatoNome('');
      setEmail('');
      setTelefone('');
      setValorEstimado(0);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao criar Lead', 'error');
    }
  };

  const handleMoveStage = async (leadId: string, nextStageId: string) => {
    try {
      await api.patch(`/crm/leads/${leadId}/stage`, { stageId: nextStageId });
      toast('Estágio atualizado!', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao mover estágio', 'error');
    }
  };

  const handleUpdateStatus = async (leadId: string, status: 'WON' | 'LOST') => {
    try {
      await api.patch(`/crm/leads/${leadId}/status`, { status });
      toast(`Lead marcado como ${status === 'WON' ? 'Ganho' : 'Perdido'}!`, 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao atualizar status do lead', 'error');
    }
  };

  // KPIs
  const allLeads = stages.flatMap((s) => s.leads || []);
  const totalLeadsValue = allLeads.reduce((acc, curr) => acc + (curr.valorEstimado || 0), 0);
  const openLeadsCount = allLeads.filter((l) => l.status === 'OPEN').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">CRM & Funil de Vendas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pipeline comercial, oportunidades, negociações e acompanhamento de leads
          </p>
        </div>

        <Can permission="crm.create">
          <button
            onClick={() => {
              if (stages.length > 0) setStageId(stages[0].id);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead / Oportunidade
          </button>
        </Can>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Leads em Negociação</span>
          <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">{openLeadsCount}</p>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Valor Total no Funil</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            R$ {totalLeadsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4 bg-white dark:bg-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Etapas Ativas</span>
          <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-1">{stages.length}</p>
        </Card>
      </div>

      {/* Kanban Pipeline Board */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Carregando funil de oportunidades...</div>
      ) : stages.length === 0 ? (
        <div className="py-12 text-center text-slate-500">Nenhum estágio configurado no pipeline.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {stages.map((stage, stageIndex) => {
            const nextStage = stages[stageIndex + 1];
            const prevStage = stages[stageIndex - 1];
            const stageLeads = stage.leads || [];

            return (
              <div
                key={stage.id}
                className="bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.corHex || '#3b82f6' }}
                    />
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{stage.nome}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Leads in this stage */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                      Nenhum lead nesta etapa
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-shadow space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-snug">
                            {lead.titulo}
                          </h4>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                            R$ {Number(lead.valorEstimado).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 space-y-0.5">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {lead.contatoNome} {lead.customer ? `• ${lead.customer.nomeRazao}` : ''}
                          </p>
                          {lead.telefone && <p>Tel: {lead.telefone}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <div className="flex items-center space-x-1">
                            {lead.status === 'OPEN' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(lead.id, 'WON')}
                                  className="p-1 text-emerald-500 hover:text-emerald-700 transition-colors"
                                  title="Marcar Ganho"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(lead.id, 'LOST')}
                                  className="p-1 text-rose-400 hover:text-rose-600 transition-colors"
                                  title="Marcar Perdido"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <Badge variant={lead.status === 'WON' ? 'success' : 'danger'}>
                                {lead.status === 'WON' ? 'Ganho' : 'Perdido'}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            {prevStage && lead.status === 'OPEN' && (
                              <button
                                onClick={() => handleMoveStage(lead.id, prevStage.id)}
                                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-300"
                                title={`Recuar para ${prevStage.nome}`}
                              >
                                &larr;
                              </button>
                            )}
                            {nextStage && lead.status === 'OPEN' && (
                              <button
                                onClick={() => handleMoveStage(lead.id, nextStage.id)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 text-primary-600 dark:text-primary-400 rounded flex items-center"
                                title={`Avançar para ${nextStage.nome}`}
                              >
                                <span>Avançar</span>
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Lead */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Lead / Oportunidade"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Título da Oportunidade *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Fornecimento de Software / Contrato Anual"
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Nome do Contato *
              </label>
              <input
                type="text"
                required
                value={contatoNome}
                onChange={(e) => setContatoNome(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Cliente Cadastrado (Opcional)
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              >
                <option value="">Nenhum (Novo Prospect)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeRazao}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorEstimado}
                onChange={(e) => setValorEstimado(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Etapa Inicial
              </label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
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
              placeholder="Necessidades do cliente, prazos..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
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
              Criar Oportunidade
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
