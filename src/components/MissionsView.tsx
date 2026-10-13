import React, { useState } from 'react';
import { Mission, Intercessor } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Bell,
  Sparkles,
  MapPin,
  AlertCircle
} from 'lucide-react';

interface MissionsViewProps {
  missions: Mission[];
  intercessors: Intercessor[];
  onCreateMission: (data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateMission: (id: string, data: Partial<Mission>) => Promise<void>;
  onDeleteMission: (id: string) => Promise<void>;
}

export const MissionsView: React.FC<MissionsViewProps> = ({
  missions,
  intercessors,
  onCreateMission,
  onUpdateMission,
  onDeleteMission,
}) => {
  const activeMembers = intercessors.filter(i => i.active);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 1)); // October 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('19:30');
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYearLabel = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  // Calendar Grid computation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: Array<{ dayNumber: number; dateStr: string; isCurrentMonth: boolean }> = [];

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      dateStr: dStr,
      isCurrentMonth: true,
    });
  }

  // Open modal for Create
  const handleOpenCreate = (presetDate?: string) => {
    setEditingMission(null);
    setTitle('');
    setDescription('');
    setDate(presetDate || new Date().toISOString().split('T')[0]);
    setTime('19:30');
    setAssignedMemberIds([]);
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (mission: Mission) => {
    setEditingMission(mission);
    setTitle(mission.title);
    setDescription(mission.description || '');
    setDate(mission.date);
    setTime(mission.time || '19:30');
    setAssignedMemberIds([...mission.assignedMemberIds]);
    setFormError('');
    setIsModalOpen(true);
  };

  // Toggle member in assignees list
  const toggleMember = (memberId: string) => {
    setAssignedMemberIds(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (assignedMemberIds.length === activeMembers.length) {
      setAssignedMemberIds([]);
    } else {
      setAssignedMemberIds(activeMembers.map(i => i.id));
    }
  };

  // Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Por favor, informe o título da missão.');
      return;
    }
    if (!date) {
      setFormError('Por favor, selecione uma data válida.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingMission) {
        await onUpdateMission(editingMission.id, {
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          assignedMemberIds,
        });
      } else {
        await onCreateMission({
          title: title.trim(),
          description: description.trim(),
          date,
          time,
          assignedMemberIds,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar a missão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id: string, missionTitle: string) => {
    if (!confirm(`Deseja realmente cancelar e excluir a missão "${missionTitle}"? Os participantes escalados serão notificados.`)) {
      return;
    }
    await onDeleteMission(id);
  };

  // Filter missions by selected date if one is picked, or show sorted upcoming
  const filteredMissions = selectedDateStr 
    ? missions.filter(m => m.date === selectedDateStr)
    : [...missions].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      {/* Header bar with primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#1C2024] tracking-tight">
            Calendário de Missões
          </h2>
          <p className="text-xs sm:text-sm text-[#706B62] mt-0.5">
            Agendamento e escala dos membros da Intercessão para missões e eventos da comunidade.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreate(selectedDateStr || undefined)}
          className="h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-[#58111A] hover:bg-[#430C13] active:scale-[0.98] rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer touch-manipulation self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Missão</span>
        </button>
      </div>

      {/* Main Layout: Calendar Grid + Missions List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Column */}
        <div className="lg:col-span-5 liquid-glass rounded-3xl p-5 sm:p-6 shadow-xs border border-[#EAE4D7]/80">
          <div className="flex items-center justify-between mb-4">
            <span className="font-editorial text-base sm:text-lg font-semibold text-[#1C2024] capitalize">
              {monthYearLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                aria-label="Mês anterior"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="Próximo mês"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#8E877C] mb-2 uppercase tracking-wider">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-10 sm:h-11 rounded-xl opacity-0" />
            ))}

            {/* Month days */}
            {calendarDays.map(({ dayNumber, dateStr }) => {
              const dayMissions = missions.filter(m => m.date === dateStr);
              const hasMissions = dayMissions.length > 0;
              const isSelected = selectedDateStr === dateStr;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(isSelected ? null : dateStr)}
                  className={`h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer text-xs font-medium ${
                    isSelected
                      ? 'bg-[#58111A] text-white shadow-xs font-semibold'
                      : hasMissions
                      ? 'bg-[#58111A]/8 text-[#58111A] font-semibold hover:bg-[#58111A]/15'
                      : 'text-[#1C2024] hover:bg-[#F2EDE4]/80'
                  }`}
                >
                  <span>{dayNumber}</span>
                  {hasMissions && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-amber-300' : 'bg-[#58111A]'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateStr && (
            <div className="mt-4 pt-3 border-t border-[#EAE4D7] flex items-center justify-between text-xs">
              <span className="text-[#706B62]">
                Filtrando pelo dia: <strong>{selectedDateStr.split('-').reverse().join('/')}</strong>
              </span>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-[#58111A] font-medium hover:underline cursor-pointer"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>

        {/* Missions List Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base sm:text-lg font-semibold text-[#1C2024]">
              {selectedDateStr ? `Missões em ${selectedDateStr.split('-').reverse().join('/')}` : 'Próximas Missões'}
            </h3>
            <span className="text-xs text-[#706B62] font-medium">
              {filteredMissions.length} {filteredMissions.length === 1 ? 'missão' : 'missões'}
            </span>
          </div>

          {filteredMissions.length === 0 ? (
            <div className="liquid-glass rounded-3xl p-8 text-center border border-[#EAE4D7]/80">
              <div className="w-12 h-12 rounded-2xl bg-[#58111A]/8 text-[#58111A] flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h4 className="font-editorial text-base font-semibold text-[#1C2024]">
                Nenhuma missão cadastrada
              </h4>
              <p className="text-xs text-[#706B62] mt-1 max-w-sm mx-auto">
                {selectedDateStr 
                  ? 'Não há missões agendadas para este dia selecionado.' 
                  : 'Cadastre as próximas missões e escale os intercessores do grupo.'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreate(selectedDateStr || undefined)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-[#58111A] bg-[#58111A]/8 hover:bg-[#58111A]/15 border border-[#58111A]/15 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar primeira missão</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMissions.map(mission => {
                const [mY, mM, mD] = mission.date.split('-');
                const formattedDate = `${mD}/${mM}/${mY}`;
                
                const assignedMembers = activeMembers.filter(m => 
                  mission.assignedMemberIds.includes(m.id)
                );

                return (
                  <div
                    key={mission.id}
                    className="liquid-glass rounded-2xl p-5 border border-[#EAE4D7]/80 shadow-xs hover:border-[#D9D1C3] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-[#58111A]/8 text-[#58111A]">
                            <CalendarIcon className="w-3 h-3" />
                            <span>{formattedDate}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#FAF8F5] text-[#706B62] border border-[#EAE4D7]">
                            <Clock className="w-3 h-3" />
                            <span>{mission.time}</span>
                          </span>
                        </div>

                        <h4 className="font-editorial text-base sm:text-lg font-bold text-[#1C2024] leading-snug pt-1">
                          {mission.title}
                        </h4>

                        {mission.description && (
                          <p className="text-xs text-[#606770] leading-relaxed pt-0.5">
                            {mission.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(mission)}
                          title="Editar missão"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-[#58111A] hover:bg-[#58111A]/8 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(mission.id, mission.title)}
                          title="Cancelar missão"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Assigned Members Section */}
                    <div className="mt-4 pt-3 border-t border-[#F2EDE4]/90">
                      <div className="flex items-center justify-between text-xs text-[#706B62] mb-2">
                        <span className="font-semibold flex items-center gap-1.5 text-[#1C2024]">
                          <Users className="w-3.5 h-3.5 text-[#58111A]" />
                          <span>Membros Escalados ({assignedMembers.length}):</span>
                        </span>
                        <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                          <Bell className="w-3 h-3 text-emerald-600" />
                          <span>Notificados no celular</span>
                        </span>
                      </div>

                      {assignedMembers.length === 0 ? (
                        <span className="text-xs text-[#8E877C] italic">
                          Nenhum membro escalado ainda.
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedMembers.map(m => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-white border border-[#D9D1C3] text-[#1C2024] shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>{m.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create / Edit Mission */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-[#EAE4D7] relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#706B62] hover:bg-[#EAE4D7] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#1C2024] mb-1">
              {editingMission ? 'Editar Missão' : 'Nova Missão da Intercessão'}
            </h3>
            <p className="text-xs text-[#706B62] mb-5">
              Os membros escalados receberão uma notificação automática com os detalhes da missão.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                  Título da Missão *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Missa Solene, Vigília do Terço, Cerco de Jericó"
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-[#D9D1C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#58111A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-[#D9D1C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#58111A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-[#D9D1C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#58111A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                  Descrição e Orientações
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Instruções para os intercessores escalados (local, traje, intenções)..."
                  className="w-full p-3 text-xs sm:text-sm bg-white border border-[#D9D1C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#58111A] resize-none"
                />
              </div>

              {/* Participants Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#1C2024]">
                    Participantes Escalados ({assignedMemberIds.length}/{activeMembers.length})
                  </label>
                  <button
                    type="button"
                    onClick={selectAllMembers}
                    className="text-[11px] font-semibold text-[#58111A] hover:underline cursor-pointer"
                  >
                    {assignedMemberIds.length === activeMembers.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#D9D1C3] max-h-48 overflow-y-auto divide-y divide-[#F2EDE4]">
                  {activeMembers.map(member => {
                    const isChecked = assignedMemberIds.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className="py-2 px-1 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5] transition-colors rounded-lg"
                      >
                        <span className="text-xs sm:text-sm font-medium text-[#1C2024]">
                          {member.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMember(member.id)}
                          className="w-4 h-4 rounded text-[#58111A] focus:ring-[#58111A] border-[#D9D1C3] cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE4D7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#706B62] hover:bg-[#EAE4D7] rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#58111A] hover:bg-[#430C13] active:scale-[0.98] rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : editingMission ? 'Atualizar Missão' : 'Agendar Missão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
