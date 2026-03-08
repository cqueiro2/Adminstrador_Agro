import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Shield, UserCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type UserRole = 'admin' | 'gerente' | 'operador';

type SystemUser = {
  id: number;
  name: string;
  login: string;
  role: UserRole;
};

type FarmAccessSettings = {
  activeFarmName: string;
  activeAdminLogin: string;
  farmByAdminLogin: Record<string, string>;
};

const USERS_STORAGE_KEY = 'agro-system-users';
const FARM_SETTINGS_STORAGE_KEY = 'agro-farm-admin-settings';
const CURRENT_LOGIN_STORAGE_KEY = 'agro-current-login';

const DEFAULT_USERS: SystemUser[] = [
  { id: 1, name: 'João Silva', login: 'joao@fazenda.com', role: 'admin' },
  { id: 2, name: 'Maria Santos', login: 'maria@fazenda.com', role: 'gerente' },
  { id: 3, name: 'Pedro Lima', login: 'pedro@fazenda.com', role: 'operador' },
];

const DEFAULT_SETTINGS: FarmAccessSettings = {
  activeFarmName: 'Fazenda Santa Aurora',
  activeAdminLogin: 'joao@fazenda.com',
  farmByAdminLogin: {
    'joao@fazenda.com': 'Fazenda Santa Aurora',
  },
};

export const Administradores: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>(DEFAULT_USERS);
  const [settings, setSettings] = useState<FarmAccessSettings>(DEFAULT_SETTINGS);

  const [farmNameInput, setFarmNameInput] = useState(DEFAULT_SETTINGS.activeFarmName);
  const [selectedLogin, setSelectedLogin] = useState(DEFAULT_SETTINGS.activeAdminLogin);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const [currentLogin, setCurrentLogin] = useState(DEFAULT_USERS[0].login);

  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        setUsers(DEFAULT_USERS);
      }
    }

    const storedSettings = localStorage.getItem(FARM_SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings) as FarmAccessSettings;
        setSettings(parsed);
        setFarmNameInput(parsed.activeFarmName);
        setSelectedLogin(parsed.activeAdminLogin);
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }

    const storedCurrentLogin = localStorage.getItem(CURRENT_LOGIN_STORAGE_KEY);
    if (storedCurrentLogin) {
      setCurrentLogin(storedCurrentLogin);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(FARM_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(CURRENT_LOGIN_STORAGE_KEY, currentLogin);
  }, [currentLogin]);

  useEffect(() => {
    if (!confirmMessage) return;
    const timer = setTimeout(() => setConfirmMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmMessage]);

  const currentUser = useMemo(
    () => users.find((user) => user.login === currentLogin) ?? users[0],
    [users, currentLogin]
  );

  const activeAdmin = useMemo(
    () => users.find((user) => user.login === settings.activeAdminLogin),
    [users, settings.activeAdminLogin]
  );

  const canManageSettings = currentUser?.role === 'admin';

  const handleConfirmChanges = () => {
    if (!canManageSettings) {
      setConfirmMessage('Acesso negado: apenas administradores podem alterar essas configurações.');
      return;
    }

    const normalizedFarmName = farmNameInput.trim();
    if (!normalizedFarmName) {
      setConfirmMessage('Informe o nome da fazenda para continuar.');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      activeFarmName: normalizedFarmName,
      activeAdminLogin: selectedLogin,
      farmByAdminLogin: {
        ...prev.farmByAdminLogin,
        [selectedLogin]: normalizedFarmName,
      },
    }));

    const selectedUser = users.find((user) => user.login === selectedLogin);
    setConfirmMessage(
      `Configuração atualizada: ${selectedUser?.name ?? selectedLogin} agora é o administrador da fazenda ${normalizedFarmName}.`
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Administradores</h2>
        <p className="text-slate-500">Defina qual login administrador é responsável pela fazenda ativa.</p>
      </div>

      <Card title="Configuração de Responsável pela Fazenda">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Usuário logado</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{currentUser?.name}</p>
              <p className="text-xs text-slate-500">{currentUser?.login} · {currentUser?.role.toUpperCase()}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Status de permissão</p>
              <p className={`mt-2 text-sm font-semibold ${canManageSettings ? 'text-emerald-600' : 'text-red-500'}`}>
                {canManageSettings ? 'Permitido alterar configurações' : 'Sem permissão para alterar'}
              </p>
            </div>
          </div>

          {!canManageSettings && (
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
              <AlertTriangle size={18} className="mt-0.5" />
              <p className="text-sm font-medium">Apenas usuários com perfil <strong>admin</strong> podem acessar e alterar as configurações de fazenda e responsável.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome da Fazenda"
              value={farmNameInput}
              onChange={(event) => setFarmNameInput(event.target.value)}
              placeholder="Ex: Fazenda Boa Esperança"
              disabled={!canManageSettings}
            />

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Login responsável
              </label>
              <select
                value={selectedLogin}
                onChange={(event) => setSelectedLogin(event.target.value)}
                disabled={!canManageSettings}
                className="block w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all duration-200 disabled:opacity-60"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.login}>
                    {user.login} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleConfirmChanges} disabled={!canManageSettings}>
              <UserCheck size={16} className="mr-2" />
              Confirmar responsável
            </Button>
          </div>

          {confirmMessage && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {confirmMessage}
            </div>
          )}
        </div>
      </Card>

      <Card title="Resumo Atual">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Administrador ativo</p>
            <p className="mt-2 text-lg font-bold text-slate-800">{activeAdmin?.name ?? 'Não definido'}</p>
            <p className="text-sm text-slate-500">{settings.activeAdminLogin}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Fazenda ativa</p>
            <p className="mt-2 text-lg font-bold text-slate-800">{settings.activeFarmName}</p>
            <p className="text-sm text-slate-500">Associada ao administrador selecionado</p>
          </div>
        </div>
      </Card>

      <Card title="Logins cadastrados no sistema">
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.login}</p>
              </div>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                <Shield size={12} className="inline mr-1" />
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
