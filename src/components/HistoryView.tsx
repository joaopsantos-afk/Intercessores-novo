import React, { useState } from 'react';
import { Week, Intercessor, PrayerRecord } from '../types';
import { formatWeekPeriod, formatDateTimeBRT } from '../utils/date';
import { computeCumulativeMap, calculateOverallTotal } from '../utils/weeks';
import { subscribeToPushNotifications } from '../utils/pushNotifications';
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Calendar, 
  Users, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpDown,
  Bell,
  Sparkles,
  Lock,
  Check
} from 'lucide-react';

interface HistoryViewProps {
  weeks: Week[];
  intercessors: Intercessor[];
  records: PrayerRecord[];
  currentWeekId: string;
  onResetData?: () => Promise<void>;
  onResetToWeek17?: () => Promise<void>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  weeks,
  intercessors,
  records,
  currentWeekId,
  onResetData,
  onResetToWeek17,
}) => {
  const [subTab, setSubTab] = useState<'weeks' | 'members'>('weeks');
  const [chronologicalOrder, setChronologicalOrder] = useState<boolean>(true); // default chronological 1 to 17
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);

  // Compute dynamic cumulative map and overall total (Requirements 9, 10, 11)
  const cumulativeMap = computeCumulativeMap(weeks, records);
  const overallTotal = calculateOverallTotal(weeks, records);

  // Discreet device push notifications state
  const [pushState, setPushState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [pushMessage, setPushMessage] = useState<string>('');

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushMessage('Solicitando permissão...');
    try {
      const res = await subscribeToPushNotifications();
      if (res.success) {
        setPushState('granted');
        setPushMessage('Lembretes ativados com sucesso neste aparelho!');
      } else {
        setPushMessage(res.message);
      }
      setTimeout(() => setPushMessage(''), 5000);
    } catch (e: any) {
      setPushMessage(`Erro: ${e.message}`);
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestPush = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Ave-Marias · Lembrete de Oração', {
        body: 'Que Nossa Senhora abençoe sua intercessão! Lembre-se de registrar suas Ave-Marias.',
      });
      setPushMessage('Alerta de teste enviado!');
      setTimeout(() => setPushMessage(''), 3000);
    } else {
      handleEnablePush();
    }
  };

  // Set of revealed intercessor IDs for privacy (Section 42)
  const [revealedMemberIds, setRevealedMemberIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string) => {
    setRevealedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleRevealAll = () => {
    if (revealedMemberIds.size > 0) {
      setRevealedMemberIds(new Set());
    } else {
      setRevealedMemberIds(new Set(intercessors.map(i => i.id)));
    }
  };

  const toggleExpand = (weekId: string) => {
    setExpandedWeekId(expandedWeekId === weekId ? null : weekId);
  };

  // Sort weeks based on chronological toggle (Section 40)
  const sortedWeeks = [...weeks].sort((a, b) => {
    const numA = a.weekNumber || 0;
    const numB = b.weekNumber || 0;
    return chronologicalOrder ? numA - numB : numB - numA;
  });

  // Calculate cumulative individual totals across weeks with individual records (Section 41 & 45)
  const individualTotalsMap: Record<string, { total: number; weeksCount: number }> = {};
  
  intercessors.forEach(person => {
    individualTotalsMap[person.id] = { total: 0, weeksCount: 0 };
  });

  records.forEach(rec => {
    const parentWeek = weeks.find(w => w.id === rec.weekId);
    if (parentWeek && parentWeek.hasIndividualData) {
      if (!individualTotalsMap[rec.intercessorId]) {
        individualTotalsMap[rec.intercessorId] = { total: 0, weeksCount: 0 };
      }
      individualTotalsMap[rec.intercessorId].total += rec.count;
      individualTotalsMap[rec.intercessorId].weeksCount += 1;
    }
  });

  // Sort intercessors strictly ALPHABETICALLY by name (Section 43: NEVER by count)
  const alphabeticalIntercessors = [...intercessors].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  return (
    <div className="space-y-6">
      {/* 1. TOP HIGHLIGHT: CONTADOR GERAL ACUMULADO NO HISTÓRICO */}
      <div className="liquid-glass rounded-2xl p-5 border border-[#EAE4D7]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#58111A]/8 text-[#58111A] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#706B62]">
              Contador Geral Acumulado
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2024] tabular-nums">
                {overallTotal.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-[#706B62]">Ave-Marias rezadas desde o início</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-[#706B62]">
          <span className="bg-white/80 border border-[#D9D1C3] px-3 py-1.5 rounded-xl font-medium">
            {weeks.length} semanas registradas
          </span>
        </div>
      </div>

      {/* Sub-navigation tabs: Histórico semanal / Ave-Marias por intercessor */}
      <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('weeks')}
            className={`h-9 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer touch-manipulation ${
              subTab === 'weeks'
                ? 'bg-[#58111A] text-white shadow-xs'
                : 'text-[#606770] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 active:bg-[#EAE4D7]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Histórico semanal</span>
          </button>

          <button
            onClick={() => setSubTab('members')}
            className={`h-9 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer touch-manipulation ${
              subTab === 'members'
                ? 'bg-[#58111A] text-white shadow-xs'
                : 'text-[#606770] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 active:bg-[#EAE4D7]'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Por intercessor</span>
          </button>
        </div>

        {subTab === 'weeks' && (
          <button
            onClick={() => setChronologicalOrder(!chronologicalOrder)}
            className="text-xs text-[#706B62] hover:text-[#1C2024] flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#F3EFE7] transition-colors"
            title="Alternar ordem de exibição"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {chronologicalOrder ? 'Cronológica (Semana 1 → Recentes)' : 'Mais recentes primeiro'}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: HISTÓRICO SEMANAL (Requirement 11) */}
      {subTab === 'weeks' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-4 sm:p-5 text-xs text-[#706B62] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#233529] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#1C2024] block mb-0.5">
                  Registro oficial com fechamento permanente de cada semana
                </span>
                <span>
                  Cada semana possui início, término, data de fechamento, total individual e acumulado oficial. As semanas fechadas permanecem imutáveis.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {sortedWeeks.map((week) => {
              const isCurrent = week.id === currentWeekId || !week.closed;
              const isExpanded = expandedWeekId === week.id;
              const weekRecords = records.filter(r => r.weekId === week.id);
              
              const totalPrayed = week.hasIndividualData
                ? weekRecords.reduce((acc, r) => acc + (r.count || 0), 0)
                : (week.fixedTotalCount || 0);

              const cumulativeUntilWeek = cumulativeMap.get(week.id) || totalPrayed;
              const target = week.totalTarget;
              const percent = target > 0 ? Math.round((totalPrayed / target) * 100) : 0;
              const period = week.startDate && week.endDate
                ? formatWeekPeriod(week.startDate, week.endDate)
                : 'Período não informado';

              return (
                <div
                  key={week.id}
                  className={`bg-white rounded-2xl border transition-all ${
                    isCurrent ? 'border-[#58111A]/40 ring-1 ring-[#58111A]/10 shadow-sm' : 'border-[#E7E2D9]'
                  } overflow-hidden shadow-xs`}
                >
                  {/* Clickable Header */}
                  <div
                    onClick={() => week.hasIndividualData && toggleExpand(week.id)}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      week.hasIndividualData ? 'cursor-pointer hover:bg-[#FAF8F5]' : 'cursor-default'
                    } transition-colors`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-editorial text-base sm:text-lg font-bold text-[#1C2024]">
                          Semana {week.weekNumber}
                        </span>
                        <span className="text-xs text-[#706B62]">
                          ({period})
                        </span>
                        {isCurrent ? (
                          <span className="text-[11px] font-semibold text-[#58111A] bg-[#58111A]/10 px-2.5 py-0.5 rounded-full border border-[#58111A]/15">
                            Semana Atual
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Fechada ✓
                          </span>
                        )}
                      </div>

                      {/* Requirement 11 Details: Closure time & Cumulative Total */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#706B62] mt-1.5">
                        <span className="flex items-center gap-1 font-medium text-[#1C2024]">
                          <Clock className="w-3.5 h-3.5 text-[#58111A]" />
                          <span>
                            {week.closed
                              ? `Fechamento: ${week.closedAt ? formatDateTimeBRT(week.closedAt) : 'Segunda-feira 20:00 (oficial)'}`
                              : 'Fechamento previsto: Segunda-feira às 20:00 (em andamento)'}
                          </span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-800">
                          Acumulado até aqui: {cumulativeUntilWeek.toLocaleString('pt-BR')} Ave-Marias
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-editorial font-bold text-[#1C2024] tabular-nums">
                          {totalPrayed.toLocaleString('pt-BR')}{' '}
                          <span className="text-xs font-normal text-[#706B62]">
                            / {target.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#706B62]">
                          {percent}% da meta semanal
                        </div>
                      </div>

                      {week.hasIndividualData ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#706B62] hover:bg-[#EAE4D7] transition-colors shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      ) : (
                        <div className="w-8 h-8 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Individual Breakdown (only when individual data exists) */}
                  {isExpanded && week.hasIndividualData && (
                    <div className="border-t border-[#F2EDE4] bg-[#FAF8F5] p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-semibold text-[#1C2024] uppercase tracking-wider">
                          Registros individuais · Semana {week.weekNumber}
                        </h4>
                        <span className="text-xs text-[#706B62]">
                          Total somado: {totalPrayed.toLocaleString('pt-BR')} Ave-Marias
                        </span>
                      </div>

                      {weekRecords.length === 0 ? (
                        <p className="text-xs text-[#8E877C] italic p-3 bg-white rounded-xl border border-[#EAE4D7]">
                          Nenhum registro individual informado para esta semana ainda.
                        </p>
                      ) : (
                        <div className="bg-white rounded-xl border border-[#E7E2D9] divide-y divide-[#F2EDE4] overflow-hidden">
                          {/* Show in alphabetical order of intercessors */}
                          {alphabeticalIntercessors
                            .map(person => {
                              const rec = weekRecords.find(r => r.intercessorId === person.id);
                              if (!rec) return null;
                              return { person, rec };
                            })
                            .filter((item): item is { person: Intercessor; rec: PrayerRecord } => item !== null)
                            .map(({ person, rec }) => (
                              <div key={person.id} className="px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[#1C2024]">{person.name}</span>
                                  {person.isHistoricalOnly && (
                                    <span className="text-[10px] text-[#706B62] bg-[#F2EDE4] px-1.5 py-0.5 rounded">
                                      Histórico
                                    </span>
                                  )}
                                </div>
                                <div className="tabular-nums font-medium text-[#1C2024]">
                                  {rec.count.toLocaleString('pt-BR')} Ave-Marias
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Note for weeks without individual data */}
                  {!week.hasIndividualData && (
                    <div className="border-t border-[#F2EDE4] bg-[#FAF8F5] px-4 py-2 text-[11px] text-[#706B62] italic">
                      Dados individuais não disponíveis para esta semana (apenas o total geral de {totalPrayed.toLocaleString('pt-BR')} Ave-Marias está registrado no histórico).
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AVE-MARIAS POR INTERCESSOR (Sections 41, 42, 43, 44, 45) */}
      {subTab === 'members' && (
        <div className="space-y-5">
          {/* Explanation Box (Sections 41 & 45) */}
          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-4 sm:p-5 text-xs text-[#706B62] leading-relaxed space-y-2">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#233529] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#1C2024] block mb-1">
                  Ave-Marias acumuladas por intercessor
                </span>
                <span>
                  O total acumulado considera <strong>exclusivamente as semanas em que existem dados individuais disponíveis</strong> (Semanas 1, 2, 3, 5, 16 e posteriores). As Semanas 4 e 6 a 15 possuem apenas o total geral conhecido e não são distribuídas entre os intercessores.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <Eye className="w-4 h-4 text-[#233529] shrink-0 mt-0.5" />
              <span>
                <strong>Privacidade e Fraternidade:</strong> Os números ficam ocultos por padrão para que cada intercessor possa consultar reservadamente suas próprias Ave-Marias. A lista é organizada em <strong>ordem alfabética</strong>, sem qualquer ranking ou disputa.
              </span>
            </div>
          </div>

          {/* Privacy Controls Bar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[#1C2024] uppercase tracking-wider">
              Intercessores ({alphabeticalIntercessors.length})
            </span>
            <button
              onClick={toggleRevealAll}
              className="text-xs text-[#233529] hover:underline flex items-center gap-1 font-medium"
            >
              {revealedMemberIds.size > 0 ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ocultar todos</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Revelar todos</span>
                </>
              )}
            </button>
          </div>

          {/* Intercessors List (Alphabetical, Privacy Toggle) (Section 42 & 43) */}
          <div className="bg-white rounded-2xl border border-[#E7E2D9] divide-y divide-[#F2EDE4] overflow-hidden shadow-xs">
            {alphabeticalIntercessors.map((person) => {
              const isRevealed = revealedMemberIds.has(person.id);
              const stats = individualTotalsMap[person.id] || { total: 0, weeksCount: 0 };

              return (
                <div
                  key={person.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                >
                  {/* Pure Name & status - without initial circle */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1C2024] text-sm sm:text-base truncate">
                        {person.name}
                      </span>
                      {person.isHistoricalOnly ? (
                        <span className="text-[10px] font-medium text-[#706B62] bg-[#F2EDE4] px-2 py-0.5 rounded-md shrink-0">
                          Histórico
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-800 bg-[#E8F2E8] px-2 py-0.5 rounded-md shrink-0">
                          Ativo
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#706B62] mt-0.5 truncate">
                      {stats.weeksCount} {stats.weeksCount === 1 ? 'semana registrada' : 'semanas registradas'}
                    </div>
                  </div>

                  {/* Count & Privacy Eye Button (Section 42) */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      {isRevealed ? (
                        <div className="font-editorial text-sm sm:text-base font-semibold text-[#1C2024] tabular-nums animate-in fade-in duration-150">
                          {stats.total.toLocaleString('pt-BR')}{' '}
                          <span className="text-[11px] font-normal text-[#706B62]">Ave-Marias</span>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm font-mono text-[#8E877C] tracking-widest select-none">
                          ••••••
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleReveal(person.id)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[#706B62] hover:text-[#58111A] hover:bg-[#58111A]/8 active:bg-[#58111A]/15 transition-colors shrink-0 cursor-pointer touch-manipulation"
                      title={isRevealed ? 'Ocultar total' : 'Revelar total'}
                      aria-label={`Alternar visibilidade do total de ${person.name}`}
                    >
                      {isRevealed ? (
                        <EyeOff className="w-4 h-4 text-[#706B62]" />
                      ) : (
                        <Eye className="w-4 h-4 text-[#58111A]" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Discreet Notifications Bar */}
      <div className="pt-4 border-t border-[#EAE4D7]/80">
        <div className="liquid-glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#58111A]/8 text-[#58111A] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-[#1C2024]">
                  Lembretes de Oração
                </span>
                {pushState === 'granted' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Ativos neste aparelho ✓
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-stone-200 text-stone-700">
                    Desativados
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#706B62] mt-0.5">
                Receba lembretes semanais às segundas-feiras (12h e 18h) diretamente no seu celular ou computador.
              </p>
              {pushMessage && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1 animate-in fade-in">
                  {pushMessage}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {pushState !== 'granted' ? (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="h-8.5 px-3.5 text-xs font-semibold text-[#58111A] hover:text-white bg-[#58111A]/8 hover:bg-[#58111A] active:scale-[0.97] border border-[#58111A]/15 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation disabled:opacity-50"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{pushLoading ? 'Ativando...' : 'Ativar lembretes no aparelho'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestPush}
                className="h-8.5 px-3 text-xs font-medium text-[#706B62] hover:text-[#1C2024] bg-white border border-[#D9D1C3] rounded-xl transition-all cursor-pointer touch-manipulation hover:bg-[#FAF8F5]"
              >
                Testar alerta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
