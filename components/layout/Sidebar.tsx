
import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  BarChart3, 
  PawPrint, 
  Settings, 
  FileText,
  LogOut,
  ChevronRight,
  Users,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gestao-agro', label: 'Gestão Agro', icon: Activity },
  { id: 'lotes', label: 'Lotes', icon: Layers },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
  { id: 'animais', label: 'Animais', icon: PawPrint },
  { id: 'administradores', label: 'Administradores', icon: Users },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobile, onClose }) => {
  return (
    <div className={`h-full flex flex-col bg-white border-r border-slate-100 ${isMobile ? 'w-full' : 'w-72'}`}>
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
          <PawPrint size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Santa Maria</h1>
          <p className="text-xs text-slate-400 font-medium">Gestão Agro</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile && onClose) onClose();
              }}
              className={`w-full group ${isActive ? 'nav-item-active' : 'nav-item'}`}
            >
              <Icon size={20} className={isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-600'} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight size={16} className="text-brand" />}
            </button>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <button className="w-full flex items-center gap-3 px-4 py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95">
          <FileText size={20} />
          <span>Relatório Mensal</span>
        </button>
      </div>
    </div>
  );
};
