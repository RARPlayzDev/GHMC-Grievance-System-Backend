import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

export default function Header() {
  const { t } = useTranslation();
  const location = useLocation();

  const isOfficerRoute = location.pathname.startsWith('/officer');
  
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
                <span className="text-white font-bold text-lg leading-none">G</span>
              </div>
              <div>
                <h1 className="font-semibold text-slate-900 leading-tight">GHMC Grievance</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Resolution Platform</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

            {!isOfficerRoute ? (
              <Link 
                to="/officer/login" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors hidden sm:block"
              >
                {t('officer_login')}
              </Link>
            ) : (
              <Link 
                to="/" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                {t('home')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
