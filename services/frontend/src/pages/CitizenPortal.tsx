import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Camera, AlertTriangle, Send } from 'lucide-react';

export default function CitizenPortal() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Complaint filed successfully (offline-ready)');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl mb-3">
          {t('file_complaint', 'File a Civic Complaint')}
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Help us keep Hyderabad clean and safe. Report issues related to roads, sanitation, water, and electricity directly to GHMC.
        </p>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="space-y-6">
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                Issue Category
              </label>
              <select className="block w-full rounded-md border-0 py-2.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6 bg-white outline-none">
                <option value="ROADS">Roads & Potholes</option>
                <option value="SANITATION">Sanitation & Garbage</option>
                <option value="WATER">Water Supply & Drainage</option>
                <option value="ELECTRICITY">Streetlights & Electricity</option>
                <option value="OTHER">Other Issues</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                Description
              </label>
              <textarea 
                rows={4}
                className="block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6 outline-none"
                placeholder="Describe the issue in detail..."
                required
              />
            </div>

            {/* Location & Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                  Location
                </label>
                <button 
                  type="button"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span>Detect Location</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                  Photo Evidence
                </label>
                <button 
                  type="button"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span>Upload Photos (Max 3)</span>
                </button>
              </div>
            </div>

          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 rounded-md bg-primary-600 px-3.5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
            <p className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>False reporting may lead to penalties.</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
