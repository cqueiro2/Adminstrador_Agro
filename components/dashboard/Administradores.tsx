import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Shield, UserCheck, AlertTriangle, PlusCircle, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type UserRole = 'admin' | 'gerente' | 'operador';

type SystemUser = {
  id: number;
  name: string;
  login: string;
  role: UserRole;
};

type Farm = {
  id: number;
  name: string;
  adminLogin: string;
};

type AdminSettings = {
  activeFarmId: number;
  activeAdminLogin: string;
};

const USERS_STORAGE_KEY = 'agro-system-users';
const FARMS_STORAGE_KEY = 'agro-system-farms';
const SETTINGS_STORAGE_KEY = 'agro-admin-settings';
const CURRENT_LOGIN_STORAGE_KEY = 'agro-current-login';

const DEFAULT_USERS: SystemUser[] = [
  { id: 1, name: 'João Silva', login: 'joao@fazenda.com', role: 'admin' },
  { id: 2, name: 'Maria Santos', login: 'maria@fazenda.com', role: 'gerente' },
  { id: 3, name: 'Pedro Lima', login: 'pedro@fazenda.com', role: 'operador' },
];

const DEFAULT_FARMS: Farm[] = [
  { id: 1, name: 'Fazenda Santa Aurora', adminLogin: 'joao@fazenda.com' },
];

const DEFAULT_SETTINGS: AdminSettings = {
  activeFarmId: 1,
  activeAdminLogin: 'joao@fazenda.com',
};

export const Administradores: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>(DEFAULT_USERS);
  const [farms, setFarms] = useState<Farm[]>(DEFAULT_FARMS);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [currentLogin, setCurrentLogin] = useState(DEFAULT_USERS[0].login);

  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmAdminLogin, setNewFarmAdminLogin] = useState(DEFAULT_USERS[0].login);

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminLogin, setNewAdminLogin] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<UserRole>('admin');

  const [selectedFarmId, setSelectedFarmId] = useState<number>(DEFAULT_SETTINGS.activeFarmId);
  const [editFarmName, setEditFarmName] = useState(DEFAULT_FARMS[0].name);
  const [selectedResponsibleLogin, setSelectedResponsibleLogin] = useState(DEFAULT_SETTINGS.activeAdminLogin);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch {
        setUsers(DEFAULT_USERS);
      }
    }

    const storedFarms = localStorage.getItem(FARMS_STORAGE_KEY);
    if (storedFarms) {
      try {
        setFarms(JSON.parse(storedFarms));
      } catch {
        setFarms(DEFAULT_FARMS);
      }
    }

    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
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
    localStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(CURRENT_LOGIN_STORAGE_KEY, currentLogin);
  }, [currentLogin]);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const farm = farms.find((item) => item.id === selectedFarmId);
    if (!farm && farms.length > 0) {
      setSelectedFarmId(farms[0].id);
      setEditFarmName(farms[0].name);
      setSelectedResponsibleLogin(farms[0].adminLogin);
      return;
    }

    if (farm) {
      setEditFarmName(farm.name);
      setSelectedResponsibleLogin(farm.adminLogin);
    }
  }, [selectedFarmId, farms]);

  const currentUser = useMemo(() => users.find((user) => user.login === currentLogin) ?? users[0], [users, currentLogin]);
  const canManageSettings = currentUser?.role === 'admin';

  const activeFarm = useMemo(() => farms.find((farm) => farm.id === settings.activeFarmId), [farms, settings.activeFarmId]);
  const activeAdmin = useMemo(() => users.find((user) => user.login === settings.activeAdminLogin), [users, settings.activeAdminLogin]);

  const resetMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const ensureAdminPermission = (): boolean => {
    if (!canManageSettings) {
      setErrorMessage('Acesso negado: apenas usuários com permissão de administrador podem alterar configurações.');
      return false;
    }
    return true;
  };

  const handleCreateFarm = () => {
    resetMessages();
    if (!ensureAdminPermission()) return;

    const normalizedName = newFarmName.trim();
    if (!normalizedName) {
      setErrorMessage('Informe o nome da fazenda para cadastrar.');
      return;
    }

    const farmExists = farms.some((farm) => farm.name.toLowerCase() === normalizedName.toLowerCase());
    if (farmExists) {
      setErrorMessage('Já existe uma fazenda com esse nome.');
      return;
    }

    const adminExists = users.some((user) => user.login === newFarmAdminLogin);
    if (!adminExists) {
      setErrorMessage('Selecione um login válido para vincular à nova fazenda.');
      return;
    }

    const farmId = Date.now();
    const createdFarm: Farm = {
      id: farmId,
      name: normalizedName,
      adminLogin: newFarmAdminLogin,
    };

    setFarms((prev) => [...prev, createdFarm]);
    setSelectedFarmId(farmId);
    setSettings({
      activeFarmId: farmId,
      activeAdminLogin: newFarmAdminLogin,
    });
    setNewFarmName('');
    setSuccessMessage(`Fazenda ${normalizedName} cadastrada com sucesso.`);
  };

  const handleCreateAdmin = () => {
    resetMessages();
    if (!ensureAdminPermission()) return;

    const normalizedName = newAdminName.trim();
    const normalizedLogin = newAdminLogin.trim().toLowerCase();

    if (!normalizedName || !normalizedLogin) {
      setErrorMessage('Preencha nome e login para cadastrar o administrador.');
      return;
    }

    const loginExists = users.some((user) => user.login.toLowerCase() === normalizedLogin);
    if (loginExists) {
      setErrorMessage('Este login já está cadastrado no sistema.');
      return;
    }

    const createdUser: SystemUser = {
      id: Date.now(),
      name: normalizedName,
      login: normalizedLogin,
      role: newAdminRole,
    };

    setUsers((prev) => [...prev, createdUser]);
    setNewFarmAdminLogin(normalizedLogin);
    setSelectedResponsibleLogin(normalizedLogin);
    setNewAdminName('');
    setNewAdminLogin('');
    setNewAdminRole('admin');
    setSuccessMessage(`Usuário ${normalizedName} (${normalizedLogin}) cadastrado com sucesso.`);
  };

  const handleUpdateFarmAndResponsible = () => {
    resetMessages();
    if (!ensureAdminPermission()) return;

    const normalizedFarmName = editFarmName.trim();
    if (!normalizedFarmName) {
      setErrorMessage('Informe o nome da fazenda para salvar as alterações.');
      return;
    }

    const selectedFarm = farms.find((farm) => farm.id === selectedFarmId);
    if (!selectedFarm) {
      setErrorMessage('Selecione uma fazenda válida para edição.');
      return;
    }

    const selectedLoginExists = users.some((user) => user.login === selectedResponsibleLogin);
    if (!selectedLoginExists) {
      setErrorMessage('Selecione um login válido para definir o responsável.');
      return;
    }

    setFarms((prev) =>
      prev.map((farm) =>
        farm.id === selectedFarmId
          ? { ...farm, name: normalizedFarmName, adminLogin: selectedResponsibleLogin }
          : farm
      )
    );

    setSettings({
      activeFarmId: selectedFarmId,
      activeAdminLogin: selectedResponsibleLogin,
    });

    const selectedAdmin = users.find((user) => user.login === selectedResponsibleLogin);
    setSuccessMessage(
      `Alterações salvas com sucesso. ${selectedAdmin?.name ?? selectedResponsibleLogin} agora é o administrador ativo da fazenda ${normalizedFarmName}.`
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Administradores</h2>
        <p className="text-slate-500">Cadastre fazendas, cadastre administradores e vincule o responsável por cada fazenda.</p>
      </div>

      <Card title="Controle de Permissões">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Usuário logado</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{currentUser?.name}</p>
            <p className="text-xs text-slate-500">{currentUser?.login}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Perfil</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{currentUser?.role.toUpperCase()}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Permissão para alterações</p>
            <p className={`mt-2 text-sm font-semibold ${canManageSettings ? 'text-emerald-600' : 'text-red-500'}`}>
              {canManageSettings ? 'Permitida' : 'Negada'}
            </p>
          </div>
        </div>

        {!canManageSettings && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700">
            <AlertTriangle size={18} className="mt-0.5" />
            <p className="text-sm font-medium">Apenas administradores podem acessar e alterar as configurações deste menu.</p>
          </div>
        )}
      </Card>

      {(successMessage || errorMessage) && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${successMessage ? 'border border-emerald-100 bg-emerald-50 text-emerald-700' : 'border border-red-100 bg-red-50 text-red-700'}`}>
          {successMessage ?? errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Cadastrar nova fazenda">
          <div className="space-y-4">
            <Input
              label="Nome da fazenda"
              value={newFarmName}
              onChange={(event) => setNewFarmName(event.target.value)}
              placeholder="Ex: Fazenda Boa Esperança"
              disabled={!canManageSettings}
            />

            <div>
              <label htmlFor="new-farm-admin-login" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Administrador responsável (login)</label>
              <select
                id="new-farm-admin-login"
                value={newFarmAdminLogin}
                onChange={(event) => setNewFarmAdminLogin(event.target.value)}
                disabled={!canManageSettings}
                className="block w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all duration-200 disabled:opacity-60"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.login}>{user.login}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateFarm} disabled={!canManageSettings}>
                <Building2 size={16} className="mr-2" />
                Cadastrar fazenda
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Cadastrar novo administrador">
          <div className="space-y-4">
            <Input
              label="Nome"
              value={newAdminName}
              onChange={(event) => setNewAdminName(event.target.value)}
              placeholder="Nome completo"
              disabled={!canManageSettings}
            />

            <Input
              label="Login"
              value={newAdminLogin}
              onChange={(event) => setNewAdminLogin(event.target.value)}
              placeholder="usuario@fazenda.com"
              disabled={!canManageSettings}
            />

            <div>
              <label htmlFor="new-admin-role" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Perfil</label>
              <select
                id="new-admin-role"
                value={newAdminRole}
                onChange={(event) => setNewAdminRole(event.target.value as UserRole)}
                disabled={!canManageSettings}
                className="block w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all duration-200 disabled:opacity-60"
              >
                <option value="admin">admin</option>
                <option value="gerente">gerente</option>
                <option value="operador">operador</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateAdmin} disabled={!canManageSettings}>
                <PlusCircle size={16} className="mr-2" />
                Cadastrar administrador
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Editar fazenda e selecionar responsável">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="selected-farm" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Fazenda</label>
              <select
                id="selected-farm"
                value={selectedFarmId}
                onChange={(event) => setSelectedFarmId(Number(event.target.value))}
                disabled={!canManageSettings}
                className="block w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all duration-200 disabled:opacity-60"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Nome da fazenda (edição)"
              value={editFarmName}
              onChange={(event) => setEditFarmName(event.target.value)}
              placeholder="Nome atualizado da fazenda"
              disabled={!canManageSettings}
            />

            <div>
              <label htmlFor="selected-responsible-login" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Login responsável</label>
              <select
                id="selected-responsible-login"
                value={selectedResponsibleLogin}
                onChange={(event) => setSelectedResponsibleLogin(event.target.value)}
                disabled={!canManageSettings}
                className="block w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all duration-200 disabled:opacity-60"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.login}>{user.login}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUpdateFarmAndResponsible} disabled={!canManageSettings}>
              <UserCheck size={16} className="mr-2" />
              Confirmar e atualizar responsável
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Resumo ativo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Administrador ativo</p>
            <p className="mt-2 text-lg font-bold text-slate-800">{activeAdmin?.name ?? 'Não definido'}</p>
            <p className="text-sm text-slate-500">{settings.activeAdminLogin}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Fazenda ativa</p>
            <p className="mt-2 text-lg font-bold text-slate-800">{activeFarm?.name ?? 'Não definida'}</p>
            <p className="text-sm text-slate-500">ID: {settings.activeFarmId}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
