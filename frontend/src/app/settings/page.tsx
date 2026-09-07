'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/api';
import { ShieldCheck, User, Mail, LogOut, CheckCircle2, Lock, Send, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await auth.sendTestEmail();
      setTestResult({ status: 'success', message: res.message || 'Test email dispatched successfully! Check your inbox.' });
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Failed to dispatch test email. Please check your Gmail SMTP credentials.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your authenticated profile, security policies, and active sessions.
          </p>
        </div>

        {/* Profile Details Card */}
        <div className="pro-card p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <User className="w-4 h-4 text-blue-600" />
              Authenticated Profile
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              {user.status}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 my-6">
            {user.pictureUrl && !avatarError ? (
              <img
                src={user.pictureUrl}
                alt={user.name || 'Avatar'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-16 h-16 rounded-2xl border-2 border-blue-200 object-cover shadow-md shadow-blue-500/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-md shadow-blue-500/10">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 truncate">{user.name || 'Authenticated Google User'}</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5 truncate">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google OAuth 2.0 Identity Provider</span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold mb-1">User Identifier (UUID)</span>
              <span className="font-mono text-slate-700 select-all text-xs">{user.id}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold mb-1">Registered Since</span>
              <span className="text-slate-700 font-medium">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Gmail SMTP Notification & Verification Card */}
        <div className="pro-card p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-blue-600" />
              Gmail SMTP Email System
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Live Delivery Active
            </span>
          </div>

          <div className="my-5 space-y-3 text-xs text-slate-600">
            <p>
              Real email alerts are active via <strong>Gmail SMTP</strong> (<code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px]">smtp.gmail.com:587</code>) with STARTTLS encryption.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Sender Address</span>
                <span className="font-mono text-slate-800 font-semibold text-xs">kartavyagore0@gmail.com</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Recipient Target</span>
                <span className="font-mono text-slate-800 font-semibold text-xs">{user.email}</span>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50/80 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.status === 'success' ? 'Email Dispatched' : 'Delivery Error'}</p>
                  <p className="mt-0.5">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Verify your Gmail App Password credentials by dispatching an instant test email to your inbox.
            </p>
            <button
              onClick={handleSendTestEmail}
              disabled={testingEmail}
              className="btn-primary text-xs py-2 px-4 font-bold gap-2 inline-flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
            >
              {testingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Test...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security & Authentication Info */}
        <div className="pro-card p-6 sm:p-8 mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Security & Zero-Password Architecture
          </h2>

          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <p className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Lock className="w-4 h-4 text-blue-600" />
              Cryptographic OIDC Token Verification
            </p>
            <p className="text-slate-600">
              No passwords or hashes exist on this server. Authentication is cryptographically verified on every login session via Google&apos;s immutable <code className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">sub</code> claim.
            </p>
          </div>
        </div>

        {/* Session Termination Card */}
        <div className="pro-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sign Out Session</h3>
            <p className="text-xs text-slate-500 mt-1">
              Invalidate your active session cookie and log out of this device.
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="btn-ghost-danger text-xs py-2.5 px-5 font-bold gap-2 inline-flex items-center cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  );
}
