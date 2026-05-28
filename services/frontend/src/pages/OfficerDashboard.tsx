import React from 'react';

export default function OfficerDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officer Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Ward 42 • Active Queue</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-slate-700">System Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Pending Complaints</h3>
          <p className="text-3xl font-bold text-slate-900">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Resolved Today</h3>
          <p className="text-3xl font-bold text-slate-900">4</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">SLA Breaches</h3>
          <p className="text-3xl font-bold text-rose-600">0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-medium text-slate-900">Priority Queue</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {/* Mock Item */}
          <div className="p-6 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                    High Priority
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Bundle: 3
                  </span>
                </div>
                <h4 className="text-lg font-medium text-slate-900">Pothole on Main Road</h4>
                <p className="text-sm text-slate-500 mt-1">📍 0.3 km away | AI: 95% confident (ROADS)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">SLA: 6 hrs remaining</p>
                <button className="mt-3 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
                  Start Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
