import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  AlertTriangle,
  Package,
  Kanban,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/dashboard');
        setMetrics(res.data.data);
      } catch (err) {
        console.error('Erro ao buscar métricas do dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Carregando indicadores empresariais...
      </div>
    );
  }

  const chartData = [
    { name: 'Receita (Mês)', valor: metrics?.financeiro.receitaMes || 0, fill: '#10b981' },
    { name: 'Despesas (Mês)', valor: metrics?.financeiro.despesasMes || 0, fill: '#f43f5e' },
    { name: 'CP Pendentes', valor: metrics?.financeiro.contasPagarPendente || 0, fill: '#f59e0b' },
    { name: 'CR Pendentes', valor: metrics?.financeiro.contasReceberPendente || 0, fill: '#0284c7' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Painel Principal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resumo executivo financeiro, comercial, estoque e CRM</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Receita Mensal</p>
              <h3 className="text-2xl font-extrabold mt-1">
                R$ {metrics?.financeiro.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-red-600 text-white border-none shadow-lg shadow-rose-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider">Despesas Mensais</p>
              <h3 className="text-2xl font-extrabold mt-1">
                R$ {metrics?.financeiro.despesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-sky-500 to-blue-600 text-white border-none shadow-lg shadow-sky-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-sky-100 uppercase tracking-wider">Vendas no Mês</p>
              <h3 className="text-2xl font-extrabold mt-1">
                R$ {metrics?.comercial.vendasMesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-100 uppercase tracking-wider">Estoque Baixo</p>
              <h3 className="text-2xl font-extrabold mt-1">
                {metrics?.estoque.estoqueBaixo} produto(s)
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Secondary Cards & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Desempenho Financeiro Resumido" className="lg:col-span-2">
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Resumo Comercial">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Vendas Hoje</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">{metrics?.comercial.vendasDia}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Ticket Médio</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  R$ {metrics?.comercial.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total de Clientes</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">{metrics?.comercial.totalClientes}</span>
              </div>
            </div>
          </Card>

          <Card title="Resumo Operacional & CRM">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Produtos Ativos</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-100">{metrics?.estoque.totalProdutos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Leads em Negociação</span>
                <span className="text-base font-bold text-sky-600 dark:text-sky-400">{metrics?.crm.leadsAbertos}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
