import React from 'react';
import { Card } from '../ui/Card';
import { Activity, TrendingUp, Sprout, Droplets } from 'lucide-react';

export const GestaoAgro: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Gestão Agro</h2>
        <p className="text-slate-500">Visão geral da produção e insumos da fazenda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Produção de Pasto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <Sprout size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">85%</p>
              <p className="text-sm text-slate-400">Capacidade Ideal</p>
            </div>
          </div>
        </Card>
        <Card title="Consumo de Água">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">12.5m³</p>
              <p className="text-sm text-slate-400">Média Diária</p>
            </div>
          </div>
        </Card>
        <Card title="Índice Pluviométrico">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">45mm</p>
              <p className="text-sm text-slate-400">Últimos 30 dias</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Calendário de Manejo">
        <div className="text-center py-12 text-slate-400">
          <Activity size={48} className="mx-auto mb-4 opacity-20" />
          <p>Funcionalidade de calendário em desenvolvimento.</p>
        </div>
      </Card>
    </div>
  );
};
