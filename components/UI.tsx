import React from 'react';
import { TreeState } from '../types';

interface UIProps {
  currentState: TreeState;
  onToggle: () => void;
}

export const UI: React.FC<UIProps> = ({ currentState, onToggle }) => {
  const isTree = currentState === TreeState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-between p-12 text-center">
      
      {/* Header */}
      <header className="flex flex-col items-center animate-fade-in-down">
        <h2 className="text-[#FFD700] tracking-[0.5em] text-xs font-bold uppercase mb-2">
          The First Christmas with You
        </h2>
        <h1 className="text-5xl md:text-7xl font-serif text-[#F5E6BF] drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
          Merry Christmas
        </h1>
      </header>

      {/* Footer / Controls */}
      <div className="pointer-events-auto flex flex-col items-center gap-4 mb-8">
        <button
          onClick={onToggle}
          className={`
            group relative px-8 py-4 bg-transparent border border-[#FFD700]/30 
            text-[#FFD700] font-serif text-xl tracking-widest transition-all duration-700
            hover:border-[#FFD700] hover:bg-[#FFD700]/10 hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]
          `}
        >
          <span className="relative z-10">
            {isTree ? "SCATTER ESSENCE" : "ASSEMBLE FORM"}
          </span>
          <div className={`absolute inset-0 bg-[#FFD700]/5 transition-transform duration-700 origin-center scale-0 group-hover:scale-100`} />
        </button>
      </div>

    </div>
  );
};