import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (name: string) => Promise<void>;
  existingNames: string[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onAddMember,
  existingNames,
}) => {
  const [name, setName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMsg('Informe o primeiro nome ou apelido do intercessor.');
      return;
    }

    if (trimmed.length > 50) {
      setErrorMsg('O nome deve ter no máximo 50 caracteres.');
      return;
    }

    // Check duplicate
    const isDuplicate = existingNames.some(
      n => n.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMsg(`Já existe um intercessor cadastrado com o nome "${trimmed}". Escolha um nome ou apelido diferenciado.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddMember(trimmed);
      setName('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao adicionar intercessor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md liquid-glass-modal rounded-[32px] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Specular Top Rim Reflection */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-90" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/60">
          <div>
            <h2 className="font-editorial text-xl sm:text-2xl font-semibold text-[#1C2024] tracking-tight">
              Adicionar Intercessor
            </h2>
            <p className="text-xs text-[#706B62] mt-0.5 font-medium">
              Novo membro no grupo de oração
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
        <form onSubmit={handleSubmit} className="relative p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1C2024] uppercase tracking-wider mb-1.5">
              Nome ou Apelido do Intercessor
            </label>
            <input
              type="text"
              placeholder="Ex: João, Maria, Pedro..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg('');
              }}
              className="w-full h-12 px-4 liquid-glass-input rounded-2xl text-sm font-semibold text-[#1C2024] focus:outline-none focus:ring-2 focus:ring-[#58111A]/20 focus:border-[#58111A] transition-all"
              autoFocus
              maxLength={50}
            />
            <p className="text-[11px] text-[#706B62] mt-1.5">
              * Apenas o primeiro nome ou apelido como costumam se chamar no grupo de WhatsApp.
            </p>
          </div>

          <div className="p-3.5 liquid-glass-subcard rounded-2xl text-xs text-[#706B62] space-y-1">
            <span className="font-semibold text-[#1C2024] block">Como afeta o grupo:</span>
            <p>• A meta semanal do grupo aumentará automaticamente em <strong className="text-[#58111A]">140 Ave-Marias</strong>.</p>
            <p>• O histórico de semanas anteriores (1 a 16) permanecerá intacto e imutável.</p>
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
              disabled={isSubmitting}
              className="h-11 px-4 text-xs sm:text-sm font-semibold text-[#706B62] hover:text-[#1C2024] rounded-xl hover:bg-white/50 active:bg-white/80 transition-all cursor-pointer touch-manipulation"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#58111A] to-[#6E1621] hover:from-[#430C13] hover:to-[#58111A] active:scale-[0.98] rounded-xl transition-all shadow-md shadow-[#58111A]/20 flex items-center gap-2 cursor-pointer touch-manipulation disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Adicionando...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-rose-200" />
                  <span>Adicionar ao grupo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
