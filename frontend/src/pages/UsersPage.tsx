import React, { useEffect, useState } from 'react';
import { Plus, UserCheck, Shield, Edit, Trash2, Key } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { User, Role } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'BLOCKED'>('ACTIVE');

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resUsers, resRoles] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
      ]);
      setUsers(resUsers.data.data || []);
      setRoles(resRoles.data.data || []);
    } catch (err) {
      toast('Erro ao carregar dados de usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setNome('');
    setEmail('');
    setUsername('');
    setPassword('');
    setSelectedRoleIds([]);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setSelectedUserId(user.id);
    setNome(user.nome);
    setEmail(user.email);
    setUsername(user.username);
    setPassword('');
    // map roles safely
    const roleNames = (user.roles || []).map((r: any) => (typeof r === 'string' ? r : r?.nome || ''));
    const matchedRoleIds = roles
      .filter((r) => roleNames.includes(r.nome))
      .map((r) => r.id);
    setSelectedRoleIds(matchedRoleIds);
    setStatus(user.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedUserId) {
        await api.put(`/users/${selectedUserId}`, {
          nome,
          email,
          roleIds: selectedRoleIds,
          status,
        });
        toast('Usuário atualizado com sucesso!', 'success');
      } else {
        await api.post('/users', {
          nome,
          email,
          username,
          password,
          roleIds: selectedRoleIds,
        });
        toast('Usuário cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao salvar usuário', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar/excluir este usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast('Usuário removido com sucesso!', 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao excluir usuário', 'error');
    }
  };

  const handleToggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Controle de Usuários</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerenciamento de operadores, acessos corporativos e credenciais
          </p>
        </div>

        <Can permission="users.create">
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </button>
        </Can>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-slate-500">Carregando usuários...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhum usuário cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">Login / Username</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Perfis / Cargos</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-semibold">{u.nome}</td>
                    <td className="py-3 px-4 font-mono text-xs text-primary-600 dark:text-primary-400">
                      {u.username}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r: any, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                          >
                            {typeof r === 'string' ? r : r?.nome || 'Perfil'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {u.status === 'ACTIVE' ? 'Ativo' : u.status === 'BLOCKED' ? 'Bloqueado' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Can permission="users.edit">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Can>

                      <Can permission="users.delete">
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Criar / Editar Usuário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                E-mail Corporativo *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@empresa.com"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Login / Username *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="joaosilva"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Senha Inicial *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          )}

          {isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Status do Usuário
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="BLOCKED">Bloqueado</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
              Perfis de Acesso (RBAC)
            </label>
            <div className="grid grid-cols-2 gap-2 border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40 max-h-40 overflow-y-auto">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(r.id)}
                    onChange={() => handleToggleRole(r.id)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{r.nome}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
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
              Salvar Usuário
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
