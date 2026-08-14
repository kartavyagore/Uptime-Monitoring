'use client';

import { useState, useEffect } from 'react';
import { notifications, NotificationSettings } from '@/lib/api';
import { X, Bell, AlertCircle, Loader2, Check, Mail } from 'lucide-react';

interface NotificationSettingsModalProps {
  monitorId: string;
  monitorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({
  monitorId,
  monitorName,
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [notifyOnDown, setNotifyOnDown] = useState(true);
  const [notifyOnRecovery, setNotifyOnRecovery] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && monitorId) {
      loadSettings();
    }
  }, [isOpen, monitorId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await notifications.get(monitorId);
      setEmailEnabled(data.emailEnabled);
      setNotifyOnDown(data.notifyOnDown);
      setNotifyOnRecovery(data.notifyOnRecovery);
      setError(null);
    } catch (err: any) {
      setError('Could not load notification settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSavedSuccess(false);

    try {
      await notifications.update(monitorId, {
        emailEnabled,
        notifyOnDown,
        notifyOnRecovery,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update notification settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Notification Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{monitorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            {/* Master Toggle */}
            <div
              onClick={() => setEmailEnabled(!emailEnabled)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                emailEnabled
                  ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${emailEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Email Notifications</p>
                  <p className="text-xs text-slate-500">Send alerts directly to your registered Google email</p>
                </div>
              </div>
              <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${emailEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emailEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {/* Individual Triggers */}
            <div className={`space-y-3 transition-opacity ${emailEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div
                onClick={() => setNotifyOnDown(!notifyOnDown)}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Notify when Monitor goes DOWN</p>
                    <p className="text-[11px] text-slate-500">Sent on initial HTTP error or timeout (deduplicated)</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnDown}
                  onChange={(e) => setNotifyOnDown(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div
                onClick={() => setNotifyOnRecovery(!notifyOnRecovery)}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Notify when Monitor RECOVERS</p>
                    <p className="text-[11px] text-slate-500">Sent immediately upon healthy response recovery</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnRecovery}
                  onChange={(e) => setNotifyOnRecovery(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-xs py-2.5 px-4 font-semibold"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-brand text-xs py-2.5 px-6 font-bold"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {savedSuccess && <Check className="w-4 h-4 text-emerald-300" />}
                <span>{savedSuccess ? 'Preferences Saved!' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
