'use client';

import { useState } from 'react';
import { monitors, CreateMonitorRequest } from '@/lib/api';
import { X, AlertCircle, Loader2, Globe, Shield } from 'lucide-react';

interface CreateMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCount: number;
}

export default function CreateMonitorModal({
  isOpen,
  onClose,
  onSuccess,
  currentCount,
}: CreateMonitorModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'general' | 'advanced'>('general');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: CreateMonitorRequest = {
        name: name.trim(),
        url: url.trim(),
        httpMethod,
        expectedStatusCode: Number(expectedStatusCode),
        intervalSeconds: Number(intervalSeconds),
        timeoutMs: Number(timeoutMs),
      };

      await monitors.create(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create monitor. Ensure monitor quota (max 3) is not exceeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Health Monitor</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active monitor quota: <strong className="text-blue-600 font-semibold">{currentCount}/3 used</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setTab('general')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'general'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Endpoint Configuration
          </button>
          <button
            type="button"
            onClick={() => setTab('advanced')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              tab === 'advanced'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timing & Timeout
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {tab === 'general' ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Friendly Monitor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe Webhook API, Production Storefront"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-pro"
                />
              </div>

              {/* Spring Boot Actuator Guidance Callout */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Spring Boot Actuator Monitoring</p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    This platform monitors <strong>Java Spring Boot APIs</strong>. Please enter your <code className="bg-white border border-blue-200 px-1 py-0.5 rounded text-blue-700 font-mono font-bold">/actuator/health</code> endpoint to automatically track individual component statuses (Database, Disk Space, Mail, SSL, Liveness & Readiness).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://api.example.com/actuator/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-pro font-mono text-xs"
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
                  <span>Example: <code className="text-blue-600">http://localhost:8080/actuator/health</code></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    HTTP Method
                  </label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="input-pro cursor-pointer"
                  >
                    <option value="GET">GET</option>
                    <option value="HEAD">HEAD</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Expected Status Code
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    max="599"
                    value={expectedStatusCode}
                    onChange={(e) => setExpectedStatusCode(Number(e.target.value))}
                    className="input-pro"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Check Frequency
                  </label>
                  <select
                    value={intervalSeconds}
                    onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                    className="input-pro cursor-pointer"
                  >
                    <option value="15">Every 15 seconds (High Frequency)</option>
                    <option value="30">Every 30 seconds</option>
                    <option value="60">Every 1 minute (Standard)</option>
                    <option value="300">Every 5 minutes</option>
                    <option value="600">Every 10 minutes</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-2">
                    How often our worker will ping your endpoint.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Request Timeout
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max="30000"
                    step="1000"
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(Number(e.target.value))}
                    className="input-pro"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">
                    Response time limit in milliseconds before marking DOWN.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                <p className="font-semibold text-blue-700 mb-0.5">Automated State Transitions</p>
                <p className="text-[11px] text-blue-800">
                  Email alerts are automatically configured on DOWN and RECOVERY events.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs py-2.5 px-4 font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-brand text-xs py-2.5 px-6 font-bold"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save & Launch Monitor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
