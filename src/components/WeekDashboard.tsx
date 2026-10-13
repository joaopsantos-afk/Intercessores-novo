import React, { useState } from 'react';
import { Week, Intercessor, PrayerRecord } from '../types';
import { formatWeekPeriod, formatDateTimeBRT } from '../utils/date';
import { calculateOverallTotal } from '../utils/weeks';
import { 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  Check, 
  Sparkles, 
  Calendar, 
  RotateCcw, 
  ArrowRight, 
  AlertTriangle,
  X
} from 'lucide-react';

interface WeekDashboardProps {
  currentWeek: Week;
  weeks: Week[];
  intercessors: Intercessor[];
  records: PrayerRecord[];
  onOpenRegisterFor: (intercessorId?: string) => void;
  onOpenAddMember: () => void;
  onCloseWeek?: () => Promise<void>;
  onResetToWeek17?: () => Promise<void>;
}

export const WeekDashboard: React.FC<WeekDashboardProps> = ({
  currentWeek,
  weeks,
  intercessors,
  records,
  onOpenRegisterFor,
  onOpenAddMember,
  onCloseWeek,
  onResetToWeek17,
}) => {
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const activeIntercessors = intercessors.filter(i => i.active);
  const weekRecords = records.filter(r => r.weekId === currentWeek.id);
  
  // Current Week Totals
  const totalPrayed = weekRecords.reduce((acc, r) => acc + (r.count || 0), 0);
  const totalTarget = activeIntercessors.length * 140;
  const progressPercent = totalTarget > 0 ? Math.round((totalPrayed / totalTarget) * 100) : 0;

  // Global Dynamic Accumulated Counter across ALL weeks (Requirements 9 & 10)
  const overallTotal = calculateOverallTotal(weeks, records);

  const respondedMembers = activeIntercessors.filter(i => weekRecords.some(r => r.intercessorId === i.id));
  const pendingMembers = activeIntercessors.filter(i => !weekRecords.some(r => r.intercessorId === i.id));
  const allAnswered = activeIntercessors.length > 0 && pendingMembers.length === 0;

  const periodFormatted = formatWeekPeriod(currentWeek.startDate, currentWeek.endDate);

  const handleConfirmClose = async () => {
    if (!onCloseWeek) return;
    setIsClosing(true);
    try {
      await onCloseWeek();
      setIsCloseModalOpen(false);
    } finally {
      setIsClosing(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!onResetToWeek17) return;
    if (!confirm('Deseja realmente voltar para a Semana 17 e reabrir o ciclo de teste?')) return;
    setIsResetting(true);
    try {
      await onResetToWeek17();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. CONTADOR GERAL DE AVE-MARIAS (Requirements 9 & 10: Dynamic & Cumulative) */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#4A0D15] via-[#58111A] to-[#6C1522] text-white shadow-lg border border-[#7A1F2D]/50 transition-all">
        {/* Soft decorative golden aura */}
        <div 
          aria-hidden="true" 
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/15 blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-amber-400/20 text-amber-200 border border-amber-300/30 shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Contador Geral Acumulado</span>
              </span>
              <span className="text-[11px] text-white/70 hidden sm:inline">
                · Atualização automática em tempo real
              </span>
            </div>

            <div className="pt-1 flex items-baseline gap-2">
              <span className="font-editorial text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white tabular-nums">
                {overallTotal.toLocaleString('pt-BR')}
              </span>
              <span className="text-base sm:text-xl text-amber-200/90 font-editorial">
                Ave-Marias
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed pt-0.5">
              Total rezado desde o início da Intercessão, somando todas as semanas concluídas (Semanas 1 a {Math.max(...weeks.map(w => w.weekNumber))}) e a semana atual.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 pt-2 md:pt-0">
            <div className="text-right px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
              <div className="text-[11px] text-white/75 font-medium">Semanas no Histórico</div>
              <div className="text-lg font-bold text-white font-editorial">{weeks.length} semanas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner: All Answered Milestone Celebration */}
      {allAnswered && (
        <div className="p-4 sm:p-5 liquid-glass rounded-2xl flex items-center justify-between gap-4 transition-all border border-emerald-300/60 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-editorial text-base sm:text-lg font-semibold text-[#1C2024]">
                Todos os {activeIntercessors.length} intercessores responderam!
              </h3>
              <p className="text-xs text-[#526354]">
                Total de {totalPrayed.toLocaleString('pt-BR')} Ave-Marias registradas na Semana {currentWeek.weekNumber}. 🙏
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-3.5 py-1.5 rounded-xl">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Semana concluída</span>
          </div>
        </div>
      )}

      {/* 2. CARD DA SEMANA ATUAL */}
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all">
        {/* Context metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#706B62] mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#58111A] tracking-wider uppercase text-[11px] bg-[#58111A]/8 px-2.5 py-1 rounded-lg">
              Semana {currentWeek.weekNumber} · Atual
            </span>
            <span className="font-medium text-[#1C2024] text-xs sm:text-sm">
              {periodFormatted}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8E877C]">
            <Clock className="w-3 h-3 text-[#58111A]" />
            <span>Fechamento oficial: Segunda-feira às 20:00 (Brasília)</span>
          </div>
        </div>

        {/* Big numbers (Clean & Informative) */}
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-4xl sm:text-5xl md:text-6xl font-editorial font-medium text-[#1C2024] tracking-tight tabular-nums">
              {totalPrayed.toLocaleString('pt-BR')}
            </span>
            <span className="text-xl sm:text-2xl text-[#8E877C] font-editorial tabular-nums">
              / {totalTarget.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs sm:text-sm font-medium text-[#706B62] ml-1">
              Ave-Marias nesta semana
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#706B62] mt-1.5 font-medium">
            {progressPercent}% da meta semanal {progressPercent > 100 && '— superada com louvor! 🎉'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="w-full h-3 bg-[#F2EDE4]/80 rounded-full overflow-hidden p-0.5 border border-[#EAE4D7]/80">
            <div
              className="h-full bg-gradient-to-r from-[#58111A] via-[#731320] to-[#801B28] rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Unboxed Metadata Stats */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 pt-4 border-t border-[#F2EDE4]/80 text-xs text-[#706B62]">
          <div className="flex items-center gap-1.5 font-medium text-[#1C2024]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{respondedMembers.length} de {activeIntercessors.length} responderam</span>
          </div>
          <span aria-hidden="true" className="text-[#D9D1C3]">·</span>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {pendingMembers.length === 0
                ? 'Todos responderam'
                : `${pendingMembers.length} ${pendingMembers.length === 1 ? 'pendente' : 'pendentes'}`}
            </span>
          </div>
          <span aria-hidden="true" className="text-[#D9D1C3]">·</span>
          <span>Meta: 140 / intercessor</span>
        </div>
      </div>

      {/* 3. FECHAMENTO SEMANAL ADMINISTRATIVO (Requirements 7 & 8) */}
      <div className="liquid-glass rounded-2xl p-4 sm:p-5 border border-[#EAE4D7]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-[#1C2024]">
              Fechamento Semanal (Segunda-feira 20h)
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#58111A]/8 text-[#58111A]">
              Semana {currentWeek.weekNumber} ativa
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#706B62]">
            O fechamento encerra permanentemente a Semana {currentWeek.weekNumber}, congela o total rezado e abre a Semana {currentWeek.weekNumber + 1} zerada.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {onCloseWeek && (
            <button
              type="button"
              onClick={() => setIsCloseModalOpen(true)}
              className="h-9 px-3.5 text-xs font-semibold text-white bg-[#58111A] hover:bg-[#430C13] active:scale-[0.97] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <span>Realizar Fechamento</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentWeek.weekNumber > 17 && onResetToWeek17 && (
            <button
              type="button"
              onClick={handleConfirmReset}
              disabled={isResetting}
              title="Voltar para a Semana 17 para novos testes"
              className="h-9 px-3 text-xs font-medium text-[#706B62] hover:text-[#58111A] hover:bg-white border border-[#D9D1C3] rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Voltar à Sem. 17</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. LISTA DE INTERCESSORES DO GRUPO (Com Maria Alice unificada) */}
      <div className="liquid-glass rounded-3xl overflow-hidden transition-all">
        <div className="px-5 py-4 border-b border-[#EFEAE1]/80 bg-[#FBF9F5]/40 flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-base sm:text-lg font-semibold text-[#1C2024]">
              Intercessores do Grupo
            </h2>
            <p className="text-xs text-[#706B62]">
              Registros individuais da Semana {currentWeek.weekNumber} ({activeIntercessors.length} membros ativos)
            </p>
          </div>
          
          <button
            onClick={onOpenAddMember}
            className="text-xs font-semibold text-[#58111A] hover:text-[#430C13] active:scale-[0.97] bg-[#58111A]/6 hover:bg-[#58111A]/10 border border-[#58111A]/15 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Adicionar membro</span>
          </button>
        </div>

        {/* List items - Pure Names without letter circles */}
        <div className="divide-y divide-[#F2EDE4]/70">
          {activeIntercessors.map((person) => {
            const record = weekRecords.find(r => r.intercessorId === person.id);
            const hasAnswered = record !== undefined;
            const count = hasAnswered ? record.count : null;
            const personTarget = 140;
            const personPercent = count !== null ? Math.round((count / personTarget) * 100) : 0;

            return (
              <div
                key={person.id}
                onClick={() => onOpenRegisterFor(person.id)}
                className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-white/50 active:bg-white/80 transition-colors cursor-pointer group"
              >
                {/* Person details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1C2024] text-sm group-hover:text-[#58111A] transition-colors truncate">
                      {person.name}
                    </span>
                    {hasAnswered ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Atualizado</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 shrink-0">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Aguardando</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#706B62] mt-0.5 truncate">
                    {hasAnswered && record.updatedAt ? (
                      <span>Atualizado em {formatDateTimeBRT(record.updatedAt)}</span>
                    ) : (
                      <span>Ainda não registrou na Semana {currentWeek.weekNumber}</span>
                    )}
                  </div>
                </div>

                {/* Person metrics & action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {hasAnswered ? (
                      <div className="tabular-nums">
                        <span className="text-sm sm:text-base font-bold text-[#1C2024]">
                          {count}
                        </span>
                        <span className="text-[11px] text-[#706B62]"> / 140</span>
                        <div className="w-16 sm:w-24 h-1.5 bg-[#F2EDE4] rounded-full overflow-hidden mt-1 ml-auto">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              (count ?? 0) >= 140 ? 'bg-emerald-600' : 'bg-[#58111A]'
                            }`}
                            style={{ width: `${Math.min(personPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#8E877C] italic">
                        Pendente
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRegisterFor(person.id);
                    }}
                    className="h-8.5 px-3.5 text-xs font-semibold rounded-xl text-white bg-[#58111A] hover:bg-[#430C13] active:bg-[#32080D] active:scale-[0.96] shadow-xs hover:shadow-sm transition-all flex items-center justify-center shrink-0 cursor-pointer touch-manipulation"
                  >
                    Registrar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR WEEK CLOSURE */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-[#EAE4D7] relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCloseModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#706B62] hover:bg-[#EAE4D7] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#58111A]/10 text-[#58111A] flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>

            <h3 className="font-editorial text-xl font-bold text-[#1C2024] mb-1">
              Encerrar Semana {currentWeek.weekNumber}?
            </h3>
            <p className="text-xs text-[#706B62] leading-relaxed mb-4">
              Esta ação segue as regras oficiais da Intercessão para o fechamento semanal de segunda-feira às 20h:
            </p>

            <div className="bg-white rounded-2xl p-4 border border-[#EAE4D7] space-y-2 text-xs text-[#1C2024] mb-5">
              <div className="flex justify-between">
                <span className="text-[#706B62]">Semana a encerrar:</span>
                <span className="font-bold">Semana {currentWeek.weekNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#706B62]">Total rezado na semana:</span>
                <span className="font-bold text-[#58111A]">{totalPrayed.toLocaleString('pt-BR')} Ave-Marias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#706B62]">Total geral acumulado:</span>
                <span className="font-bold text-emerald-700">{overallTotal.toLocaleString('pt-BR')} Ave-Marias</span>
              </div>
              <div className="pt-2 border-t border-[#F2EDE4] flex justify-between">
                <span className="text-[#706B62]">Próxima semana a iniciar:</span>
                <span className="font-bold text-[#1C2024]">Semana {currentWeek.weekNumber + 1} (Zerada)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="flex-1 h-10 text-xs font-semibold text-[#706B62] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isClosing}
                className="flex-1 h-10 text-xs font-semibold text-white bg-[#58111A] hover:bg-[#430C13] active:scale-[0.98] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isClosing ? 'Encerrando...' : 'Confirmar Fechamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
