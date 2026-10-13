import { AppState, PrayerRecord, Intercessor, Week, AppSettings, Mission, SpiritualDirection } from '../types';
import { getInitialAppState } from '../initialData';

const LOCAL_STORAGE_KEY = 'ave_marias_backup_state_v1';

function getLocalBackup(): AppState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
  }
  return getInitialAppState();
}

function saveLocalBackup(state: AppState) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export async function fetchAppState(): Promise<AppState & { serverTimeBRT?: string; source?: string; overallTotal?: number }> {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      saveLocalBackup(data);
      return { ...data, source: 'backend' };
    }
  } catch (err) {
    console.warn('Backend fetch failed, using local cache:', err);
  }

  return { ...getLocalBackup(), source: 'local' };
}

export async function saveRecord(
  weekId: string,
  intercessorId: string,
  count: number
): Promise<{
  success: boolean;
  record: PrayerRecord;
  allAnswered: boolean;
  justTriggeredWhatsapp: boolean;
  week: Week;
  overallTotal?: number;
}> {
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekId, intercessorId, count }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Não foi possível salvar o registro.');
  }

  return res.json();
}

export async function addIntercessor(name: string): Promise<{
  success: boolean;
  intercessor: Intercessor;
  currentWeek: Week;
}> {
  const res = await fetch('/api/intercessors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao adicionar membro.');
  }

  return res.json();
}

// Week closure (Monday 20h transition)
export async function closeCurrentWeek(weekId?: string): Promise<{
  success: boolean;
  closedWeek: Week;
  nextWeek: Week;
  totalPrayed: number;
  overallTotal: number;
  state: AppState;
}> {
  const res = await fetch('/api/weeks/close-current', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao fechar a semana.');
  }

  return res.json();
}

export async function resetToWeek17(): Promise<{ success: boolean; state: AppState }> {
  const res = await fetch('/api/weeks/reset-to-week17', {
    method: 'POST',
  });
  return res.json();
}

// Missions API
export async function createMission(data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
  success: boolean;
  mission: Mission;
}> {
  const res = await fetch('/api/missions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar missão.');
  }

  return res.json();
}

export async function updateMission(id: string, data: Partial<Mission>): Promise<{
  success: boolean;
  mission: Mission;
}> {
  const res = await fetch(`/api/missions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar missão.');
  }

  return res.json();
}

export async function deleteMission(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/missions/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao excluir missão.');
  }

  return res.json();
}

// Spiritual Directions API
export async function createDirection(data: Omit<SpiritualDirection, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
  success: boolean;
  direction: SpiritualDirection;
}> {
  const res = await fetch('/api/directions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar direcionamento.');
  }

  return res.json();
}

export async function updateDirection(id: string, data: Partial<SpiritualDirection>): Promise<{
  success: boolean;
  direction: SpiritualDirection;
}> {
  const res = await fetch(`/api/directions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar direcionamento.');
  }

  return res.json();
}

export async function deleteDirection(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/directions/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao excluir direcionamento.');
  }

  return res.json();
}

export async function triggerNotification(
  type: 'monday_12h' | 'monday_18h',
  weekId?: string
): Promise<{
  success: boolean;
  recipientsCount: number;
  recipientNames: string[];
}> {
  const res = await fetch('/api/notifications/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, weekId }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Erro ao disparar notificações.');
  }

  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; state: AppState }> {
  const res = await fetch('/api/reset-data', { method: 'POST' });
  if (res.ok) {
    return res.json();
  }
  const initial = getInitialAppState();
  saveLocalBackup(initial);
  return { success: true, state: initial };
}
