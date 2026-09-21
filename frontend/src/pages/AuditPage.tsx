import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Search, Filter, Eye, ShieldCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { AuditLog } from '../types';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters
  const [moduloFilter, setModuloFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit', {
        params: {
          modulo: moduloFilter || undefined,
          userName: userFilter || undefined,
        },
      });
      setLogs(res.data.data || []);
    } catch (err) {
      toast('Erro ao carregar trilha de auditoria', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleOpenDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Trilha de Auditoria & Compliance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registro imutável de operações críticas, rastreamento de acessos e histórico de alterações
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="primary" className="py-1 px-3">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Auditoria Ativa (LGPD/SOX)
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white dark:bg-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchLogs();
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={moduloFilter}
              onChange={(e) => setModuloFilter(e.target.value)}
              placeholder="Filtrar por Módulo (ex: VENDAS, ESTOQUE)..."
              className="w-full px-3 py-1.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Filtrar por Usuário..."
              className="w-full px-3 py-1.5 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-xs"
            />
          </div>

          <button
            type="submit"
            className="flex items-center px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Filtrar Registros
          </button>
        </form>
      </Card>

      {/* Logs Table */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-slate-500">Carregando logs de auditoria...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhum evento registrado com os filtros aplicados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">IP de Origem</th>
                  <th className="py-3 px-4 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {log.userName || 'Sistema'}
                    </td>
                    <td className="py-3 px-4 font-bold text-primary-600 dark:text-primary-400">
                      {log.modulo}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ip || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(log)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Ver Carga de Dados"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Detalhes do Log */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalhes do Evento de Auditoria"
        maxWidth="max-w-2xl"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Operador</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedLog.userName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Horário</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {new Date(selectedLog.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Módulo / Ação</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {selectedLog.modulo} &rarr; {selectedLog.acao}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">IP & Navegador</span>
                <span className="font-mono text-slate-600 dark:text-slate-300 truncate block">
                  {selectedLog.ip} - {selectedLog.userAgent}
                </span>
              </div>
            </div>

            {selectedLog.valAnterior && (
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Estado Anterior (Before)
                </span>
                <pre className="p-3 bg-slate-900 text-rose-300 rounded-xl overflow-x-auto font-mono text-[11px]">
                  {selectedLog.valAnterior}
                </pre>
              </div>
            )}

            {selectedLog.valNovo && (
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Novo Estado / Carga Executada (After)
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl overflow-x-auto font-mono text-[11px]">
                  {selectedLog.valNovo}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-xs font-medium"
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
