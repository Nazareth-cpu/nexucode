/**
 * Language Selector Component (Phase 4)
 *
 * Scoped strictly to the 6 confirmed platform languages:
 * C, C++, Java, Python, JavaScript, TypeScript
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Code, Check } from 'lucide-react';
import type { SupportedWorkspaceLanguage } from '../types';
import { WORKSPACE_LANGUAGES } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: SupportedWorkspaceLanguage;
  onSelectLanguage: (lang: SupportedWorkspaceLanguage) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDef = WORKSPACE_LANGUAGES[selectedLanguage];
  const languagesList = Object.values(WORKSPACE_LANGUAGES);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
          isOpen
            ? 'border-[#F59E0B] bg-[#130F35] text-[#F8FAFC]'
            : 'border-[#241D4D] bg-[#08051A] text-[#F8FAFC] hover:border-[#F59E0B]/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Code className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span className="font-mono">{currentDef?.label || 'Select Language'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#F59E0B]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 z-50 mt-1.5 w-52 rounded-xl border border-[#241D4D] bg-[#0E0B28] py-1 shadow-2xl backdrop-blur-md animate-in fade-in duration-100">
          <div className="px-3 py-1.5 border-b border-[#241D4D] text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF]">
            Platform Languages (6)
          </div>
          <div className="py-1">
            {languagesList.map((lang) => {
              const isSelected = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    isSelected
                      ? 'bg-[#130F35] text-[#F59E0B] font-semibold'
                      : 'text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#130F35]/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{lang.label}</span>
                    <span className="text-[10px] text-[#9CA3AF]/60 font-mono">
                      ({lang.version})
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
