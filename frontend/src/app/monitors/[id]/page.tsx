'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UptimeBar from '@/components/UptimeBar';
import ActuatorHealthView from '@/components/ActuatorHealthView';
import EditMonitorModal from '@/components/EditMonitorModal';
import NotificationSettingsModal from '@/components/NotificationSettingsModal';
import { useAuth } from '@/lib/auth-context';
import {
  monitors,
  checks,
  statistics,
  Monitor,
  CheckResult,
  UptimeStatistics,
} from '@/lib/api';
import {
  Activity,
  ArrowLeft,
  Clock,
  Play,
  Pause,
  Trash2,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  Copy,
  Check,
} from 'lucide-react';

export default function MonitorDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [stats, setStats] = useState<UptimeStatistics[]>([]);
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && id) {
      loadMonitorData();
    }
  }, [user, authLoading, id, page]);

  const loadMonitorData = async () => {
    try {
      if (!monitor) setLoading(true);
      setRefreshing(true);

      const [monitorData, statsData, checksData] = await Promise.all([
        monitors.get(id),
        statistics.get(id),
        checks.list(id, page, 25),
      ]);

      setMonitor(monitorData);
      setStats(statsData);
      setCheckResults(checksData);
    } catch (err) {
      console.error('Error loading monitor detail:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePauseResume = async () => {
    if (!monitor) return;
    try {
      if (monitor.enabled) {
        await monitors.pause(monitor.id);
      } else {
        await monitors.resume(monitor.id);
      }
      await loadMonitorData();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDelete = async () => {
    if (!monitor) return;
    if (confirm(`Are you sure you want to delete "${monitor.name}"? All check logs will be purged.`)) {
      try {
        await monitors.delete(monitor.id);
        router.push('/dashboard');
      } catch (err) {
        console.error('Error deleting monitor:', err);
      }
    }
  };

  const copyUrl = () => {
    if (monitor) {
      navigator.clipboard.writeText(monitor.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (authLoading || loading || !monitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isUp = monitor.currentStatus === 'UP';
  const isDown = monitor.currentStatus === 'DOWN';
  const isPaused = !monitor.enabled || monitor.currentStatus === 'PAUSED';
  const stats24h = stats.find((s) => s.period === '24h') || stats[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadMonitorData}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsNotifOpen(true)}
              className="btn-ghost text-xs py-2 px-3 gap-1.5"
            >
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Email Alerts</span>
            </button>

            <button
              onClick={() => setIsEditOpen(true)}
              className="btn-ghost text-xs py-2 px-3 gap-1.5"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Edit</span>
            </button>

            <button
              onClick={handlePauseResume}
              className="btn-ghost text-xs py-2 px-3 gap-1.5 text-amber-600 hover:text-amber-700"
            >
              {monitor.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{monitor.enabled ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="btn-ghost-danger text-xs py-2 px-3 gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Hero Monitor Card */}
        <div className="pro-card p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-1.5 shrink-0">
                {isUp && <div className="w-4 h-4 rounded-full bg-emerald-500 radar-up" />}
                {isDown && <div className="w-4 h-4 rounded-full bg-rose-500 radar-down" />}
                {isPaused && <div className="w-4 h-4 rounded-full bg-amber-400" />}
                {!isUp && !isDown && !isPaused && <div className="w-4 h-4 rounded-full bg-slate-400 animate-pulse" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{monitor.name}</h1>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isDown
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isPaused
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {monitor.currentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm text-slate-600 font-mono">
                  <span className="truncate max-w-sm sm:max-w-lg text-slate-700">{monitor.url}</span>
                  <button
                    onClick={copyUrl}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={monitor.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Config Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase">Method</span>
                <span className="font-mono font-bold text-blue-700">{monitor.httpMethod}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase">Expected Code</span>
                <span className="font-mono font-bold text-slate-900">{monitor.expectedStatusCode} OK</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase">Interval</span>
                <span className="font-mono font-bold text-slate-900">Every {monitor.intervalSeconds}s</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase">Timeout</span>
                <span className="font-mono font-bold text-slate-900">{monitor.timeoutMs} ms</span>
              </div>
            </div>
          </div>

          {/* 30-Check Visual Uptime Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <UptimeBar
              status={monitor.currentStatus}
              uptimePercentage={stats24h ? stats24h.uptimePercentage : 100}
              checks={checkResults}
            />
          </div>
        </div>

        {/* Spring Boot Actuator Subsystem Health Component */}
        <ActuatorHealthView rawDetails={checkResults[0]?.errorMessage || null} />

        {/* 4 Multi-Period Availability Cards (1h, 24h, 7d, 30d) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((periodStat) => (
            <div key={periodStat.period} className="pro-card p-5">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Period ({periodStat.period})</span>
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {periodStat.totalChecks > 0 ? `${periodStat.uptimePercentage.toFixed(2)}%` : '100.00%'}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{periodStat.successfulChecks}/{periodStat.totalChecks} healthy</span>
                <span className="text-blue-600 font-mono font-semibold">{periodStat.avgResponseTimeMs}ms avg</span>
              </div>
            </div>
          ))}
        </div>

        {/* Latency Breakdown Metric Panel */}
        {stats24h && (
          <div className="pro-card p-6 sm:p-7 mb-8">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Response Time Latency Breakdown (24h Window)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Minimum Latency</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">{stats24h.minResponseTimeMs} ms</p>
                <span className="text-[11px] text-slate-400 mt-1 block">Best observed ping</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Average Latency</span>
                <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">{stats24h.avgResponseTimeMs} ms</p>
                <span className="text-[11px] text-slate-400 mt-1 block">Mean response latency</span>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Maximum Latency</span>
                <p className="text-2xl font-extrabold text-slate-800 mt-1 tabular-nums">{stats24h.maxResponseTimeMs} ms</p>
                <span className="text-[11px] text-slate-400 mt-1 block">Peak network delay</span>
              </div>
            </div>
          </div>
        )}

        {/* Historical Check Logs Table */}
        <div className="pro-card p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Execution History</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological log of automated health checks</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500 font-mono px-2">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={checkResults.length < 25}
                className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {checkResults.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No historical checks recorded yet. Next scheduled check will execute automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">HTTP Response</th>
                    <th className="py-3 px-4">Roundtrip Latency</th>
                    <th className="py-3 px-4">Checked At</th>
                    <th className="py-3 px-4">Result Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {checkResults.map((result) => {
                    const isCheckUp = result.status === 'UP';
                    return (
                      <tr key={result.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              isCheckUp
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isCheckUp ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {result.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {result.httpStatus ? `HTTP ${result.httpStatus}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-blue-700 font-semibold tabular-nums">
                          {result.responseTimeMs != null ? `${result.responseTimeMs} ms` : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-sans">
                          {new Date(result.checkedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {result.errorMessage ? (
                            <span className="text-rose-600 font-medium">{result.errorMessage}</span>
                          ) : (
                            <span className="text-slate-400 font-mono">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isEditOpen && (
        <EditMonitorModal
          monitor={monitor}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={loadMonitorData}
        />
      )}

      {isNotifOpen && (
        <NotificationSettingsModal
          monitorId={monitor.id}
          monitorName={monitor.name}
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
        />
      )}
    </div>
  );
}
