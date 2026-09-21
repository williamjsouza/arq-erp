import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Package, DollarSign, Filter, Printer, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'sales' | 'inventory' | 'financial'>('sales');
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { toast } = useToast();

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (activeReport === 'sales') {
        const res = await api.get('/reports/sales', { params: { startDate, endDate } });
        setSalesData(res.data.data);
      } else if (activeReport === 'inventory') {
        const res = await api.get('/reports/inventory');
        setInventoryData(res.data.data);
      } else if (activeReport === 'financial') {
        const res = await api.get('/reports/financial', { params: { startDate, endDate } });
        setFinancialData(res.data.data);
      }
    } catch (err) {
      toast('Erro ao carregar dados do relatório', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Central de Relatórios Executivos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inteligência de negócios, DRE, desempenho comercial e inventário
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors shadow"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Filter and Switch bar */}
      <Card className="p-4 bg-white dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveReport('sales')}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReport === 'sales'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Relatório Comercial
            </button>
            <button
              onClick={() => setActiveReport('inventory')}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReport === 'inventory'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Package className="w-3.5 h-3.5 mr-1.5" />
              Relatório de Estoque
            </button>
            <button
              onClick={() => setActiveReport('financial')}
              className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeReport === 'financial'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 mr-1.5" />
              DRE & Financeiro
            </button>
          </div>

          {activeReport !== 'inventory' && (
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-xs"
              />
              <span className="text-xs text-slate-400">até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 border rounded-lg dark:bg-slate-800 dark:border-slate-700 text-xs"
              />
              <button
                onClick={fetchReport}
                className="p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs"
                title="Filtrar"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Report Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">Gerando relatório detalhado...</div>
      ) : activeReport === 'sales' && salesData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-emerald-500 text-white border-none">
              <span className="text-xs uppercase font-bold text-emerald-100">Faturamento Total</span>
              <p className="text-2xl font-extrabold mt-1">
                R$ {Number(salesData.totalFaturado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className="p-4 bg-sky-500 text-white border-none">
              <span className="text-xs uppercase font-bold text-sky-100">Pedidos Faturados</span>
              <p className="text-2xl font-extrabold mt-1">{salesData.quantidadeVendas || 0}</p>
            </Card>
            <Card className="p-4 bg-primary-600 text-white border-none">
              <span className="text-xs uppercase font-bold text-primary-100">Ticket Médio</span>
              <p className="text-2xl font-extrabold mt-1">
                R$ {Number(salesData.ticketMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
          </div>

          <Card title="Top Produtos Vendidos">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4 text-right">Qtd Vendida</th>
                    <th className="py-3 px-4 text-right">Faturamento Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {salesData.topProdutos?.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold">{p.nome}</td>
                      <td className="py-3 px-4 text-right font-medium">{p.quantidade}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {Number(p.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : activeReport === 'inventory' && inventoryData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white dark:bg-slate-800">
              <span className="text-xs uppercase font-bold text-slate-400">Valor em Custo de Estoque</span>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                R$ {Number(inventoryData.valorEstoqueCusto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className="p-4 bg-white dark:bg-slate-800">
              <span className="text-xs uppercase font-bold text-slate-400">Potencial de Venda</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                R$ {Number(inventoryData.valorEstoqueVenda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
            <Card className="p-4 bg-white dark:bg-slate-800">
              <span className="text-xs uppercase font-bold text-slate-400">Itens com Estoque Baixo</span>
              <p className="text-2xl font-extrabold text-amber-500 mt-1">
                {inventoryData.produtosEstoqueBaixo?.length || 0} produto(s)
              </p>
            </Card>
          </div>

          <Card title="Produtos Abaixo do Estoque Mínimo">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4 text-right">Estoque Atual</th>
                    <th className="py-3 px-4 text-right">Estoque Mínimo</th>
                    <th className="py-3 px-4 text-right">Déficit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inventoryData.produtosEstoqueBaixo?.map((p: any) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">{p.nome}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">{p.estoqueAtual}</td>
                      <td className="py-3 px-4 text-right text-slate-500">{p.estoqueMinimo}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-500">
                        {p.estoqueMinimo - p.estoqueAtual}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : activeReport === 'financial' && financialData ? (
        <div className="space-y-6">
          <Card title="Demonstrativo de Resultado do Exercício (DRE Sintético)">
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-200">(+) Receita Bruta Realizada</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  R$ {Number(financialData.receita || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold">
                <span className="text-slate-700 dark:text-slate-200">(-) Despesas Pagas / Custos</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  R$ {Number(financialData.despesas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 bg-slate-100 dark:bg-slate-800/80 px-4 rounded-xl text-base font-extrabold">
                <span className="text-slate-800 dark:text-slate-100">(=) Resultado Líquido / Lucro</span>
                <span
                  className={
                    financialData.lucroLiquido >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  R$ {Number(financialData.lucroLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500">Nenhum dado encontrado para o período selecionado.</div>
      )}
    </div>
  );
};
