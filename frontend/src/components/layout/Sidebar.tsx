import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Layers,
  ArrowRightLeft,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Kanban,
  Calendar,
  Wrench,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Settings,
  X,
  Briefcase,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  permission: string;
}

interface MenuGroup {
  groupName: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile, isCollapsed }) => {
  const { hasPermission } = useAuth();

  const menuGroups: MenuGroup[] = [
    {
      groupName: 'VISÃO GERAL',
      items: [
        { title: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, permission: 'dashboard.view' },
      ],
    },
    {
      groupName: 'CADASTROS',
      items: [
        { title: 'Clientes', path: '/customers', icon: <Users className="w-5 h-5" />, permission: 'customers.view' },
        { title: 'Fornecedores', path: '/suppliers', icon: <Building2 className="w-5 h-5" />, permission: 'suppliers.view' },
        { title: 'Produtos', path: '/products', icon: <Package className="w-5 h-5" />, permission: 'products.view' },
        { title: 'Serviços', path: '/services', icon: <Briefcase className="w-5 h-5" />, permission: 'services.view' },
      ],
    },
    {
      groupName: 'OPERACIONAL & VENDAS',
      items: [
        { title: 'Estoque / Kardex', path: '/inventory', icon: <Layers className="w-5 h-5" />, permission: 'inventory.view' },
        { title: 'Compras', path: '/purchases', icon: <ShoppingCart className="w-5 h-5" />, permission: 'purchases.view' },
        { title: 'Orçamentos', path: '/quotes', icon: <FileSpreadsheet className="w-5 h-5" />, permission: 'sales.view' },
        { title: 'Vendas', path: '/sales', icon: <TrendingUp className="w-5 h-5" />, permission: 'sales.view' },
        { title: 'CRM / Pipeline', path: '/crm', icon: <Kanban className="w-5 h-5" />, permission: 'crm.view' },
        { title: 'Ordens de Serviço', path: '/service-orders', icon: <Wrench className="w-5 h-5" />, permission: 'service_orders.view' },
        { title: 'Agenda & Tarefas', path: '/agenda', icon: <Calendar className="w-5 h-5" />, permission: 'agenda.view' },
      ],
    },
    {
      groupName: 'FINANCEIRO & RELATÓRIOS',
      items: [
        { title: 'Financeiro & Caixa', path: '/finance', icon: <DollarSign className="w-5 h-5" />, permission: 'finance.view' },
        { title: 'Central de Relatórios', path: '/reports', icon: <BarChart3 className="w-5 h-5" />, permission: 'reports.view' },
      ],
    },
    {
      groupName: 'ADMINISTRAÇÃO',
      items: [
        { title: 'Usuários', path: '/users', icon: <UserCheck className="w-5 h-5" />, permission: 'users.view' },
        { title: 'Perfis & Permissões', path: '/roles', icon: <ShieldCheck className="w-5 h-5" />, permission: 'roles.view' },
        { title: 'Auditoria', path: '/audit', icon: <ArrowRightLeft className="w-5 h-5" />, permission: 'audit.view' },
        { title: 'Configurações', path: '/settings', icon: <Settings className="w-5 h-5" />, permission: 'settings.view' },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-6 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-primary-900/40">
            E
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-extrabold text-white text-base tracking-tight leading-none">ERP MASTER</h1>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Empresarial</span>
            </div>
          )}
        </div>
        <button onClick={onCloseMobile} className="lg:hidden text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter((item) => hasPermission(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {group.groupName}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-950/50 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3 truncate">{item.title}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 text-center">
          <p className="text-xs text-slate-500">ERP Profissional v1.0.0</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
