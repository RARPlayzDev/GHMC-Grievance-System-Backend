import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldCheck, MapPin, Clock, Smartphone } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0ea5e9] to-[#0284c7] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              GHMC Smart Grievance Management
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              A transparent, efficient, and AI-powered platform to resolve civic issues across Greater Hyderabad. Report issues instantly and track their resolution in real-time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/file-complaint"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 flex items-center"
              >
                File a Complaint <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link to="/officer/login" className="text-sm font-semibold leading-6 text-slate-900 hover:text-primary-600">
                Officer Login <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Faster Resolution</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need for a better city
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <Smartphone className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Easy Reporting
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-600">
                  Simply take a photo of the issue. Our AI automatically detects the problem category and exact location.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Smart Routing
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-600">
                  Complaints are instantly routed to the exact ward officer responsible for that specific geographic area.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <Clock className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Strict SLAs
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-600">
                  Every issue has a strict timeline for resolution. High-priority issues are escalated automatically.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Transparent Tracking
                </dt>
                <dd className="mt-2 text-base leading-7 text-slate-600">
                  Track the exact status of your complaint at any time, with before-and-after photo verification.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
