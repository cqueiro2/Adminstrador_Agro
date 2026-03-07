import React from 'react';
import { Card } from '../ui/Card';
import { Users, UserPlus, Shield, Mail } from 'lucide-react';
import { Button } from '../ui/Button';

export const Administradores: React.FC = () => {
  const admins = [
    { id: 1, name: 'João Silva', role: 'Administrador Master', email: 'joao@fazenda.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 2, name: 'Maria Santos', role: 'Gerente de Campo', email: 'maria@fazenda.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-800">Administradores</h2>
          <p className="text-slate-500">Gerencie os usuários com acesso ao sistema.</p>
        </div>
        <Button className="bg-brand hover:bg-orange-600">
          <UserPlus size={18} className="mr-2" />
          Novo Administrador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {admins.map(admin => (
          <Card key={admin.id}>
            <div className="flex items-center gap-4">
              <img src={admin.avatar} alt={admin.name} className="w-16 h-16 rounded-2xl border-2 border-slate-50 shadow-sm" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{admin.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                  <Shield size={14} />
                  <span>{admin.role}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Mail size={14} />
                  <span>{admin.email}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-brand">Editar</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Permissões de Acesso">
        <div className="text-center py-12 text-slate-400">
          <Shield size={48} className="mx-auto mb-4 opacity-20" />
          <p>Configurações de permissões avançadas em desenvolvimento.</p>
        </div>
      </Card>
    </div>
  );
};
