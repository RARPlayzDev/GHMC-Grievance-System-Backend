import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import './i18n';

// Lazy load pages for better performance
const CitizenPortal = React.lazy(() => import('./pages/CitizenPortal'));
const OfficerLogin = React.lazy(() => import('./pages/OfficerLogin'));
const OfficerDashboard = React.lazy(() => import('./pages/OfficerDashboard'));

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Header />
        <main className="flex-grow">
          <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            <Routes>
              <Route path="/" element={<CitizenPortal />} />
              <Route path="/officer/login" element={<OfficerLogin />} />
              <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}
