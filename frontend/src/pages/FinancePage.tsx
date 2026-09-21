import React, { useEffect, useState } from 'react';
import { Plus, DollarSign, TrendingDown, TrendingUp, CheckCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { AccountPayable, AccountReceivable, Supplier, Customer } from '../types';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payable' | 'receivable' | 'cashflow'>('receivable');
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);

  // Form Payable
  const [payableSupplierId, setPayableSupplierId] = useState('');
  const [payableDesc, setPayableDesc] = useState('');
  const [payableValor, setPayableValor] = useState(0);
  const [payableVencimento, setPayableVencimento] = useState('');
  const [payableForma, setPayableForma] = useState('BOLETO');

  // Form Receivable
  const [receivableCustomerId, setReceivableCustomerId] = useState('');
  const [receivableDesc, setReceivableDesc] = useState('');
  const [receivableValor, setReceivableValor] = useState(0);
  const [receivableVencimento, setReceivableVencimento] = useState('');
  const [receivableForma, setReceivableForma] = useState('PIX');

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPay, resRec, resFlow, resSuppliers, resCustomers] = await Promise.all([
        api.get('/finance/payable'),
        api.get('/finance/receivable'),
        api.get('/finance/cash-flow'),
        api.get('/suppliers'),
        api.get('/customers'),
      ]);
      setPayables(resPay.data.data || []);
      setReceivables(resRec.data.data || []);
      setCashFlowData(resFlow.data.data || null);
      setSuppliers(resSuppliers.data.data || []);
      setCustomers(resCustomers.data.data || []);
    } catch (err) {
      toast('Erro ao carregar dados financeiros', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/payable', {
        supplierId: payableSupplierId || undefined,
        descricao: payableDesc,
        valor: Number(payableValor),
        dataVencimento: new Date(payableVencimento).toISOString(),
        formaPagamento: payableForma,
      });

      toast('Conta a pagar cadastrada!', 'success');
      setIsPayableModalOpen(false);
      setPayableDesc('');
      setPayableValor(0);
      setPayableVencimento('');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao criar conta a pagar', 'error');
    }
  };

  const handleCreateReceivable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/receivable', {
        customerId: receivableCustomerId || undefined,
        descricao: receivableDesc,
        valor: Number(receivableValor),
        dataVencimento: new Date(receivableVencimento).toISOString(),
        formaPagamento: receivableForma,
      });

      toast('Conta a receber cadastrada!', 'success');
      setIsReceivableModalOpen(false);
      setReceivableDesc('');
      setReceivableValor(0);
      setReceivableVencimento('');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao criar conta a receber', 'error');
    }
  };

  const handlePay = async (id: string) => {
    if (!confirm('Confirmar liquidação / pagamento desta conta?')) return;
    try {
      await api.post(`/finance/payable/${id}/pay`, { formaPagamento: 'PIX' });
      toast('Conta marcada como PAGA!', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao liquidar conta', 'error');
    }
  };

  const handleReceive = async (id: string) => {
    if (!confirm('Confirmar recebimento deste valor?')) return;
    try {
      await api.post(`/finance/receivable/${id}/receive`, { formaPagamento: 'PIX' });
      toast('Conta marcada como RECEBIDA!', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao baixar recebimento', 'error');
    }
  };

  // KPIs
  const totalReceberPendente = receivables
    .filter((r) => r.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalPagarPendente = payables
    .filter((p) => p.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gestão Financeira & Caixa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Contas a Pagar, Contas a Receber, Liquidações, Centros de Custo e Fluxo de Caixa
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'payable' && (
            <Can permission="finance.create">
              <button
                onClick={() => setIsPayableModalOpen(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-lg shadow-rose-600/30 transition-all text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta a Pagar
              </button>
            </Can>
          )}

          {activeTab === 'receivable' && (
            <Can permission="finance.create">
              <button
                onClick={() => setIsReceivableModalOpen(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/30 transition-all text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta a Receber
              </button>
            </Can>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">A Receber (Pendente)</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                R$ {totalReceberPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">A Pagar (Pendente)</span>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                R$ {totalPagarPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-50 dark:bg-primary-950/60 rounded-xl text-primary-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Saldo Previsto</span>
              <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">
                R$ {(totalReceberPendente - totalPagarPendente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'receivable'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Contas a Receber ({receivables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payable')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'payable'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Contas a Pagar ({payables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cashflow')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'cashflow'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Fluxo de Caixa Realizado</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Carregando lançamentos...</div>
      ) : activeTab === 'receivable' ? (
        <Card>
          {receivables.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Nenhuma conta a receber cadastrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {receivables.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-medium">{r.descricao}</td>
                      <td className="py-3 px-4 text-slate-500">{r.customer?.nomeRazao || 'Consumidor'}</td>
                      <td className="py-3 px-4">{new Date(r.dataVencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {Number(r.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={r.status === 'RECEIVED' ? 'success' : 'warning'}>
                          {r.status === 'RECEIVED' ? 'Recebido' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === 'PENDING' && (
                          <Can permission="finance.approve">
                            <button
                              onClick={() => handleReceive(r.id)}
                              className="inline-flex items-center px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Baixar
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
      ) : activeTab === 'payable' ? (
        <Card>
          {payables.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Nenhuma conta a pagar cadastrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Fornecedor</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {payables.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-medium">{p.descricao}</td>
                      <td className="py-3 px-4 text-slate-500">{p.supplier?.nomeRazao || 'Despesa Geral'}</td>
                      <td className="py-3 px-4">{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                        R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>
                          {p.status === 'PAID' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'PENDING' && (
                          <Can permission="finance.approve">
                            <button
                              onClick={() => handlePay(p.id)}
                              className="inline-flex items-center px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Pagar
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Entradas Realizadas">
            <div className="space-y-3">
              {cashFlowData?.entradas && cashFlowData.entradas.length > 0 ? (
                cashFlowData.entradas.map((e: any) => (
                  <div key={e.id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div>
                      <p className="font-semibold text-sm">{e.descricao}</p>
                      <span className="text-xs text-slate-400">{new Date(e.dataRecebimento).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      + R$ {Number(e.valor).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhuma entrada no período.</p>
              )}
            </div>
          </Card>

          <Card title="Saídas Realizadas">
            <div className="space-y-3">
              {cashFlowData?.saidas && cashFlowData.saidas.length > 0 ? (
                cashFlowData.saidas.map((s: any) => (
                  <div key={s.id} className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div>
                      <p className="font-semibold text-sm">{s.descricao}</p>
                      <span className="text-xs text-slate-400">{new Date(s.dataPagamento).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      - R$ {Number(s.valor).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhuma saída no período.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal Nova Conta a Pagar */}
      <Modal
        isOpen={isPayableModalOpen}
        onClose={() => setIsPayableModalOpen(false)}
        title="Nova Conta a Pagar"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreatePayable} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              value={payableDesc}
              onChange={(e) => setPayableDesc(e.target.value)}
              placeholder="Ex: Aluguel do Galpão, Conta de Luz"
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Fornecedor / Favorecido (Opcional)
            </label>
            <select
              value={payableSupplierId}
              onChange={(e) => setPayableSupplierId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            >
              <option value="">Geral / Sem Fornecedor</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nomeRazao}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={payableValor}
                onChange={(e) => setPayableValor(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Vencimento *
              </label>
              <input
                type="date"
                required
                value={payableVencimento}
                onChange={(e) => setPayableVencimento(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPayableModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-rose-700"
            >
              Salvar Conta a Pagar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nova Conta a Receber */}
      <Modal
        isOpen={isReceivableModalOpen}
        onClose={() => setIsReceivableModalOpen(false)}
        title="Nova Conta a Receber"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateReceivable} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Descrição da Receita *
            </label>
            <input
              type="text"
              required
              value={receivableDesc}
              onChange={(e) => setReceivableDesc(e.target.value)}
              placeholder="Ex: Consultoria Prestada, Venda Avulsa"
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Cliente (Opcional)
            </label>
            <select
              value={receivableCustomerId}
              onChange={(e) => setReceivableCustomerId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            >
              <option value="">Consumidor Geral</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeRazao}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={receivableValor}
                onChange={(e) => setReceivableValor(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Vencimento *
              </label>
              <input
                type="date"
                required
                value={receivableVencimento}
                onChange={(e) => setReceivableVencimento(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsReceivableModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700"
            >
              Salvar Conta a Receber
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
