import React, { useState } from 'react';
import { SpiritualDirection, Week } from '../types';
import { formatWeekPeriod } from '../utils/date';
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Calendar, 
  Clock, 
  X, 
  AlertCircle,
  Quote,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DirectionsViewProps {
  directions: SpiritualDirection[];
  currentWeek: Week;
  weeks: Week[];
  onCreateDirection: (data: Omit<SpiritualDirection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateDirection: (id: string, data: Partial<SpiritualDirection>) => Promise<void>;
  onDeleteDirection: (id: string) => Promise<void>;
}

export const DirectionsView: React.FC<DirectionsViewProps> = ({
  directions,
  currentWeek,
  weeks,
  onCreateDirection,
  onUpdateDirection,
  onDeleteDirection,
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDirection, setEditingDirection] = useState<SpiritualDirection | null>(null);

  // Form Fields
  const [selectedWeekId, setSelectedWeekId] = useState<string>(currentWeek.id);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Expanded directions accordion state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Find the direction for the CURRENT week
  const currentDirection = directions.find(d => d.weekId === currentWeek.id) || directions[0];
  const previousDirections = directions.filter(d => d.id !== currentDirection?.id);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDirection(null);
    setSelectedWeekId(currentWeek.id);
    setTitle('');
    setContent('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dir: SpiritualDirection) => {
    setEditingDirection(dir);
    setSelectedWeekId(dir.weekId);
    setTitle(dir.title);
    setContent(dir.content);
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Por favor, preencha o título e o conteúdo do direcionamento.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const targetWeek = weeks.find(w => w.id === selectedWeekId) || currentWeek;
    const periodLabel = `Semana ${targetWeek.weekNumber} (${formatWeekPeriod(targetWeek.startDate, targetWeek.endDate)})`;

    try {
      if (editingDirection) {
        await onUpdateDirection(editingDirection.id, {
          title: title.trim(),
          content: content.trim(),
        });
      } else {
        await onCreateDirection({
          weekId: targetWeek.id,
          weekNumber: targetWeek.weekNumber,
          periodLabel,
          title: title.trim(),
          content: content.trim(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar o direcionamento espiritual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id: string, dirTitle: string) => {
    if (!confirm(`Deseja realmente excluir o direcionamento "${dirTitle}"?`)) {
      return;
    }
    await onDeleteDirection(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#1C2024] tracking-tight">
            Direcionamento da Intercessão
          </h2>
          <p className="text-xs sm:text-sm text-[#706B62] mt-0.5">
            Orientação espiritual, tema de oração e meditação para os intercessores nesta semana.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-[#58111A] hover:bg-[#430C13] active:scale-[0.98] rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer touch-manipulation self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Direcionamento</span>
        </button>
      </div>

      {/* Featured Current Week Direction */}
      {currentDirection ? (
        <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8 border border-[#EAE4D7]/90 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-xl bg-[#58111A] text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Direcionamento Atual · Semana {currentDirection.weekNumber}</span>
              </span>
              <span className="text-xs text-[#706B62] font-medium hidden sm:inline">
                {currentDirection.periodLabel}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(currentDirection)}
                title="Editar direcionamento"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-[#58111A] hover:bg-[#58111A]/8 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(currentDirection.id, currentDirection.title)}
                title="Excluir direcionamento"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2024] tracking-tight leading-snug mb-4">
            {currentDirection.title}
          </h3>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5]/80 border border-[#EAE4D7] relative text-sm sm:text-base text-[#2C2724] font-serif leading-relaxed whitespace-pre-wrap shadow-2xs">
            <Quote className="w-8 h-8 text-[#58111A]/10 absolute top-4 right-4 pointer-events-none" />
            {currentDirection.content}
          </div>

          <p className="text-[11px] text-[#8E877C] mt-3">
            * Este direcionamento orienta os mistérios e intenções oferecidos por cada intercessor nas Ave-Marias da semana.
          </p>
        </div>
      ) : (
        <div className="liquid-glass rounded-3xl p-8 text-center border border-[#EAE4D7]/80">
          <BookOpen className="w-8 h-8 text-[#58111A] mx-auto mb-2 opacity-80" />
          <h4 className="font-editorial text-lg font-semibold text-[#1C2024]">
            Nenhum direcionamento registrado para esta semana
          </h4>
          <p className="text-xs text-[#706B62] mt-1 max-w-sm mx-auto">
            Cadastre a orientação e intenção da semana para que todo o grupo possa rezar em unidade de espírito.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#58111A] rounded-xl cursor-pointer"
          >
            Cadastrar Direcionamento
          </button>
        </div>
      )}

      {/* Archive / Previous Directions Organized by Week */}
      {previousDirections.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-2">
            <h4 className="font-editorial text-lg font-semibold text-[#1C2024]">
              Direcionamentos Anteriores
            </h4>
            <span className="text-xs text-[#706B62]">
              {previousDirections.length} arquivados
            </span>
          </div>

          <div className="space-y-3">
            {previousDirections.map(dir => {
              const isExpanded = expandedIds.has(dir.id);
              return (
                <div
                  key={dir.id}
                  className="liquid-glass rounded-2xl p-5 border border-[#EAE4D7]/80 hover:border-[#D9D1C3] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      onClick={() => toggleExpand(dir.id)}
                      className="cursor-pointer flex-1 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#58111A] bg-[#58111A]/8 px-2 py-0.5 rounded-md">
                          Semana {dir.weekNumber}
                        </span>
                        <span className="text-xs text-[#706B62]">
                          {dir.periodLabel}
                        </span>
                      </div>
                      <h5 className="font-editorial text-base sm:text-lg font-bold text-[#1C2024] hover:text-[#58111A] transition-colors">
                        {dir.title}
                      </h5>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(dir)}
                        title="Editar"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-[#58111A] hover:bg-[#58111A]/8 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dir.id, dir.title)}
                        title="Excluir"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleExpand(dir.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#706B62] hover:bg-[#EAE4D7] transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#F2EDE4] text-xs sm:text-sm text-[#2C2724] font-serif leading-relaxed whitespace-pre-wrap animate-in fade-in">
                      {dir.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
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
              {editingDirection ? 'Editar Direcionamento' : 'Novo Direcionamento Espiritual'}
            </h3>
            <p className="text-xs text-[#706B62] mb-5">
              Escreva o direcionamento da semana para manter o grupo em oração unânime.
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
                  Semana Correspondente *
                </label>
                <select
                  value={selectedWeekId}
                  onChange={e => setSelectedWeekId(e.target.value)}
                  disabled={Boolean(editingDirection)}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-[#D9D1C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#58111A]"
                >
                  {weeks.map(w => (
                    <option key={w.id} value={w.id}>
                      Semana {w.weekNumber} ({formatWeekPeriod(w.startDate, w.endDate)}) {w.id === currentWeek.id ? '— (Semana Atual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                  Título do Direcionamento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Fidelidade no Oculto, Oração pelas Vocações"
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-[#D9D1C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#58111A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C2024] mb-1">
                  Texto Completo do Direcionamento *
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Escreva a palavra, passagem bíblica, intenção ou orientação espiritual para o grupo..."
                  className="w-full p-3 text-xs sm:text-sm bg-white border border-[#D9D1C3] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#58111A] resize-none"
                />
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
                  {isSubmitting ? 'Salvando...' : editingDirection ? 'Salvar Alterações' : 'Publicar Direcionamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
