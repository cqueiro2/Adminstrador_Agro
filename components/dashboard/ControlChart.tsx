
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ControlChartData } from '../../types';

interface ControlChartProps {
  data: ControlChartData;
  title?: string;
}

export const ControlChart: React.FC<ControlChartProps> = ({ data, title }) => {
  const chartDataPrice = [
    { name: 'Entrada', value: data.precoEntrada, fill: '#94a3b8' },
    { name: 'Saída', value: data.precoSaida, fill: '#F27D26' },
  ].filter(d => d.value !== undefined && d.value !== null && d.value > 0);

  const chartDataWeight = [
    { name: 'Entrada', value: data.pesoEntrada, fill: '#94a3b8' },
    { name: 'Real', value: data.pesoFinalReal, fill: '#F27D26' },
    { name: 'Gemini', value: data.pesoFinalEstimado, fill: '#3b82f6' },
    { name: 'Tabela', value: data.pesoFinalEstimadoTabela, fill: '#10b981' },
  ].filter(d => d.value !== undefined && d.value !== null && d.value > 0);

  const diffGemini = data.pesoFinalReal && data.pesoFinalEstimado ? Number((data.pesoFinalReal - data.pesoFinalEstimado).toFixed(2)) : null;
  const diffTabela = data.pesoFinalReal && data.pesoFinalEstimadoTabela ? Number((data.pesoFinalReal - data.pesoFinalEstimadoTabela).toFixed(2)) : null;

  const chartDataDiff = [
    { name: 'vs Gemini', value: diffGemini, fill: '#3b82f6' },
    { name: 'vs Tabela', value: diffTabela, fill: '#10b981' },
  ].filter(d => d.value !== null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isDiff = label.startsWith('vs ');
      const value = payload[0].value;
      const unit = isDiff || label.includes('Peso') || label.includes('Real') || label.includes('Gemini') || label.includes('Tabela') ? 'kg' : 'R$';
      
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-lg font-bold ${isDiff ? (value >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-900'}`}>
            {unit === 'R$' ? `R$ ${value.toLocaleString()}` : `${value > 0 && isDiff ? '+' : ''}${value.toLocaleString()} ${unit}`}
          </p>
          {isDiff && (
            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
              {value >= 0 ? 'Acima da estimativa' : 'Abaixo da estimativa'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preços (R$)</h4>
          </div>
          <div className="flex-1 min-h-[200px]">
            {chartDataPrice.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataPrice} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartDataPrice.map((entry, index) => (
                      <Cell key={`cell-price-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs font-medium italic">
                Dados insuficientes
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pesos (kg)</h4>
          </div>
          <div className="flex-1 min-h-[200px]">
            {chartDataWeight.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWeight} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                    {chartDataWeight.map((entry, index) => (
                      <Cell key={`cell-weight-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs font-medium italic">
                Dados insuficientes
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Precisão (kg)</h4>
          </div>
          <div className="flex-1 min-h-[200px]">
            {chartDataDiff.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataDiff} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
                    {chartDataDiff.map((entry, index) => (
                      <Cell 
                        key={`cell-diff-${index}`} 
                        fill={entry.value && entry.value >= 0 ? '#10b981' : '#f43f5e'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs font-medium italic">
                Aguardando peso real
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
