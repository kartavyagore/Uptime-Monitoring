'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UptimeBar from '@/components/UptimeBar';
import { useAuth } from '@/lib/auth-context';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Layers,
  Lock,
  Play,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Website & API Uptime Telemetry</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.1]">
              Know when your APIs go down{' '}
              <span className="text-blue-600">
                before your customers do
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Sub-second response time telemetry, global health checks, expected status validation, and instant state-transition email alerts.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={user ? '/dashboard' : '/login'}
                className="w-full sm:w-auto btn-brand text-sm py-3.5 px-8 font-bold text-base shadow-lg shadow-blue-500/20 hover:scale-105"
              >
                <span>{user ? 'Open Dashboard' : 'Start Monitoring Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto btn-ghost text-sm py-3.5 px-8 font-semibold"
              >
                Explore Features
              </a>
            </div>

            {/* Live Interactive Preview Card */}
            <div className="mt-16 sm:mt-20 max-w-5xl mx-auto text-left">
              <div className="p-1 rounded-3xl bg-slate-200/80 shadow-xl">
                <div className="p-6 sm:p-8 rounded-[22px] bg-white border border-slate-200">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold text-slate-900">Production Checkout Gateway API</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                            OPERATIONAL
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">https://api.payments.global/v2/healthz</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400 uppercase font-semibold">Latest Ping</p>
                        <p className="text-sm font-bold text-emerald-600 tabular-nums">42 ms</p>
                      </div>
                      <div className="w-[1px] h-8 bg-slate-200" />
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400 uppercase font-semibold">Uptime (24h)</p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums">99.99%</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Uptime Bar */}
                  <div className="my-6">
                    <UptimeBar status="UP" uptimePercentage={99.99} />
                  </div>

                  {/* 4 Metric Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium block">Avg Response</span>
                      <span className="text-lg font-extrabold text-slate-900 mt-1 block tabular-nums">68 ms</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium block">Check Frequency</span>
                      <span className="text-lg font-extrabold text-blue-600 mt-1 block">Every 30s</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium block">Total Checks (30d)</span>
                      <span className="text-lg font-extrabold text-slate-900 mt-1 block tabular-nums">86,400</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium block">Incidents</span>
                      <span className="text-lg font-extrabold text-emerald-600 mt-1 block">0 (Clean)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                Engineered For High Reliability
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-4">
                Everything you need to monitor critical services
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Built from the ground up with Spring Boot microservices, non-blocking HTTP checkers, and SSRF threat mitigation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="pro-card p-7 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-5">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Periodic Checks</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Customizable intervals down to 15 seconds. Verifies exact expected HTTP status codes and measures round-trip response latency in milliseconds.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-blue-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configurable timeouts & methods</span>
                </div>
              </div>

              <div className="pro-card p-7 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Email Alerts</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Zero spam alerting policy. Triggers instant emails when a service transitions from UP $\rightarrow$ DOWN or recovers from DOWN $\rightarrow$ UP.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deduplicated notifications</span>
                </div>
              </div>

              <div className="pro-card p-7 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-5">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">SSRF Defense Shield</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Built-in protection blocking requests targeting private networks, loopbacks (127.0.0.1), AWS cloud metadata (`169.254.169.254`), and IPv6 ranges.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pre-connection DNS resolution</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900">UptimeWatch</span>
            <span className="text-slate-300">•</span>
            <span>Production-grade website & API uptime monitoring platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
            <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
