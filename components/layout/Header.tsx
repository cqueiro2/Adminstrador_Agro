
import React from 'react';
import { Search, Bell, MessageSquare, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
          >
            <Menu size={24} className="text-slate-600" />
          </button>
        )}
        <h2 className="text-xl font-bold text-slate-800 hidden sm:block">{title}</h2>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar animal, lote ou alerta..." 
            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
          <MessageSquare size={20} />
        </button>
        
        <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-none">João Silva</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">Administrador</p>
          </div>
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User" 
            className="w-10 h-10 rounded-xl border-2 border-white shadow-sm"
          />
        </div>
      </div>
    </header>
  );
};
