import React, { useEffect, useState } from 'react';
import { Plus, Calendar, CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Appointment, TaskItem } from '../types';

export const AgendaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'appointments'>('tasks');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);

  // Form Task
  const [taskTitulo, setTaskTitulo] = useState('');
  const [taskDescricao, setTaskDescricao] = useState('');
  const [taskPrioridade, setTaskPrioridade] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskDataVencimento, setTaskDataVencimento] = useState('');

  // Form Appointment
  const [apptTitulo, setApptTitulo] = useState('');
  const [apptDescricao, setApptDescricao] = useState('');
  const [apptDataInicio, setApptDataInicio] = useState('');
  const [apptDataFim, setApptDataFim] = useState('');
  const [apptLocal, setApptLocal] = useState('');

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTasks, resAppts] = await Promise.all([
        api.get('/agenda/tasks'),
        api.get('/agenda/appointments'),
      ]);
      setTasks(resTasks.data.data || []);
      setAppointments(resAppts.data.data || []);
    } catch (err) {
      toast('Erro ao carregar dados da agenda', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitulo) {
      toast('Informe o título da tarefa', 'warning');
      return;
    }

    try {
      await api.post('/agenda/tasks', {
        titulo: taskTitulo,
        descricao: taskDescricao || undefined,
        prioridade: taskPrioridade,
        dataVencimento: taskDataVencimento ? new Date(taskDataVencimento).toISOString() : undefined,
      });

      toast('Tarefa cadastrada com sucesso!', 'success');
      setIsTaskModalOpen(false);
      setTaskTitulo('');
      setTaskDescricao('');
      setTaskDataVencimento('');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao criar tarefa', 'error');
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptTitulo || !apptDataInicio || !apptDataFim) {
      toast('Informe título, início e término do compromisso', 'warning');
      return;
    }

    try {
      await api.post('/agenda/appointments', {
        titulo: apptTitulo,
        descricao: apptDescricao || undefined,
        dataInicio: new Date(apptDataInicio).toISOString(),
        dataFim: new Date(apptDataFim).toISOString(),
        local: apptLocal || undefined,
        status: 'SCHEDULED',
      });

      toast('Compromisso agendado com sucesso!', 'success');
      setIsApptModalOpen(false);
      setApptTitulo('');
      setApptDescricao('');
      setApptDataInicio('');
      setApptDataFim('');
      setApptLocal('');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao agendar compromisso', 'error');
    }
  };

  const handleToggleTaskStatus = async (task: TaskItem) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await api.patch(`/agenda/tasks/${task.id}/status`, { status: nextStatus });
      toast(`Tarefa marcada como ${nextStatus === 'DONE' ? 'Concluída' : 'Pendente'}!`, 'success');
      fetchData();
    } catch (err: any) {
      toast('Erro ao atualizar status da tarefa', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Agenda & Tarefas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerenciamento de atividades, reuniões corporativas e controle de prioridades
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'tasks' ? (
            <Can permission="agenda.create">
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 transition-all text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </button>
            </Can>
          ) : (
            <Can permission="agenda.create">
              <button
                onClick={() => setIsApptModalOpen(true)}
                className="flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 transition-all text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Compromisso
              </button>
            </Can>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-8">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'tasks'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Minhas Tarefas ({tasks.filter((t) => t.status !== 'DONE').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeTab === 'appointments'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Compromissos Agendados ({appointments.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Carregando dados da agenda...</div>
      ) : activeTab === 'tasks' ? (
        <Card>
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Nenhuma tarefa pendente. Parabéns!</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="py-4 flex items-start justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {task.status === 'DONE' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500" />
                      )}
                    </button>
                    <div>
                      <h4
                        className={`text-sm font-bold text-slate-800 dark:text-slate-100 ${
                          task.status === 'DONE' ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.titulo}
                      </h4>
                      {task.descricao && (
                        <p className="text-xs text-slate-500 mt-0.5">{task.descricao}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
                        {task.dataVencimento && (
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Vence em: {new Date(task.dataVencimento).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {task.assignedTo && (
                          <span>Atribuído a: {task.assignedTo.nome}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        task.prioridade === 'URGENT'
                          ? 'danger'
                          : task.prioridade === 'HIGH'
                          ? 'warning'
                          : task.prioridade === 'MEDIUM'
                          ? 'primary'
                          : 'default'
                      }
                    >
                      {task.prioridade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card>
          {appointments.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Nenhum compromisso agendado.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{appt.titulo}</h4>
                    <Badge variant="primary">{appt.status}</Badge>
                  </div>

                  {appt.descricao && (
                    <p className="text-xs text-slate-500">{appt.descricao}</p>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 space-y-1">
                    <p className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
                      {new Date(appt.dataInicio).toLocaleString('pt-BR')} - {new Date(appt.dataFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {appt.local && (
                      <p className="flex items-center text-slate-600 dark:text-slate-300 font-medium">
                        Local: {appt.local}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal Nova Tarefa */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Nova Tarefa"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Título da Tarefa *
            </label>
            <input
              type="text"
              required
              value={taskTitulo}
              onChange={(e) => setTaskTitulo(e.target.value)}
              placeholder="Ex: Enviar proposta comercial para cliente X"
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={taskDescricao}
              onChange={(e) => setTaskDescricao(e.target.value)}
              placeholder="Detalhes ou passos da tarefa..."
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Prioridade
              </label>
              <select
                value={taskPrioridade}
                onChange={(e) => setTaskPrioridade(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Data Vencimento
              </label>
              <input
                type="date"
                value={taskDataVencimento}
                onChange={(e) => setTaskDataVencimento(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-700"
            >
              Salvar Tarefa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Compromisso */}
      <Modal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        title="Novo Compromisso / Reunião"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Título da Reunião / Compromisso *
            </label>
            <input
              type="text"
              required
              value={apptTitulo}
              onChange={(e) => setApptTitulo(e.target.value)}
              placeholder="Ex: Reunião de Alinhamento de Vendas"
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Início *
              </label>
              <input
                type="datetime-local"
                required
                value={apptDataInicio}
                onChange={(e) => setApptDataInicio(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Término *
              </label>
              <input
                type="datetime-local"
                required
                value={apptDataFim}
                onChange={(e) => setApptDataFim(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Local ou Link de Videoconferência
            </label>
            <input
              type="text"
              value={apptLocal}
              onChange={(e) => setApptLocal(e.target.value)}
              placeholder="Ex: Sala de Reuniões 02 / Google Meet"
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Pauta / Observações
            </label>
            <textarea
              rows={2}
              value={apptDescricao}
              onChange={(e) => setApptDescricao(e.target.value)}
              placeholder="Assuntos a serem abordados..."
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsApptModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-700"
            >
              Agendar Compromisso
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
