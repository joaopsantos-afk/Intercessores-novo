import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Intercessor, PrayerRecord, Week } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  intercessors: Intercessor[];
  currentWeek: Week;
  records: PrayerRecord[];
  initialIntercessorId?: string;
  onSave: (intercessorId: string, count: number) => Promise<void>;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  intercessors,
  currentWeek,
  records,
  initialIntercessorId,
  onSave,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [countInput, setCountInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Set default intercessor when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const defaultId = initialIntercessorId || intercessors[0]?.id || '';
      setSelectedId(defaultId);

      // Pre-fill existing count if any
      const existing = records.find(r => r.weekId === currentWeek.id && r.intercessorId === defaultId);
      if (existing !== undefined) {
        setCountInput(String(existing.count));
      } else {
        setCountInput('');
      }
    }
  }, [isOpen, initialIntercessorId, currentWeek.id, intercessors, records]);

  const handleIntercessorChange = (id: string) => {
    setSelectedId(id);
    setErrorMsg('');
    const existing = records.find(r => r.weekId === currentWeek.id && r.intercessorId === id);
    if (existing !== undefined) {
      setCountInput(String(existing.count));
    } else {
      setCountInput('');
    }
  };

  const handleQuickAdd = (amount: number) => {
    const current = parseInt(countInput, 10) || 0;
    setCountInput(String(current + amount));
    setErrorMsg('');
  };

  const handleSetExact = (amount: number) => {
    setCountInput(String(amount));
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedId) {
      setErrorMsg('Por favor, selecione quem está registrando.');
      return;
    }

    if (countInput.trim() === '') {
      setErrorMsg('Informe a quantidade de Ave-Marias (digite 0 se não rezou nenhuma).');
      return;
    }

    const parsed = Number(countInput);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      setErrorMsg('A quantidade deve ser um número inteiro igual ou maior que zero (0, 1, 2...).');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(selectedId, parsed);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível salvar agora. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentRecord = records.find(r => r.weekId === currentWeek.id && r.intercessorId === selectedId);
  const selectedPerson = intercessors.find(i => i.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md liquid-glass-modal rounded-[32px] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Specular Top Rim Reflection (Like the Liquid Glass reference) */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-90" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/60">
          <div>
            <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C2024] tracking-tight">
              Registrar Ave-Marias
            </h2>
            <p className="text-xs text-[#706B62] mt-0.5 font-medium">
              Atualização para a semana atual
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#706B62] hover:text-[#1C2024] hover:bg-white/60 active:bg-white/80 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
          {/* Select Intercessor */}
          <div>
            <label className="block text-xs font-semibold text-[#1C2024] uppercase tracking-wider mb-1.5">
              Intercessor
            </label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => handleIntercessorChange(e.target.value)}
                className="w-full h-12 px-4 liquid-glass-input rounded-2xl text-sm font-semibold text-[#1C2024] focus:outline-none focus:ring-2 focus:ring-[#58111A]/20 focus:border-[#58111A] transition-all cursor-pointer"
              >
                {intercessors.filter(i => i.active).map(i => {
                  const rec = records.find(r => r.weekId === currentWeek.id && r.intercessorId === i.id);
                  return (
                    <option key={i.id} value={i.id} className="text-[#1C2024] bg-white">
                      {i.name} {rec !== undefined ? `(Atual: ${rec.count})` : '(Pendente)'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Current Status Note - Liquid Glass Subcard */}
          <div className="text-xs text-[#706B62] liquid-glass-subcard p-4 rounded-2xl leading-relaxed">
            {currentRecord !== undefined ? (
              <p>
                <strong className="text-[#1C2024] font-semibold">{selectedPerson?.name}</strong> já registrou{' '}
                <strong className="text-[#58111A] font-bold">{currentRecord.count} Ave-Marias</strong> esta semana.
                Ao salvar um novo valor, ele <strong>substituirá</strong> o anterior.
              </p>
            ) : (
              <p>
                <strong className="text-[#1C2024] font-semibold">{selectedPerson?.name}</strong> ainda não registrou esta semana.
                Meta individual sugerida: <strong className="text-[#58111A] font-bold">140 Ave-Marias</strong>.
              </p>
            )}
          </div>

          {/* Input field */}
          <div>
            <label className="block text-xs font-semibold text-[#1C2024] uppercase tracking-wider mb-1.5">
              Quantidade de Ave-Marias rezadas
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Ex: 140 (ou 0)"
                value={countInput}
                onChange={(e) => {
                  setCountInput(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full h-15 px-4 text-3xl font-bold font-editorial text-[#1C2024] tabular-nums liquid-glass-input rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#58111A]/20 focus:border-[#58111A] transition-all"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#706B62] font-semibold pointer-events-none">
                Ave-Marias
              </span>
            </div>
            <p className="text-[11px] text-[#706B62] mt-1.5">
              * Digite <strong className="text-[#1C2024]">0</strong> caso não tenha conseguido rezar, para constar como respondido.
            </p>
          </div>

          {/* Quick Increment Helpers */}
          <div>
            <span className="block text-[11px] font-semibold text-[#706B62] mb-1.5">
              Atalhos rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSetExact(140)}
                className="h-8.5 px-3.5 text-xs font-bold bg-[#58111A]/10 hover:bg-[#58111A]/18 text-[#58111A] border border-[#58111A]/20 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Meta (140)
              </button>
              <button
                type="button"
                onClick={() => handleSetExact(0)}
                className="h-8.5 px-3.5 text-xs font-semibold liquid-glass-subcard hover:bg-white/80 text-[#1C2024] rounded-xl transition-all cursor-pointer active:scale-95"
              >
                0 (Zero)
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="h-8.5 px-3 text-xs font-semibold liquid-glass-subcard hover:bg-white/80 text-[#1C2024] rounded-xl transition-all cursor-pointer active:scale-95"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(50)}
                className="h-8.5 px-3 text-xs font-semibold liquid-glass-subcard hover:bg-white/80 text-[#1C2024] rounded-xl transition-all cursor-pointer active:scale-95"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(70)}
                className="h-8.5 px-3 text-xs font-semibold liquid-glass-subcard hover:bg-white/80 text-[#1C2024] rounded-xl transition-all cursor-pointer active:scale-95"
              >
                +70 (1 Terço)
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50/90 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 px-4 text-xs sm:text-sm font-semibold text-[#706B62] hover:text-[#1C2024] rounded-xl hover:bg-white/50 active:bg-white/80 transition-all cursor-pointer touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#58111A] to-[#6E1621] hover:from-[#430C13] hover:to-[#58111A] active:scale-[0.98] rounded-xl transition-all shadow-md shadow-[#58111A]/20 flex items-center gap-2 cursor-pointer touch-manipulation disabled:opacity-50"
            >
              {isSaving ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-rose-200" />
                  <span>Confirmar registro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
