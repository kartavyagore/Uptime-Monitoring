'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UptimeBar from '@/components/UptimeBar';
import CreateMonitorModal from '@/components/CreateMonitorModal';
import EditMonitorModal from '@/components/EditMonitorModal';
import NotificationSettingsModal from '@/components/NotificationSettingsModal';
import { useAuth } from '@/lib/auth-context';
import { monitors, Monitor } from '@/lib/api';
import {
  Activity,
  Plus,
  Play,
  Pause,
  Trash2,
  Settings,
  ExternalLink,
  Clock,
  ArrowUpRight,
  Bell,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Copy,
  Check,
  Zap,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [monitorList, setMonitorList] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UP' | 'DOWN' | 'PAUSED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [notifMonitor, setNotifMonitor] = useState<Monitor | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchMonitors();
    }
  }, [user, authLoading, router]);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const data = await monitors.list();
      setMonitorList(data);
    } catch (err) {
      console.error('Failed to fetch monitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async (monitor: Monitor, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(monitor.id);
      if (monitor.enabled) {
        await monitors.pause(monitor.id);
      } else {
        await monitors.resume(monitor.id);
      }
      await fetchMonitors();
    } catch (err) {
      console.error('Error toggling monitor status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (monitor: Monitor, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${monitor.name}"? Historical check logs will be removed.`)) {
      try {
        setActionLoading(monitor.id);
        await monitors.delete(monitor.id);
        await fetchMonitors();
      } catch (err) {
        console.error('Error deleting monitor:', err);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleCopyUrl = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Metrics
  const totalMonitors = monitorList.length;
  const upMonitors = monitorList.filter((m) => m.currentStatus === 'UP').length;
  const downMonitors = monitorList.filter((m) => m.currentStatus === 'DOWN').length;
  const pausedMonitors = monitorList.filter((m) => !m.enabled || m.currentStatus === 'PAUSED').length;

  // Filtered list
  const filteredMonitors = monitorList.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.url.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'UP') return m.currentStatus === 'UP';
    if (statusFilter === 'DOWN') return m.currentStatus === 'DOWN';
    if (statusFilter === 'PAUSED') return !m.enabled || m.currentStatus === 'PAUSED';
    return true;
  });

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Monitoring Dashboard
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700">
                <span>Plan Quota:</span>
                <strong className="text-slate-900">{totalMonitors}/3 Monitors</strong>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time health, latency, and availability metrics for all your configured services.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMonitors}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all"
              title="Refresh all monitors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              disabled={totalMonitors >= 3}
              className={`btn-brand text-xs sm:text-sm py-2.5 px-5 font-bold ${
                totalMonitors >= 3
                  ? 'opacity-40 cursor-not-allowed grayscale pointer-events-none'
                  : 'shadow-md shadow-blue-500/20 hover:scale-105'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>New Monitor</span>
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-700/60 text-white">
                {totalMonitors}/3
              </span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-8">
          <div className="pro-card p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Configured</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{totalMonitors}</span>
              <span className="text-xs text-slate-500">Max limit: 3</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(totalMonitors / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="pro-card p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Operational</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 tabular-nums">{upMonitors}</span>
              <span className="text-xs text-emerald-700 font-semibold">100% healthy</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: totalMonitors > 0 ? `${(upMonitors / totalMonitors) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="pro-card p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Incidents</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tabular-nums ${downMonitors > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {downMonitors}
              </span>
              <span className="text-xs text-slate-500">failing pings</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-200">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-300"
                style={{ width: totalMonitors > 0 ? `${(downMonitors / totalMonitors) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="pro-card p-5">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
              <span>Paused</span>
              <Pause className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 tabular-nums">{pausedMonitors}</span>
              <span className="text-xs text-slate-500">disabled checks</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-200">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: totalMonitors > 0 ? `${(pausedMonitors / totalMonitors) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-sm w-full sm:w-auto">
            {(['ALL', 'UP', 'DOWN', 'PAUSED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'ALL' ? 'All Monitors' : filter}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search monitors or URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-pro pl-9 text-xs py-2 bg-white"
            />
          </div>
        </div>

        {/* Monitors List */}
        {filteredMonitors.length === 0 && !loading ? (
          <div className="pro-card-static p-12 text-center my-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {monitorList.length === 0 ? 'No health monitors yet' : 'No monitors matching filter'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5">
              {monitorList.length === 0
                ? 'Create your first health monitor to start tracking response times and get alerted on downtime.'
                : 'Try adjusting your search query or status filter.'}
            </p>
            {monitorList.length === 0 && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn-brand mt-6 inline-flex items-center gap-2 text-xs py-2.5 px-5 font-bold"
              >
                <Plus className="w-4 h-4" />
                Add Your First Monitor
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMonitors.map((monitor) => {
              const isUp = monitor.currentStatus === 'UP';
              const isDown = monitor.currentStatus === 'DOWN';
              const isPaused = !monitor.enabled || monitor.currentStatus === 'PAUSED';

              return (
                <div
                  key={monitor.id}
                  onClick={() => router.push(`/monitors/${monitor.id}`)}
                  className="pro-card p-5 sm:p-6 cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Indicator & Main Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Live Radar Dot */}
                      <div className="mt-1.5 shrink-0">
                        {isUp && (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 radar-up" />
                        )}
                        {isDown && (
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 radar-down" />
                        )}
                        {isPaused && <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />}
                        {!isUp && !isDown && !isPaused && (
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-400 animate-pulse" />
                        )}
                      </div>

                      {/* Name & URL */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {monitor.name}
                          </h3>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
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

                          {/* Method Pill */}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200">
                            {monitor.httpMethod}
                          </span>
                        </div>

                        {/* URL + Copy button */}
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-mono">
                          <span className="truncate max-w-sm sm:max-w-md text-slate-600">{monitor.url}</span>
                          <button
                            onClick={(e) => handleCopyUrl(monitor.url, monitor.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy URL"
                          >
                            {copiedId === monitor.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className="text-slate-300">•</span>
                          <span>Every {monitor.intervalSeconds}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: 30-day BetterStack Uptime Bar */}
                    <div className="w-full lg:w-72 shrink-0">
                      <UptimeBar status={monitor.currentStatus} />
                    </div>

                    {/* Right: Quick Action Icons */}
                    <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-between lg:justify-end">
                      <div className="text-xs text-slate-500 text-left lg:text-right">
                        <span className="text-[11px] block">Last ping:</span>
                        <span className="font-mono text-slate-700 font-semibold">
                          {monitor.lastCheckedAt
                            ? new Date(monitor.lastCheckedAt).toLocaleTimeString()
                            : 'Pending...'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifMonitor(monitor);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Alert Settings"
                        >
                          <Bell className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMonitor(monitor);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handlePauseResume(monitor, e)}
                          disabled={actionLoading === monitor.id}
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title={monitor.enabled ? 'Pause' : 'Resume'}
                        >
                          {monitor.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={(e) => handleDelete(monitor, e)}
                          disabled={actionLoading === monitor.id}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateMonitorModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchMonitors}
        currentCount={totalMonitors}
      />

      {editingMonitor && (
        <EditMonitorModal
          monitor={editingMonitor}
          isOpen={!!editingMonitor}
          onClose={() => setEditingMonitor(null)}
          onSuccess={fetchMonitors}
        />
      )}

      {notifMonitor && (
        <NotificationSettingsModal
          monitorId={notifMonitor.id}
          monitorName={notifMonitor.name}
          isOpen={!!notifMonitor}
          onClose={() => setNotifMonitor(null)}
        />
      )}
    </div>
  );
}
