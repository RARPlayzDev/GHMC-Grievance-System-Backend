import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'hi', name: 'हिंदी (Hindi)' }
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <Globe className="w-4 h-4 text-slate-500" />
        <span>{currentLanguage.name}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors"
            >
              <span className={lang.code === currentLanguage.code ? 'font-medium text-primary-600' : 'text-slate-700'}>
                {lang.name}
              </span>
              {lang.code === currentLanguage.code && <Check className="w-4 h-4 text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
