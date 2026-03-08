import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { UserPlus, Shield, Mail, Edit2, Save, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

type Admin = {
  id: number;
  name: string;
  role: string;
  email: string;
  avatar: string;
  active: boolean;
};

type AccessSettings = {
  twoFactorRequired: boolean;
  allowInviteByEmail: boolean;
  auditLogEnabled: boolean;
};

const DEFAULT_ADMINS: Admin[] = [
  { id: 1, name: 'João Silva', role: 'Administrador Master', email: 'joao@fazenda.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', active: true },
  { id: 2, name: 'Maria Santos', role: 'Gerente de Campo', email: 'maria@fazenda.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Molly', active: true },
];

const DEFAULT_SETTINGS: AccessSettings = {
  twoFactorRequired: true,
  allowInviteByEmail: true,
  auditLogEnabled: true,
};

const ADMIN_STORAGE_KEY = 'agro-admins';
const ADMIN_SETTINGS_STORAGE_KEY = 'agro-admin-settings';

export const Administradores: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>(DEFAULT_ADMINS);
  const [settings, setSettings] = useState<AccessSettings>(DEFAULT_SETTINGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<Omit<Admin, 'id' | 'avatar'>>({
    name: '',
    role: '',
    email: '',
    active: true,
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedAdmins = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (storedAdmins) {
      try {
        setAdmins(JSON.parse(storedAdmins));
      } catch {
        setAdmins(DEFAULT_ADMINS);
      }
    }

    const storedSettings = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  const activeAdmins = useMemo(() => admins.filter((admin) => admin.active).length, [admins]);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({ name: '', role: '', email: '', active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      role: admin.role,
      email: admin.email,
      active: admin.active,
    });
    setIsModalOpen(true);
  };

  const handleSaveAdmin = () => {
    if (!formData.name.trim() || !formData.role.trim() || !formData.email.trim()) {
      setFeedbackMessage('Preencha nome, perfil e e-mail para salvar.');
      return;
    }

    if (editingAdmin) {
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === editingAdmin.id
            ? { ...admin, ...formData, name: formData.name.trim(), role: formData.role.trim(), email: formData.email.trim() }
            : admin
        )
      );
      setFeedbackMessage('Administrador atualizado com sucesso.');
    } else {
      const newAdmin: Admin = {
        id: Date.now(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name.trim() || 'User')}`,
        name: formData.name.trim(),
        role: formData.role.trim(),
        email: formData.email.trim(),
        active: formData.active,
      };
      setAdmins((prev) => [newAdmin, ...prev]);
      setFeedbackMessage('Novo administrador cadastrado.');
    }

    setIsModalOpen(false);
  };

  const updateSetting = (key: keyof AccessSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setFeedbackMessage('Configuração de acesso atualizada.');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-800">Administradores</h2>
          <p className="text-slate-500">Gerencie os usuários com acesso ao sistema.</p>
        </div>
        <Button className="bg-brand hover:bg-orange-600" onClick={openCreateModal}>
          <UserPlus size={18} className="mr-2" />
          Novo Administrador
        </Button>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {feedbackMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {admins.map((admin) => (
          <Card key={admin.id}>
            <div className="flex items-center gap-4">
              <img src={admin.avatar} alt={admin.name} className="w-16 h-16 rounded-2xl border-2 border-slate-50 shadow-sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{admin.name}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${admin.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {admin.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                  <Shield size={14} />
                  <span>{admin.role}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Mail size={14} />
                  <span>{admin.email}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-brand" onClick={() => openEditModal(admin)}>
                <Edit2 size={14} className="mr-1" />
                Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Permissões de Acesso">
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Total de administradores</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{admins.length}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Administradores ativos</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{activeAdmins}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Convites por e-mail</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{settings.allowInviteByEmail ? 'Habilitado' : 'Desabilitado'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={() => updateSetting('twoFactorRequired', !settings.twoFactorRequired)} className="w-full flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-semibold text-slate-700">Exigir autenticação em dois fatores</span>
              <span className={`text-xs font-bold uppercase ${settings.twoFactorRequired ? 'text-emerald-600' : 'text-slate-400'}`}>{settings.twoFactorRequired ? 'Ativo' : 'Inativo'}</span>
            </button>
            <button onClick={() => updateSetting('allowInviteByEmail', !settings.allowInviteByEmail)} className="w-full flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-semibold text-slate-700">Permitir convite de novos usuários por e-mail</span>
              <span className={`text-xs font-bold uppercase ${settings.allowInviteByEmail ? 'text-emerald-600' : 'text-slate-400'}`}>{settings.allowInviteByEmail ? 'Ativo' : 'Inativo'}</span>
            </button>
            <button onClick={() => updateSetting('auditLogEnabled', !settings.auditLogEnabled)} className="w-full flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-semibold text-slate-700">Habilitar trilha de auditoria</span>
              <span className={`text-xs font-bold uppercase ${settings.auditLogEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>{settings.auditLogEnabled ? 'Ativo' : 'Inativo'}</span>
            </button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAdmin ? 'Editar Administrador' : 'Novo Administrador'}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              <X size={16} className="mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSaveAdmin}>
              <Save size={16} className="mr-1" /> Salvar
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nome do administrador"
          />
          <Input
            label="Perfil"
            value={formData.role}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            placeholder="Ex: Gerente de Operações"
          />
          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="usuario@fazenda.com"
          />
          <label className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Administrador ativo</span>
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
              className="h-4 w-4"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
};
