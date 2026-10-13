import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Week, Intercessor, PrayerRecord, Mission, SpiritualDirection } from './types';
import { 
  fetchAppState, 
  saveRecord, 
  addIntercessor, 
  resetDatabase,
  closeCurrentWeek,
  resetToWeek17,
  createMission,
  updateMission,
  deleteMission,
  createDirection,
  updateDirection,
  deleteDirection
} from './services/api';
import { Header, AppTab } from './components/Header';
import { WeekDashboard } from './components/WeekDashboard';
import { HistoryView } from './components/HistoryView';
import { MissionsView } from './components/MissionsView';
import { DirectionsView } from './components/DirectionsView';
import { RegisterModal } from './components/RegisterModal';
import { AddMemberModal } from './components/AddMemberModal';
import { Toast, ToastMessage } from './components/Toast';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AppTab>('current');
  
  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [registerIntercessorId, setRegisterIntercessorId] = useState<string | undefined>(undefined);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load state from server
  const loadState = useCallback(async () => {
    try {
      const data = await fetchAppState();
      setAppState(data);
    } catch (err) {
      console.error('Failed to load application state:', err);
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Falha na conexão',
        description: 'Não foi possível carregar os dados atualizados do servidor.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();

    // Auto-refresh state every 20 seconds to stay in sync
    const interval = setInterval(() => {
      loadState();
    }, 20000);

    return () => clearInterval(interval);
  }, [loadState]);

  // Open register modal pre-selecting an intercessor
  const handleOpenRegisterFor = (intercessorId?: string) => {
    setRegisterIntercessorId(intercessorId);
    setIsRegisterOpen(true);
  };

  // Save prayer record
  const handleSaveRecord = async (intercessorId: string, count: number) => {
    if (!appState) return;
    const currentWeekId = appState.currentWeekId;
    const person = appState.intercessors.find(i => i.id === intercessorId);
    const personName = person ? person.name : 'Intercessor';

    try {
      const res = await saveRecord(currentWeekId, intercessorId, count);

      // Update state locally
      setAppState(prev => {
        if (!prev) return prev;
        const newRecords = [...prev.records];
        const existingIdx = newRecords.findIndex(r => r.weekId === currentWeekId && r.intercessorId === intercessorId);
        if (existingIdx >= 0) {
          newRecords[existingIdx] = res.record;
        } else {
          newRecords.push(res.record);
        }

        const newWeeks = prev.weeks.map(w => w.id === res.week.id ? res.week : w);
        return {
          ...prev,
          records: newRecords,
          weeks: newWeeks,
        };
      });

      // Feedback toast
      if (res.justTriggeredWhatsapp) {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Todos responderam!',
          description: `Com o registro de ${personName}, todos os intercessores responderam esta semana. O resultado de ${res.week.memberCountAtWeek * 140} Ave-Marias está pronto.`,
        });
      } else {
        setToast({
          id: String(Date.now()),
          type: 'success',
          title: 'Registro salvo',
          description: `${personName}: ${count} Ave-Marias registradas com sucesso para esta semana.`,
        });
      }
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao salvar. Verifique sua conexão e tente novamente.');
    }
  };

  // Add new intercessor
  const handleAddMember = async (name: string) => {
    try {
      const res = await addIntercessor(name);
      await loadState();

      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Membro adicionado',
        description: `${res.intercessor.name} agora faz parte do grupo de intercessão. Nova meta semanal: ${res.currentWeek.totalTarget} Ave-Marias.`,
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao adicionar novo membro.');
    }
  };

  // Close current week & advance to next (Section 7 & 8)
  const handleCloseWeek = async () => {
    try {
      const res = await closeCurrentWeek();
      await loadState();
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: `Semana ${res.closedWeek.weekNumber} Encerrada!`,
        description: `Total de ${res.totalPrayed.toLocaleString('pt-BR')} Ave-Marias gravado no histórico. A Semana ${res.nextWeek.weekNumber} foi iniciada zerada! 🙏`,
      });
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Erro ao fechar semana',
        description: err.message || 'Não foi possível realizar o fechamento.',
      });
    }
  };

  // Reset to Week 17 for testing
  const handleResetToWeek17 = async () => {
    try {
      await resetToWeek17();
      await loadState();
      setToast({
        id: String(Date.now()),
        type: 'info',
        title: 'Semana 17 reaberta',
        description: 'O sistema voltou para a Semana 17 para novos testes de transição.',
      });
    } catch (err: any) {
      setToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Erro ao resetar',
        description: err.message,
      });
    }
  };

  // Missions CRUD
  const handleCreateMission = async (data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await createMission(data);
      setAppState(prev => prev ? {
        ...prev,
        missions: [res.mission, ...(prev.missions || [])],
      } : prev);
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Missão criada',
        description: `"${res.mission.title}" agendada para ${res.mission.date} às ${res.mission.time}. Os membros escalados foram notificados!`,
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao criar missão.');
    }
  };

  const handleUpdateMission = async (id: string, data: Partial<Mission>) => {
    try {
      const res = await updateMission(id, data);
      setAppState(prev => prev ? {
        ...prev,
        missions: (prev.missions || []).map(m => m.id === id ? res.mission : m),
      } : prev);
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Missão atualizada',
        description: `Alterações salvas e participantes notificados.`,
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar missão.');
    }
  };

  const handleDeleteMission = async (id: string) => {
    try {
      await deleteMission(id);
      setAppState(prev => prev ? {
        ...prev,
        missions: (prev.missions || []).filter(m => m.id !== id),
      } : prev);
      setToast({
        id: String(Date.now()),
        type: 'info',
        title: 'Missão cancelada',
        description: 'A missão foi cancelada e os participantes foram avisados.',
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao excluir missão.');
    }
  };

  // Spiritual Directions CRUD
  const handleCreateDirection = async (data: Omit<SpiritualDirection, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await createDirection(data);
      setAppState(prev => prev ? {
        ...prev,
        directions: [res.direction, ...(prev.directions || []).filter(d => d.weekId !== res.direction.weekId)],
      } : prev);
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Direcionamento registrado',
        description: `O direcionamento espiritual da Semana ${res.direction.weekNumber} foi salvo!`,
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao registrar direcionamento.');
    }
  };

  const handleUpdateDirection = async (id: string, data: Partial<SpiritualDirection>) => {
    try {
      const res = await updateDirection(id, data);
      setAppState(prev => prev ? {
        ...prev,
        directions: (prev.directions || []).map(d => d.id === id ? res.direction : d),
      } : prev);
      setToast({
        id: String(Date.now()),
        type: 'success',
        title: 'Direcionamento atualizado',
        description: `O texto foi atualizado com sucesso.`,
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar direcionamento.');
    }
  };

  const handleDeleteDirection = async (id: string) => {
    try {
      await deleteDirection(id);
      setAppState(prev => prev ? {
        ...prev,
        directions: (prev.directions || []).filter(d => d.id !== id),
      } : prev);
      setToast({
        id: String(Date.now()),
        type: 'info',
        title: 'Direcionamento removido',
        description: 'O direcionamento espiritual foi excluído.',
      });
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao excluir direcionamento.');
    }
  };

  // Reset to initial data
  const handleResetData = async () => {
    if (!confirm('Deseja realmente restaurar os dados iniciais de demonstração?')) {
      return;
    }
    await resetDatabase();
    await loadState();
    setToast({
      id: String(Date.now()),
      type: 'info',
      title: 'Dados restaurados',
      description: 'O grupo foi resetado com os 9 intercessores e dados oficiais.',
    });
  };

  if (isLoading || !appState) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#233529] mb-4" />
        <h2 className="font-editorial text-xl font-medium text-[#1C2024]">
          Carregando Ave-Marias...
        </h2>
        <p className="text-xs text-[#706B62] mt-1">
          Sincronizando com o grupo de intercessão
        </p>
      </div>
    );
  }

  const currentWeek = appState.weeks.find(w => w.id === appState.currentWeekId) || appState.weeks[appState.weeks.length - 1];

  return (
    <div className="min-h-screen bg-[#F7F3EB] flex flex-col relative overflow-x-hidden selection:bg-[#58111A]/15 selection:text-[#58111A]">
      {/* Dynamic Animated Fluid Mesh Gradient Background */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        {/* Warm Wine / Rose Glow */}
        <div 
          className="absolute -top-[15%] -left-[10%] w-[85vw] max-w-[650px] h-[85vw] max-h-[650px] rounded-full blur-[80px] opacity-80 animate-fluid-1"
          style={{
            background: 'radial-gradient(circle, rgba(165, 38, 58, 0.32) 0%, rgba(215, 110, 135, 0.20) 45%, transparent 70%)',
          }}
        />
        {/* Warm Champagne Gold Glow */}
        <div 
          className="absolute top-[20%] -right-[15%] w-[80vw] max-w-[600px] h-[80vw] max-h-[600px] rounded-full blur-[90px] opacity-75 animate-fluid-2"
          style={{
            background: 'radial-gradient(circle, rgba(235, 180, 115, 0.35) 0%, rgba(245, 210, 155, 0.20) 50%, transparent 75%)',
          }}
        />
        {/* Deep Marian Dawn Glow */}
        <div 
          className="absolute -bottom-[15%] left-[10%] w-[90vw] max-w-[700px] h-[90vw] max-h-[700px] rounded-full blur-[90px] opacity-70 animate-fluid-3"
          style={{
            background: 'radial-gradient(circle, rgba(138, 30, 48, 0.26) 0%, rgba(210, 140, 150, 0.18) 45%, transparent 70%)',
          }}
        />
        {/* Soft Pearlescent Core */}
        <div 
          className="absolute top-[40%] left-[20%] w-[55vw] max-w-[450px] h-[55vw] max-h-[450px] rounded-full blur-[70px] opacity-50 animate-fluid-1"
          style={{
            animationDuration: '24s',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(250, 235, 220, 0.4) 50%, transparent 70%)',
          }}
        />
      </div>

      {/* Top Header with 4 clean tabs: Esta semana, Histórico, Missões e Direcionamento */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        intercessorsCount={appState.intercessors.filter(i => i.active).length}
      />

      {/* Main Content Container - Mobile First Optimized */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-7 relative z-10">
        <div className="animate-in fade-in duration-150">
          {activeTab === 'current' && (
            <WeekDashboard
              currentWeek={currentWeek}
              weeks={appState.weeks}
              intercessors={appState.intercessors}
              records={appState.records}
              onOpenRegisterFor={handleOpenRegisterFor}
              onOpenAddMember={() => setIsAddMemberOpen(true)}
              onCloseWeek={handleCloseWeek}
              onResetToWeek17={handleResetToWeek17}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              weeks={appState.weeks}
              intercessors={appState.intercessors}
              records={appState.records}
              currentWeekId={appState.currentWeekId}
              onResetData={handleResetData}
              onResetToWeek17={handleResetToWeek17}
            />
          )}

          {activeTab === 'missions' && (
            <MissionsView
              missions={appState.missions || []}
              intercessors={appState.intercessors}
              onCreateMission={handleCreateMission}
              onUpdateMission={handleUpdateMission}
              onDeleteMission={handleDeleteMission}
            />
          )}

          {activeTab === 'directions' && (
            <DirectionsView
              directions={appState.directions || []}
              currentWeek={currentWeek}
              weeks={appState.weeks}
              onCreateDirection={handleCreateDirection}
              onUpdateDirection={handleUpdateDirection}
              onDeleteDirection={handleDeleteDirection}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EAE4D7] py-6 bg-[#FBF9F5] text-center text-xs text-[#8E877C]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Grupo de Intercessão · Ave-Marias Semanais</span>
          <span className="text-[11px]">
            Horário de Brasília (UTC-3) · Meta individual: 140 / semana
          </span>
        </div>
      </footer>

      {/* Register Modal */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        intercessors={appState.intercessors}
        currentWeek={currentWeek}
        records={appState.records}
        initialIntercessorId={registerIntercessorId}
        onSave={handleSaveRecord}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
        existingNames={appState.intercessors.map(i => i.name)}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
