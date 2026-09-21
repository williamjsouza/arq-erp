import React, { useEffect, useState } from 'react';
import { Plus, ShieldCheck, Edit, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Can } from '../components/auth/Can';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Role, Permission } from '../types';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRoles, resPermissions] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions'),
      ]);
      setRoles(resRoles.data.data || []);
      setPermissions(resPermissions.data.data || []);
    } catch (err) {
      toast('Erro ao carregar perfis e permissões', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setSelectedRoleId(null);
    setNome('');
    setDescricao('');
    setSelectedPermissionIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setIsEditing(true);
    setSelectedRoleId(role.id);
    setNome(role.nome);
    setDescricao(role.descricao || '');
    const currentPermissionIds = (role.rolePermissions || []).map((rp) => rp.permissionId);
    setSelectedPermissionIds(currentPermissionIds);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (id: string) => {
    if (selectedPermissionIds.includes(id)) {
      setSelectedPermissionIds(selectedPermissionIds.filter((pId) => pId !== id));
    } else {
      setSelectedPermissionIds([...selectedPermissionIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      toast('Nome do perfil é obrigatório', 'warning');
      return;
    }

    try {
      if (isEditing && selectedRoleId) {
        await api.put(`/roles/${selectedRoleId}`, {
          nome,
          descricao,
          permissionIds: selectedPermissionIds,
        });
        toast('Perfil atualizado com sucesso!', 'success');
      } else {
        await api.post('/roles', {
          nome,
          descricao,
          permissionIds: selectedPermissionIds,
        });
        toast('Perfil criado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Erro ao salvar perfil', 'error');
    }
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc: Record<string, Permission[]>, curr) => {
    if (!acc[curr.modulo]) acc[curr.modulo] = [];
    acc[curr.modulo].push(curr);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Perfis & Permissões (RBAC)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de acesso granular por módulo, perfis de cargos e segurança
          </p>
        </div>

        <Can permission="roles.create">
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Perfil
          </button>
        </Can>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">Carregando perfis...</div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{role.nome}</h3>
                  </div>
                  {role.isSystem && (
                    <Badge variant="warning" className="flex items-center text-[10px]">
                      <Lock className="w-3 h-3 mr-1" /> Sistema
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-500 min-h-[32px]">
                  {role.descricao || 'Sem descrição cadastrada.'}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Permissões Atribuídas
                  </span>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {role.rolePermissions?.length || 0} permissões ativas
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-end">
                <Can permission="roles.edit">
                  <button
                    onClick={() => handleOpenEdit(role)}
                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/40 rounded-lg transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" />
                    Editar Permissões
                  </button>
                </Can>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Criar / Editar Perfil */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Editar Perfil & Permissões' : 'Novo Perfil de Acesso'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Nome do Perfil *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: VENDEDOR, GERENTE, FINANCEIRO"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Descrição do Perfil
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Responsável por orçamentos e vendas"
                className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
              Selecione as Permissões Autorizadas
            </label>
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 max-h-80 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-800/40">
              {Object.keys(permissionsByModule).map((moduleName) => (
                <div key={moduleName} className="space-y-2">
                  <h4 className="text-xs font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-wider border-b pb-1 border-slate-200 dark:border-slate-700">
                    Módulo: {moduleName}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {permissionsByModule[moduleName].map((p) => (
                      <label
                        key={p.id}
                        className="flex items-start space-x-2 text-xs p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(p.id)}
                          onChange={() => handleTogglePermission(p.id)}
                          className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <span className="font-semibold block text-slate-800 dark:text-slate-200">{p.chave}</span>
                          <span className="text-[10px] text-slate-400">{p.descricao}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
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
              Salvar Perfil
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
