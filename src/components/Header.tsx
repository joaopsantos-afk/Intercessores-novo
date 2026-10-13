import React from 'react';
import { History, Calendar, Compass, Sparkles } from 'lucide-react';
import { getBrasiliaStatus } from '../utils/date';

export type AppTab = 'current' | 'history' | 'missions' | 'directions';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  intercessorsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  intercessorsCount,
}) => {
  const brt = getBrasiliaStatus();
  const logoUrl = "https://res.cloudinary.com/rpbqahx1/image/upload/v1790432787/LOGO--VERTICAL--PRETO.png";

  return (
    <header className="border-b border-[#EAE4D7]/80 bg-[#FBF9F5]/85 backdrop-blur-xl sticky top-0 z-30 transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Centered Logo Composition */}
        <div className="flex flex-col items-center justify-center pt-4 pb-2.5 text-center">
          <div className="flex items-center justify-center h-16 sm:h-20 transition-transform duration-300 hover:scale-[1.02]">
            <img 
              src={logoUrl} 
              alt="Ave-Marias · Grupo de Intercessão" 
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-xs"
              loading="eager"
            />
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#58111A] px-3.5 py-0.5 rounded-full bg-[#58111A]/6 border border-[#58111A]/10">
              Intercessão · {intercessorsCount} membros
            </span>
          </div>
        </div>

        {/* Navigation Tabs - Modern Centered / Mobile Friendly (4 clean tabs) */}
        <div className="flex items-center justify-center border-t border-[#EFEAE1]/90 py-2 overflow-x-auto no-scrollbar gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'current'
                ? 'bg-[#58111A] text-white shadow-xs font-semibold'
                : 'text-[#606770] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 active:bg-[#EAE4D7]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Esta semana</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'history'
                ? 'bg-[#58111A] text-white shadow-xs font-semibold'
                : 'text-[#606770] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 active:bg-[#EAE4D7]'
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Histórico</span>
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={`h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'missions'
                ? 'bg-[#58111A] text-white shadow-xs font-semibold'
                : 'text-[#606770] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 active:bg-[#EAE4D7]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Missões</span>
          </button>

          <button
            onClick={() => setActiveTab('directions')}
            className={`h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'directions'
                ? 'bg-[#58111A] text-white shadow-xs font-semibold'
                : 'text-[#606770] hover:text-[#1C2024] hover:bg-[#EAE4D7]/60 active:bg-[#EAE4D7]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Direcionamento</span>
          </button>
        </div>
      </div>
    </header>
  );
};
